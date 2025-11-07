import { createClient } from '@/lib/supabase/server'
import { Folder, Calendar, CheckCircle, Clock } from 'lucide-react'
import { ProjectKanban } from '@/components/projects/project-kanban'

interface ProjectsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    return <div>Workspace not found</div>
  }

  // Get custom stages for projects
  const { data: stages } = await supabase
    .from('custom_stages')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('type', 'project')
    .order('order_index', { ascending: true })

  // Get all projects with contact and order info
  const { data: projects, error } = await supabase
    .from('projects')
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
      ),
      orders (
        id,
        order_number
      )
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Proyectos</h1>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
          <p className="text-slate-900 font-semibold">Error al cargar proyectos</p>
          <p className="text-sm text-slate-600 mt-2">{error.message}</p>
          <p className="text-xs text-slate-500 mt-2">Código: {error.code}</p>
        </div>
      </div>
    )
  }

  // Filter active projects
  const activeProjects = projects?.filter(p => p.status === 'active') || []

  // Calculate statistics
  const stats = {
    total: projects?.length || 0,
    active: activeProjects.length,
    onTime: activeProjects.filter(p => {
      if (!p.due_date) return true
      return new Date(p.due_date) >= new Date()
    }).length,
    overdue: activeProjects.filter(p => {
      if (!p.due_date) return false
      return new Date(p.due_date) < new Date()
    }).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Proyectos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestión de proyectos y entregas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Folder className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Proyectos</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Clock className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Activos</p>
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">A Tiempo</p>
              <p className="text-2xl font-bold text-slate-900">{stats.onTime}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Calendar className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Atrasados</p>
              <p className="text-2xl font-bold text-slate-900">{stats.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board or Empty State */}
      {!projects || projects.length === 0 ? (
        <div className="rounded-lg bg-white border border-slate-200 p-12 text-center">
          <Folder className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900">No hay proyectos</h3>
          <p className="mt-2 text-sm text-slate-600">
            Crea tu primer proyecto para comenzar.
          </p>
        </div>
      ) : stages && stages.length > 0 ? (
        <ProjectKanban
          stages={stages}
          projects={projects}
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
        />
      ) : (
        <div className="rounded-lg bg-white border border-slate-200 p-12 text-center">
          <h3 className="text-lg font-medium text-slate-900">No hay etapas configuradas</h3>
          <p className="mt-2 text-sm text-slate-600">
            Se requieren etapas para gestionar proyectos. Contacta al administrador.
          </p>
        </div>
      )}
    </div>
  )
}
