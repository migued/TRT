import Link from 'next/link'
import { ShoppingCart, Eye } from 'lucide-react'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  currency: string
  created_at: string
  contacts: {
    id: string
    name: string
    email: string
    companies: {
      id: string
      name: string
    } | null
  } | null
  quotes: {
    id: string
    quote_number: string
  } | null
}

interface OrdersTableProps {
  orders: Order[]
  workspaceSlug: string
  currentStatus: string
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-slate-100 text-slate-600' },
  in_progress: { label: 'En Proceso', color: 'bg-slate-100 text-slate-600' },
  completed: { label: 'Completada', color: 'bg-slate-100 text-slate-600' },
  cancelled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-600' },
}

export function OrdersTable({ orders, workspaceSlug, currentStatus }: OrdersTableProps) {
  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const statusTabs = [
    { value: 'all', label: 'Todas', count: orders.length },
    { value: 'pending', label: 'Pendientes', count: orders.filter(o => o.status === 'pending').length },
    { value: 'in_progress', label: 'En Proceso', count: orders.filter(o => o.status === 'in_progress').length },
    { value: 'completed', label: 'Completadas', count: orders.filter(o => o.status === 'completed').length },
    { value: 'cancelled', label: 'Canceladas', count: orders.filter(o => o.status === 'cancelled').length },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Status Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2 px-6 -mb-px overflow-x-auto">
          {statusTabs.map(tab => (
            <Link
              key={tab.value}
              href={`/${workspaceSlug}/orders${tab.value !== 'all' ? `?status=${tab.value}` : ''}`}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                ${currentStatus === tab.value
                  ? 'border-slate-200 text-slate-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }
              `}
            >
              {tab.label} ({tab.count})
            </Link>
          ))}
        </nav>
      </div>

      {/* Table */}
      {orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Número
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Cotización
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map(order => {
                const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending

                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/${workspaceSlug}/orders/${order.id}`}
                        className="font-medium text-slate-600 hover:text-slate-600 flex items-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {order.contacts?.name || 'Sin contacto'}
                        </div>
                        {order.contacts?.companies && (
                          <div className="text-sm text-slate-500">
                            {order.contacts.companies.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {order.quotes ? (
                        <Link
                          href={`/${workspaceSlug}/quotes/${order.quotes.id}`}
                          className="text-sm text-slate-600 hover:text-slate-600"
                        >
                          {order.quotes.quote_number}
                        </Link>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatter.format(order.total || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/${workspaceSlug}/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-600"
                      >
                        <Eye className="h-4 w-4" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <ShoppingCart className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No hay órdenes</h3>
          <p className="mt-1 text-sm text-slate-500">
            {currentStatus === 'all'
              ? 'Las órdenes se crean a partir de cotizaciones aceptadas.'
              : 'No hay órdenes con este estado.'}
          </p>
        </div>
      )}
    </div>
  )
}
