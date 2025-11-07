import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { Loader2 } from 'lucide-react'

interface DashboardPageProps {
  params: Promise<{ workspace: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspace: workspaceSlug } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Bienvenido
        </h1>
        <p className="mt-2 text-slate-600">
          Aquí tienes un resumen de tu negocio
        </p>
      </div>

      {/* Stats Grid - loads async */}
      <Suspense fallback={<StatsGridSkeleton />}>
        <StatsGrid workspaceSlug={workspaceSlug} />
      </Suspense>

      {/* Quick Actions - shows immediately */}
      <div className="rounded-lg bg-white p-6 shadow border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">
          Acciones Rápidas
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            title="Nuevo Contacto"
            href={`/${workspaceSlug}/contactos/new`}
          />
          <QuickAction
            title="Nueva Empresa"
            href={`/${workspaceSlug}/empresas/new`}
          />
          <QuickAction
            title="Nueva Oportunidad"
            href={`/${workspaceSlug}/oportunidades/new`}
          />
          <QuickAction
            title="Nueva Cotización"
            href={`/${workspaceSlug}/cotizaciones/new`}
          />
        </div>
      </div>
    </div>
  )
}

async function StatsGrid({ workspaceSlug }: { workspaceSlug: string }) {
  const supabase = await createClient()

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    return <div>Workspace not found</div>
  }

  // Get counts in parallel
  const [
    { count: contactsCount },
    { count: opportunitiesCount },
    { count: projectsCount },
    { count: ordersCount }
  ] = await Promise.all([
    supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id),
  ])

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Contactos"
        value={contactsCount || 0}
        href={`/${workspaceSlug}/contactos`}
      />
      <StatCard
        title="Oportunidades"
        value={opportunitiesCount || 0}
        href={`/${workspaceSlug}/oportunidades`}
      />
      <StatCard
        title="Proyectos"
        value={projectsCount || 0}
        href={`/${workspaceSlug}/proyectos`}
      />
      <StatCard
        title="Órdenes"
        value={ordersCount || 0}
        href={`/${workspaceSlug}/ordenes`}
      />
    </div>
  )
}

function StatsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-lg bg-white p-6 shadow border border-slate-200">
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse mb-3" />
          <div className="h-8 w-16 bg-slate-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

function StatCard({
  title,
  value,
  href,
}: {
  title: string
  value: number
  href: string
}) {
  return (
    <a
      href={href}
      className="rounded-lg bg-white p-6 shadow border border-slate-200 transition-shadow hover:shadow-md"
    >
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </a>
  )
}

function QuickAction({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
    >
      {title}
    </a>
  )
}
