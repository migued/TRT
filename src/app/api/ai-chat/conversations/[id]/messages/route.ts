import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOpenRouterClient, ChatMessage, Models, ReasoningPresets } from '@/lib/ai/openrouter'
import { usageTracker } from '@/lib/ai/usage-tracking'

export const runtime = 'nodejs'
export const maxDuration = 60

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/ai-chat/conversations/[id]/messages
 * Send a message and get AI response with streaming
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: conversationId } = await context.params
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check usage limits (soft limit)
    const usageCheck = await usageTracker.checkUsageLimit(user.id, profile.workspace_id)

    const body = await request.json()
    const { content, files, useReasoning = true } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify conversation ownership
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get previous messages for context
    const { data: previousMessages } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true })
      .limit(20) // Last 20 messages for context

    const messageHistory: ChatMessage[] = (previousMessages || []).map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      reasoning: msg.reasoning || undefined,
      reasoning_details: msg.reasoning_details || undefined
    }))

    // Get next sequence number
    const nextSequence = (previousMessages?.length || 0) + 1

    // Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
        sequence_number: nextSequence,
        model: Models.GROK_4_FAST
      })
      .select()
      .single()

    if (userMsgError || !userMessage) {
      console.error('Error saving user message:', userMsgError)
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      )
    }

    // Handle file attachments if provided
    let fileContext = ''
    if (files && Array.isArray(files) && files.length > 0) {
      // Files are expected to be already uploaded to storage
      // Save file attachments to ai_file_attachments table
      for (const file of files) {
        const { error: fileError } = await supabase
          .from('ai_file_attachments')
          .insert({
            message_id: userMessage.id,
            file_name: file.fileName,
            file_type: file.fileType,
            file_size: file.fileSize,
            mime_type: file.mimeType,
            storage_path: file.storagePath,
            storage_url: file.storageUrl,
            processing_status: 'pending'
          })

        if (fileError) {
          console.error('Error saving file attachment:', fileError)
          // Continue with other files even if one fails
        }
      }

      // Add context about attached files to the message
      fileContext = `\n\n[User attached ${files.length} file(s): ${files.map((f: any) => f.fileName).join(', ')}]`
    }

    // Build messages for AI
    const aiMessages: ChatMessage[] = [
      ...messageHistory,
      {
        role: 'user',
        content: content + fileContext
      }
    ]

    // Create OpenRouter client
    const openRouter = createOpenRouterClient()

    // Prepare streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          let fullReasoning = ''
          let reasoningDetails: any[] = []
          let totalInputTokens = 0
          let totalOutputTokens = 0

          // Stream the response using Grok 4 Fast for reasoning
          const streamGenerator = openRouter.createStreamingChatCompletion({
            model: Models.GROK_4_FAST,
            messages: aiMessages,
            reasoning: useReasoning ? ReasoningPresets.MEDIUM : undefined,
            temperature: 0.7,
            max_tokens: 4096,
          })

          for await (const chunk of streamGenerator) {
            const delta = chunk.choices[0]?.delta

            // Handle content
            if (delta?.content) {
              fullContent += delta.content
              // Send content chunk to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                content: delta.content
              })}\n\n`))
            }

            // Handle reasoning tokens
            if (delta?.reasoning) {
              fullReasoning += delta.reasoning
              // Send reasoning chunk to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'reasoning',
                reasoning: delta.reasoning
              })}\n\n`))
            }

            // Handle reasoning details
            if (delta?.reasoning_details) {
              reasoningDetails.push(...delta.reasoning_details)
            }

            // Handle usage info
            if (chunk.usage) {
              totalInputTokens = chunk.usage.prompt_tokens || 0
              totalOutputTokens = chunk.usage.completion_tokens || 0
            }
          }

          // Calculate cost
          const totalTokens = totalInputTokens + totalOutputTokens
          const cost = usageTracker.calculateCost(
            Models.GROK_4_FAST,
            totalInputTokens,
            totalOutputTokens
          )

          // Save assistant message
          const { data: assistantMessage, error: assistantMsgError } = await supabase
            .from('ai_messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullContent,
              reasoning: fullReasoning || null,
              reasoning_details: reasoningDetails.length > 0 ? reasoningDetails : null,
              sequence_number: nextSequence + 1,
              model: Models.GROK_4_FAST,
              input_tokens: totalInputTokens,
              output_tokens: totalOutputTokens,
              total_tokens: totalTokens,
              cost
            })
            .select()
            .single()

          if (assistantMsgError) {
            console.error('Error saving assistant message:', assistantMsgError)
          }

          // Update usage tracking
          await usageTracker.updateUsage(user.id, profile.workspace_id, {
            tokens: totalTokens,
            cost
          })

          // Send completion event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            messageId: assistantMessage?.id,
            usage: {
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalTokens,
              cost
            },
            warning: usageCheck.warning
          })}\n\n`))

          controller.close()
        } catch (error: any) {
          console.error('Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error.message
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('Error in POST /api/ai-chat/conversations/[id]/messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
