import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'

interface AppLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspace: string }>
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user has access to this workspace
  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id, workspaces(slug, name)')
    .eq('id', user.id)
    .single()

  if (!profile?.workspaces) {
    redirect('/onboarding')
  }

  const userWorkspaceSlug = (profile.workspaces as any).slug

  // Check if user is trying to access their workspace
  if (userWorkspaceSlug !== workspaceSlug) {
    // User trying to access wrong workspace, redirect to their workspace
    redirect(`/${userWorkspaceSlug}`)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar workspaceSlug={workspaceSlug} />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
