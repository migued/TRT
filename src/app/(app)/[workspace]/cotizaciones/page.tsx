import { createClient } from '@/lib/supabase/server'
import { FileText, DollarSign, Send, CheckCircle } from 'lucide-react'
import { CreateQuoteButton } from '@/components/quotes/create-quote-button'
import { QuotesTable } from '@/components/quotes/quotes-table'

interface QuotesPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ status?: string }>
}

export default async function QuotesPage({ params, searchParams }: QuotesPageProps) {
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
    .from('quotes')
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
      )
    `)
    .eq('workspace_id', workspace.id)

  // Apply status filter if provided
  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: quotes, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quotes:', error)
    return <div>Error loading quotes</div>
  }

  // Calculate statistics
  const stats = {
    total: quotes?.length || 0,
    draft: quotes?.filter(q => q.status === 'draft').length || 0,
    sent: quotes?.filter(q => q.status === 'sent' || q.status === 'viewed').length || 0,
    accepted: quotes?.filter(q => q.status === 'accepted').length || 0,
    totalValue: quotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0,
    acceptedValue: quotes?.filter(q => q.status === 'accepted').reduce((sum, q) => sum + (q.total || 0), 0) || 0,
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
          <h1 className="text-3xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="mt-1 text-sm text-slate-600">
            Propuestas y cotizaciones comerciales
          </p>
        </div>
        <CreateQuoteButton
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
          variant="primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total Cotizaciones</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Send className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Enviadas</p>
              <p className="text-2xl font-bold text-slate-900">{stats.sent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Aceptadas</p>
              <p className="text-2xl font-bold text-slate-900">{stats.accepted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Valor Aceptado</p>
              <p className="text-2xl font-bold text-slate-900">{formatter.format(stats.acceptedValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quotes Table */}
      <QuotesTable
        quotes={quotes || []}
        workspaceSlug={workspaceSlug}
        currentStatus={statusFilter || 'all'}
      />
    </div>
  )
}
