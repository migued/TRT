import Link from 'next/link'
import { FileText, Eye } from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  status: string
  total: number
  currency: string
  valid_until: string | null
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
}

interface QuotesTableProps {
  quotes: Quote[]
  workspaceSlug: string
  currentStatus: string
}

const statusConfig = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Vista', color: 'bg-purple-100 text-purple-700' },
  accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-700' },
  expired: { label: 'Expirada', color: 'bg-red-100 text-red-700' },
}

export function QuotesTable({ quotes, workspaceSlug, currentStatus }: QuotesTableProps) {
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
    { value: 'all', label: 'Todas', count: quotes.length },
    { value: 'draft', label: 'Borradores', count: quotes.filter(q => q.status === 'draft').length },
    { value: 'sent', label: 'Enviadas', count: quotes.filter(q => q.status === 'sent' || q.status === 'viewed').length },
    { value: 'accepted', label: 'Aceptadas', count: quotes.filter(q => q.status === 'accepted').length },
    { value: 'expired', label: 'Expiradas', count: quotes.filter(q => q.status === 'expired').length },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Status Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2 px-6 -mb-px overflow-x-auto">
          {statusTabs.map(tab => (
            <Link
              key={tab.value}
              href={`/${workspaceSlug}/quotes${tab.value !== 'all' ? `?status=${tab.value}` : ''}`}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                ${currentStatus === tab.value
                  ? 'border-orange-500 text-orange-600'
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
      {quotes.length > 0 ? (
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
                  Estado
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Monto
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Válida Hasta
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
              {quotes.map(quote => {
                const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft

                return (
                  <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/${workspaceSlug}/quotes/${quote.id}`}
                        className="font-medium text-orange-600 hover:text-orange-700 flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" />
                        {quote.quote_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {quote.contacts?.name || 'Sin contacto'}
                        </div>
                        {quote.contacts?.companies && (
                          <div className="text-sm text-slate-500">
                            {quote.contacts.companies.name}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      {formatter.format(quote.total || 0)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {quote.valid_until ? formatDate(quote.valid_until) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(quote.created_at)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/${workspaceSlug}/quotes/${quote.id}`}
                        className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-orange-600"
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
          <FileText className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No hay cotizaciones</h3>
          <p className="mt-1 text-sm text-slate-500">
            {currentStatus === 'all'
              ? 'Comienza creando tu primera cotización.'
              : 'No hay cotizaciones con este estado.'}
          </p>
        </div>
      )}
    </div>
  )
}
