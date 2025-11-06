import { createClient } from '@/lib/supabase/server'

interface DashboardPageProps {
  params: Promise<{ workspace: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { workspace: workspaceSlug } = await params
  const supabase = await createClient()

  // Get workspace data
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', workspaceSlug)
    .single()

  // Get some stats (we'll implement these queries properly later)
  const { count: contactsCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id || '')

  const { count: opportunitiesCount } = await supabase
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id || '')

  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id || '')

  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace?.id || '')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Bienvenido a {workspace?.name}
        </h1>
        <p className="mt-2 text-slate-600">
          Aquí tienes un resumen de tu negocio
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Contactos"
          value={contactsCount || 0}
          href={`/${workspaceSlug}/contacts`}
          color="blue"
        />
        <StatCard
          title="Oportunidades"
          value={opportunitiesCount || 0}
          href={`/${workspaceSlug}/opportunities`}
          color="green"
        />
        <StatCard
          title="Proyectos"
          value={projectsCount || 0}
          href={`/${workspaceSlug}/projects`}
          color="purple"
        />
        <StatCard
          title="Órdenes"
          value={ordersCount || 0}
          href={`/${workspaceSlug}/orders`}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-slate-900">
          Acciones Rápidas
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            title="Nuevo Contacto"
            href={`/${workspaceSlug}/contacts/new`}
          />
          <QuickAction
            title="Nueva Oportunidad"
            href={`/${workspaceSlug}/opportunities/new`}
          />
          <QuickAction
            title="Nueva Cotización"
            href={`/${workspaceSlug}/quotes/new`}
          />
          <QuickAction
            title="Nuevo Proyecto"
            href={`/${workspaceSlug}/projects/new`}
          />
        </div>
      </div>

      {/* Getting Started */}
      {contactsCount === 0 && opportunitiesCount === 0 && (
        <div className="rounded-lg bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900">
            ¡Comienza a usar TRT Platform!
          </h2>
          <p className="mt-2 text-blue-800">
            Para empezar, te recomendamos:
          </p>
          <ul className="mt-4 space-y-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                1
              </span>
              <span>
                Agrega tus primeros contactos en la sección{' '}
                <a
                  href={`/${workspaceSlug}/contacts`}
                  className="font-medium underline"
                >
                  Contactos
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                2
              </span>
              <span>
                Crea tu catálogo de productos en{' '}
                <a
                  href={`/${workspaceSlug}/products`}
                  className="font-medium underline"
                >
                  Productos
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                3
              </span>
              <span>
                Crea tu primera oportunidad de venta en{' '}
                <a
                  href={`/${workspaceSlug}/opportunities`}
                  className="font-medium underline"
                >
                  Oportunidades
                </a>
              </span>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  href,
  color,
}: {
  title: string
  value: number
  href: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
  }

  return (
    <a
      href={href}
      className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-full p-3 ${colorClasses[color]}`}>
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
      </div>
    </a>
  )
}

function QuickAction({ title, href }: { title: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-4 text-center font-medium text-slate-700 transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
    >
      {title}
    </a>
  )
}
