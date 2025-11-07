import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { EditContactForm } from '@/components/contacts/edit-contact-form'

interface EditContactPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function EditContactPage({ params }: EditContactPageProps) {
  const { workspace: workspaceSlug, id: contactId } = await params
  const supabase = await createClient()

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    redirect('/login')
  }

  // Get contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !contact) {
    notFound()
  }

  return (
    <EditContactForm
      workspaceSlug={workspaceSlug}
      contact={contact}
    />
  )
}
