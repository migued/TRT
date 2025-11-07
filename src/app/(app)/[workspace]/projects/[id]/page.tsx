import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Folder, User, Building2, Calendar, ShoppingCart, CheckCircle, Clock } from 'lucide-react'
import { ProjectTasks } from '@/components/projects/project-tasks'
import { UpdateProjectStatusButton } from '@/components/projects/update-project-status-button'
import { AIAssistant } from '@/components/ai/ai-assistant'

interface ProjectDetailPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { workspace: workspaceSlug, id } = await params
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

  // Get project
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      contacts (
        id,
        name,
        email,
        phone,
        companies (
          id,
          name
        )
      ),
      orders (
        id,
        order_number,
        total,
        currency
      )
    `)
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !project) {
    notFound()
  }

  // Get tasks for this project
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  // Get project transactions (expenses)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('project_id', id)
    .order('transaction_date', { ascending: false })

  const contact = project.contacts
  const company = contact?.companies

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const statusConfig = {
    active: { label: 'Activo', color: 'bg-slate-100 text-slate-600' },
    completed: { label: 'Completado', color: 'bg-slate-100 text-slate-600' },
    on_hold: { label: 'En Pausa', color: 'bg-slate-100 text-slate-600' },
    cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-600' },
  }

  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.active

  const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0
  const totalTasks = tasks?.length || 0
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const totalExpenses = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${workspaceSlug}/projects`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a proyectos
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-2 text-slate-600">
              {project.description || 'Sin descripción'}
            </p>
          </div>

          {project.status === 'active' && (
            <UpdateProjectStatusButton
              projectId={project.id}
              workspaceSlug={workspaceSlug}
            />
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Progreso</span>
          <span className="text-sm font-semibold text-slate-900">{progress}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div
            className="bg-slate-100 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
          <span>{completedTasks} de {totalTasks} tareas completadas</span>
          {project.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Entrega: {formatDate(project.due_date)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Tasks */}
        <div className="lg:col-span-2">
          <ProjectTasks
            projectId={project.id}
            workspaceId={workspace.id}
            initialTasks={tasks || []}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Cliente</h3>
            {contact ? (
              <div>
                <Link
                  href={`/${workspaceSlug}/contacts/${contact.id}`}
                  className="flex items-center gap-2 text-slate-600 hover:text-slate-600 font-medium"
                >
                  <User className="h-4 w-4" />
                  {contact.name}
                </Link>
                {company && (
                  <Link
                    href={`/${workspaceSlug}/companies/${company.id}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-600 mt-2"
                  >
                    <Building2 className="h-3 w-3" />
                    {company.name}
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Sin cliente</p>
            )}
          </div>

          {/* Related Order */}
          {project.orders && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Orden Origen</h3>
              <Link
                href={`/${workspaceSlug}/orders/${project.orders.id}`}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-600"
              >
                <ShoppingCart className="h-4 w-4" />
                {project.orders.order_number}
              </Link>
              <p className="text-sm text-slate-600 mt-2">
                {formatter.format(project.orders.total)}
              </p>
            </div>
          )}

          {/* Project Dates */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Fechas</h3>
            <div className="space-y-3">
              {project.start_date && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Inicio</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(project.start_date)}
                  </div>
                </div>
              )}

              {project.due_date && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Entrega</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    {formatDate(project.due_date)}
                  </div>
                </div>
              )}

              {project.completed_at && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Completado</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <CheckCircle className="h-4 w-4 text-slate-600" />
                    {formatDate(project.completed_at)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          {transactions && transactions.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Gastos del Proyecto</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Total Gastos</span>
                  <span className="font-semibold text-slate-600">{formatter.format(totalExpenses)}</span>
                </div>
                <Link
                  href={`/${workspaceSlug}/financial?project=${project.id}`}
                  className="block text-sm text-slate-600 hover:text-slate-600"
                >
                  Ver todas las transacciones →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        workspaceId={workspace.id}
        projectId={project.id}
        contactId={contact?.id}
      />
    </div>
  )
}
