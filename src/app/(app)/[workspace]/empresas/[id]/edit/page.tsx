import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditCompanyForm } from '@/components/companies/edit-company-form'

interface EditCompanyPageProps {
  params: {
    workspace: string
    id: string
  }
}

export default async function EditCompanyPage({ params }: EditCompanyPageProps) {
  const { workspace: workspaceSlug, id: companyId } = params
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

  // Get company
  const { data: company, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !company) {
    notFound()
  }

  return <EditCompanyForm company={company} workspaceSlug={workspaceSlug} />
}
