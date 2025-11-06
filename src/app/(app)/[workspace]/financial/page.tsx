import { createClient } from '@/lib/supabase/server'
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { TransactionsTable } from '@/components/financial/transactions-table'
import { AddTransactionButton } from '@/components/financial/add-transaction-button'

interface FinancialPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ type?: string; project?: string; order?: string }>
}

export default async function FinancialPage({ params, searchParams }: FinancialPageProps) {
  const { workspace: workspaceSlug } = await params
  const { type: typeFilter, project: projectFilter, order: orderFilter } = await searchParams
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
    .from('transactions')
    .select(`
      *,
      orders (
        id,
        order_number
      ),
      projects (
        id,
        title
      )
    `)
    .eq('workspace_id', workspace.id)

  // Apply filters
  if (typeFilter && typeFilter !== 'all') {
    query = query.eq('type', typeFilter)
  }
  if (projectFilter) {
    query = query.eq('project_id', projectFilter)
  }
  if (orderFilter) {
    query = query.eq('order_id', orderFilter)
  }

  const { data: transactions, error } = await query.order('transaction_date', { ascending: false })

  if (error) {
    console.error('Error fetching transactions:', error)
    return <div>Error loading transactions</div>
  }

  // Calculate current month statistics
  const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
  const currentMonthTransactions = transactions?.filter(t =>
    t.transaction_date.startsWith(currentMonth)
  ) || []

  const stats = {
    totalIncome: transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
    totalExpenses: transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0,
    monthIncome: currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
    monthExpenses: currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0,
  }

  stats.balance = stats.totalIncome - stats.totalExpenses
  stats.monthBalance = stats.monthIncome - stats.monthExpenses

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
          <h1 className="text-3xl font-bold text-slate-900">Seguimiento Financiero</h1>
          <p className="mt-1 text-sm text-slate-600">
            Control de ingresos y gastos
          </p>
        </div>
        <AddTransactionButton
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
        />
      </div>

      {/* Stats - All Time */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Totales Históricos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ingresos Totales</p>
                <p className="text-2xl font-bold text-green-600">{formatter.format(stats.totalIncome)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Gastos Totales</p>
                <p className="text-2xl font-bold text-red-600">{formatter.format(stats.totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.balance >= 0 ? 'bg-purple-100' : 'bg-orange-100'}`}>
                <Wallet className={`h-5 w-5 ${stats.balance >= 0 ? 'text-purple-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Balance Total</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-purple-600' : 'text-orange-600'}`}>
                  {formatter.format(stats.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Current Month */}
      <div>
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Este Mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ingresos del Mes</p>
                <p className="text-2xl font-bold text-slate-900">{formatter.format(stats.monthIncome)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Gastos del Mes</p>
                <p className="text-2xl font-bold text-slate-900">{formatter.format(stats.monthExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stats.monthBalance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <Wallet className={`h-5 w-5 ${stats.monthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Balance del Mes</p>
                <p className={`text-2xl font-bold ${stats.monthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatter.format(stats.monthBalance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionsTable
        transactions={transactions || []}
        workspaceSlug={workspaceSlug}
        currentType={typeFilter || 'all'}
      />
    </div>
  )
}
