import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AIChatInterface from '@/components/ai-chat/chat-interface'

interface AIChatPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ conversation?: string }>
}

export default async function AIChatPage({ params, searchParams }: AIChatPageProps) {
  const { workspace: workspaceSlug } = await params
  const { conversation: conversationId } = await searchParams

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's workspace
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <AIChatInterface
        workspaceId={profile.workspace_id}
        initialConversationId={conversationId}
      />
    </div>
  )
}
