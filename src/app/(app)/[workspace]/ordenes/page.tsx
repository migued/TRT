import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, DollarSign, Clock, CheckCircle } from 'lucide-react'
import { OrdersTable } from '@/components/orders/orders-table'

interface OrdersPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function OrdersPage({ params, searchParams }: OrdersPageProps) {
  const { workspace: workspaceSlug } = await params
  const { status: statusFilter } = await searchParams
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

  // Build query
  let query = supabase
    .from('orders')
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
      quotes (
        id,
        quote_number
      )
    `)
    .eq('workspace_id', workspace.id)

  // Apply status filter if provided
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: orders, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching orders:', error)
    return <div>Error loading orders</div>
  }

  // Calculate statistics
  const stats = {
    total: orders?.length || 0,
    pending: orders?.filter(o => o.status === 'pending').length || 0,
    inProgress: orders?.filter(o => o.status === 'in_progress').length || 0,
    completed: orders?.filter(o => o.status === 'completed').length || 0,
    totalRevenue: orders?.filter(o => o.status === 'completed').reduce((sum, o) => sum + (o.total || 0), 0) || 0,
    pendingRevenue: orders?.filter(o => o.status !== 'completed' && o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0) || 0,
  }

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Órdenes de Venta</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestión de órdenes confirmadas
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">En Proceso</p>
              <p className="text-2xl font-bold text-slate-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Completadas</p>
              <p className="text-2xl font-bold text-slate-900">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Ingresos Completados</p>
              <p className="text-2xl font-bold text-slate-900">{formatter.format(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <OrdersTable
        orders={orders || []}
        workspaceSlug={workspaceSlug}
        currentStatus={statusFilter || 'all'}
      />
    </div>
  )
}
