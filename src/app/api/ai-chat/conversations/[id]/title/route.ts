import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOpenRouterClient } from '@/lib/ai/openrouter'

export const runtime = 'edge'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/ai-chat/conversations/[id]/title
 * Auto-generate a title for the conversation based on its messages
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

    // Get first few messages
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: true })
      .limit(4)

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found to generate title' },
        { status: 400 }
      )
    }

    // Generate title using AI
    const openRouter = createOpenRouterClient()
    const title = await openRouter.generateConversationTitle(
      messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }))
    )

    // Update conversation with generated title
    const { error: updateError } = await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating conversation title:', updateError)
      return NextResponse.json(
        { error: 'Failed to update title' },
        { status: 500 }
      )
    }

    return NextResponse.json({ title })
  } catch (error: any) {
    console.error('Error in POST /api/ai-chat/conversations/[id]/title:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
