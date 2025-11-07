import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/ai-chat/conversations/[id]/export
 * Export conversation as markdown or JSON
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: conversationId } = await context.params
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'markdown' // markdown or json

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get all messages
    const { data: messages, error: msgError } = await supabase
      .from('ai_messages')
      .select(`
        *,
        ai_file_attachments (*)
      `)
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true })

    if (msgError) {
      console.error('Error fetching messages:', msgError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    if (format === 'json') {
      // Export as JSON
      const exportData = {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at,
          message_count: conversation.message_count,
          total_tokens_used: conversation.total_tokens_used,
          total_cost: conversation.total_cost
        },
        messages: messages?.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          reasoning: msg.reasoning,
          created_at: msg.created_at,
          model: msg.model,
          tokens: {
            input: msg.input_tokens,
            output: msg.output_tokens,
            reasoning: msg.reasoning_tokens,
            total: msg.total_tokens
          },
          cost: msg.cost,
          files: msg.ai_file_attachments || []
        })) || []
      }

      return new Response(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="conversation-${conversationId}.json"`
        }
      })
    } else {
      // Export as Markdown
      const title = conversation.title || 'Untitled Conversation'
      const createdAt = new Date(conversation.created_at).toLocaleString()

      let markdown = `# ${title}\n\n`
      markdown += `**Created:** ${createdAt}\n`
      markdown += `**Messages:** ${conversation.message_count}\n`
      markdown += `**Total Tokens:** ${conversation.total_tokens_used}\n`
      markdown += `**Total Cost:** $${conversation.total_cost}\n\n`
      markdown += `---\n\n`

      for (const msg of messages || []) {
        const roleIcon = msg.role === 'user' ? '👤' : '🤖'
        const timestamp = new Date(msg.created_at).toLocaleTimeString()

        markdown += `## ${roleIcon} ${msg.role.toUpperCase()} - ${timestamp}\n\n`

        // Add reasoning if present
        if (msg.reasoning) {
          markdown += `### 💭 Reasoning Process\n\n`
          markdown += `\`\`\`\n${msg.reasoning}\n\`\`\`\n\n`
        }

        // Add main content
        markdown += `${msg.content}\n\n`

        // Add file attachments if present
        if (msg.ai_file_attachments && msg.ai_file_attachments.length > 0) {
          markdown += `**Attachments:**\n`
          for (const file of msg.ai_file_attachments) {
            markdown += `- 📎 ${file.file_name} (${file.file_type})\n`
          }
          markdown += `\n`
        }

        // Add metadata
        if (msg.role === 'assistant') {
          markdown += `*Model: ${msg.model} | Tokens: ${msg.total_tokens} | Cost: $${msg.cost}*\n\n`
        }

        markdown += `---\n\n`
      }

      return new Response(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="conversation-${conversationId}.md"`
        }
      })
    }
  } catch (error: any) {
    console.error('Error in GET /api/ai-chat/conversations/[id]/export:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
