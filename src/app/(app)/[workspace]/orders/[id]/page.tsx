import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, User, Building2, Calendar, Mail, Phone, FileText, ExternalLink, DollarSign } from 'lucide-react'
import { UpdateOrderStatusButton } from '@/components/orders/update-order-status-button'
import { CreateProjectButton } from '@/components/projects/create-project-button'

interface OrderDetailPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
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

  // Get order with contact info
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      contacts (
        id,
        name,
        email,
        phone,
        companies (
          id,
          name,
          website
        )
      ),
      quotes (
        id,
        quote_number
      )
    `)
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !order) {
    notFound()
  }

  // Check if project already exists for this order
  const { data: existingProject } = await supabase
    .from('projects')
    .select('id, title')
    .eq('order_id', id)
    .single()

  // Get transactions related to this order
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('order_id', id)
    .order('transaction_date', { ascending: false })

  const contact = order.contacts
  const company = contact?.companies

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: order.currency || 'MXN',
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
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
    in_progress: { label: 'En Proceso', color: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${workspaceSlug}/orders`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a órdenes
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{order.order_number}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-2 text-slate-600">
              Creada el {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {order.status !== 'completed' && order.status !== 'cancelled' && (
              <UpdateOrderStatusButton
                orderId={order.id}
                currentStatus={order.status}
                workspaceSlug={workspaceSlug}
              />
            )}

            {order.status === 'completed' && !existingProject && (
              <CreateProjectButton
                orderId={order.id}
                workspaceSlug={workspaceSlug}
                workspaceId={workspace.id}
              />
            )}

            {existingProject && (
              <Link
                href={`/${workspaceSlug}/projects/${existingProject.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <FileText className="h-4 w-4" />
                Ver Proyecto
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Artículos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                      Descripción
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                      Cantidad
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                      Precio Unit.
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-slate-900">{item.description}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{item.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{formatter.format(item.unit_price)}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">{formatter.format(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <div className="max-w-sm ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium text-slate-900">{formatter.format(order.subtotal || 0)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Descuento:</span>
                    <span className="font-medium text-red-600">-{formatter.format(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA:</span>
                  <span className="font-medium text-slate-900">{formatter.format(order.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-orange-600">{formatter.format(order.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions */}
          {transactions && transactions.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Transacciones</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {transactions.map(transaction => (
                  <div key={transaction.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{transaction.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-600">
                        <span>{formatDate(transaction.transaction_date)}</span>
                        {transaction.payment_method && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            {transaction.payment_method}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatter.format(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notas</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Información del Cliente</h3>
            {contact ? (
              <div className="space-y-4">
                <div>
                  <Link
                    href={`/${workspaceSlug}/contacts/${contact.id}`}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                  >
                    <User className="h-4 w-4" />
                    {contact.name}
                  </Link>
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-2">
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </div>
                  )}
                </div>

                {company && (
                  <div className="pt-4 border-t border-slate-200">
                    <Link
                      href={`/${workspaceSlug}/companies/${company.id}`}
                      className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                    >
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </Link>
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-orange-600 mt-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {company.website}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No hay contacto asociado</p>
            )}
          </div>

          {/* Related Quote */}
          {order.quotes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Cotización Origen</h3>
              <Link
                href={`/${workspaceSlug}/quotes/${order.quotes.id}`}
                className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
              >
                <FileText className="h-4 w-4" />
                {order.quotes.quote_number}
              </Link>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Historial</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-slate-400"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Orden creada</p>
                  <p className="text-xs text-slate-500">{formatDate(order.created_at)}</p>
                </div>
              </div>

              {order.invoiced_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Facturada</p>
                    <p className="text-xs text-slate-500">{formatDate(order.invoiced_at)}</p>
                    {order.alegra_invoice_number && (
                      <p className="text-xs text-slate-600 mt-1">#{order.alegra_invoice_number}</p>
                    )}
                  </div>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-green-400"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Completada</p>
                    <p className="text-xs text-slate-500">{formatDate(order.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
