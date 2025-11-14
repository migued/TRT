import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmailList } from '@/components/email/email-list'
import { EmailComposer } from '@/components/email/email-composer'

interface InboxPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ q?: string; type?: string; status?: string }>
}

export default async function InboxPage({ params, searchParams }: InboxPageProps) {
  const { workspace: workspaceSlug } = await params
  const { q: search, type, status } = await searchParams

  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    redirect('/')
  }

  // Build query
  let query = supabase
    .from('conversations')
    .select(`
      *,
      contacts (
        id,
        name,
        email
      ),
      quotes (
        id,
        quote_number
      ),
      orders (
        id,
        order_number
      )
    `)
    .eq('workspace_id', workspace.id)
    .eq('type', 'email')
    .order('sent_at', { ascending: false })

  // Apply filters
  if (search) {
    query = query.or(`subject.ilike.%${search}%,body.ilike.%${search}%`)
  }

  if (type) {
    query = query.eq('direction', type)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data: emails } = await query.limit(100)

  // Get email stats
  const { data: stats } = await supabase
    .from('conversations')
    .select('direction, status')
    .eq('workspace_id', workspace.id)
    .eq('type', 'email')

  const emailStats = {
    total: stats?.length || 0,
    sent: stats?.filter(s => s.direction === 'outbound').length || 0,
    received: stats?.filter(s => s.direction === 'inbound').length || 0,
    unread: stats?.filter(s => s.status === 'delivered' && !s.opened_at).length || 0
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <EmailList
        emails={emails || []}
        stats={emailStats}
        workspaceId={workspace.id}
        workspaceSlug={workspaceSlug}
        initialSearch={search}
        initialType={type}
        initialStatus={status}
      />
    </div>
  )
}
