import Link from 'next/link'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface Transaction {
  id: string
  type: string
  amount: number
  currency: string
  category: string | null
  description: string
  payment_method: string | null
  transaction_date: string
  orders: {
    id: string
    order_number: string
  } | null
  projects: {
    id: string
    title: string
  } | null
}

interface TransactionsTableProps {
  transactions: Transaction[]
  workspaceSlug: string
  currentType: string
}

export function TransactionsTable({ transactions, workspaceSlug, currentType }: TransactionsTableProps) {
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

  const typeTabs = [
    { value: 'all', label: 'Todas', count: transactions.length },
    { value: 'income', label: 'Ingresos', count: transactions.filter(t => t.type === 'income').length },
    { value: 'expense', label: 'Gastos', count: transactions.filter(t => t.type === 'expense').length },
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Type Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-2 px-6 -mb-px overflow-x-auto">
          {typeTabs.map(tab => (
            <Link
              key={tab.value}
              href={`/${workspaceSlug}/financial${tab.value !== 'all' ? `?type=${tab.value}` : ''}`}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                ${currentType === tab.value
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
      {transactions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Referencia
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Método
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactions.map(transaction => (
                <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-2">
                      {transaction.type === 'income' ? (
                        <TrendingUp className="h-4 w-4 text-slate-600 mt-0.5" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-slate-600 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{transaction.description}</p>
                        {transaction.orders && (
                          <Link
                            href={`/${workspaceSlug}/orders/${transaction.orders.id}`}
                            className="text-xs text-slate-600 hover:text-slate-600"
                          >
                            Orden: {transaction.orders.order_number}
                          </Link>
                        )}
                        {transaction.projects && (
                          <Link
                            href={`/${workspaceSlug}/projects/${transaction.projects.id}`}
                            className="text-xs text-slate-600 hover:text-slate-600"
                          >
                            Proyecto: {transaction.projects.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {transaction.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {transaction.category}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {transaction.orders && transaction.orders.order_number}
                    {transaction.projects && transaction.projects.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {transaction.payment_method || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${transaction.type === 'income' ? 'text-slate-600' : 'text-slate-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatter.format(transaction.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No hay transacciones</h3>
          <p className="mt-1 text-sm text-slate-500">
            {currentType === 'all'
              ? 'Las transacciones se registran automáticamente desde órdenes y proyectos.'
              : 'No hay transacciones de este tipo.'}
          </p>
        </div>
      )}
    </div>
  )
}
