import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditOpportunityForm } from '@/components/opportunities/edit-opportunity-form'

interface EditOpportunityPageProps {
  params: {
    workspace: string
    id: string
  }
}

export default async function EditOpportunityPage({ params }: EditOpportunityPageProps) {
  const { workspace: workspaceSlug, id: opportunityId } = params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    notFound()
  }

  // Get opportunity
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      contacts (
        id,
        name,
        email,
        companies (
          id,
          name
        )
      )
    `)
    .eq('id', opportunityId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  // Get stages
  const { data: stages } = await supabase
    .from('custom_stages')
    .select('id, name')
    .eq('workspace_id', workspace.id)
    .eq('type', 'opportunity')
    .eq('stage_type', 'active')
    .order('order_index', { ascending: true })

  return (
    <EditOpportunityForm
      opportunity={opportunity}
      stages={stages || []}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
    />
  )
}
