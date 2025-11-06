'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const [workspaceName, setWorkspaceName] = useState('')
  const [workspaceSlug, setWorkspaceSlug] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
      } else {
        setUser(user)
        // Check if user already has workspace
        const { data: profile } = await supabase
          .from('profiles')
          .select('workspace_id, workspaces(slug)')
          .eq('id', user.id)
          .single()

        if (profile?.workspaces) {
          // Already has workspace, redirect
          const slug = (profile.workspaces as any).slug
          router.push(`/${slug}`)
        }
      }
    }

    getUser()
  }, [router])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 30)
  }

  const handleWorkspaceNameChange = (name: string) => {
    setWorkspaceName(name)
    setWorkspaceSlug(generateSlug(name))
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          slug: workspaceSlug,
        })
        .select()
        .single()

      if (workspaceError) throw workspaceError

      // Create profile linking user to workspace
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          workspace_id: workspace.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString(),
        })

      if (profileError) throw profileError

      // Initialize default stages for the workspace
      const { error: stagesError } = await supabase.rpc(
        'initialize_default_stages',
        { p_workspace_id: workspace.id }
      )

      if (stagesError) {
        console.error('Error initializing stages:', stagesError)
        // Don't fail onboarding if stages fail
      }

      // Redirect to workspace
      router.push(`/${workspaceSlug}`)
    } catch (err: any) {
      console.error('Onboarding error:', err)
      setError(err.message || 'Error al crear workspace')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Crea tu Workspace
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Este será el espacio donde gestionarás tu negocio
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800">
          <form onSubmit={handleCreateWorkspace} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="workspaceName"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Nombre del Workspace
              </label>
              <input
                id="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                placeholder="Mi Empresa"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                El nombre de tu negocio o empresa
              </p>
            </div>

            <div>
              <label
                htmlFor="workspaceSlug"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                URL del Workspace
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  platform.com/
                </span>
                <input
                  id="workspaceSlug"
                  type="text"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  required
                  pattern="[a-z0-9-]+"
                  className="block w-full rounded-r-md border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  placeholder="mi-empresa"
                />
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Solo letras minúsculas, números y guiones
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !workspaceName || !workspaceSlug}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando workspace...' : 'Crear Workspace'}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="font-medium text-blue-900 dark:text-blue-300">
            ¿Qué incluye tu workspace?
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-400">
            <li>✓ CRM para gestionar contactos y empresas</li>
            <li>✓ Pipeline de ventas con oportunidades</li>
            <li>✓ Gestión de proyectos y tareas</li>
            <li>✓ Tracking financiero completo</li>
            <li>✓ Catálogo de productos</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
