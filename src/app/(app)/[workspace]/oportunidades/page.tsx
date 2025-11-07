import { createClient } from '@/lib/supabase/server'
import { Plus, DollarSign } from 'lucide-react'
import { CreateOpportunityButton } from '@/components/opportunities/create-opportunity-button'
import { OpportunityKanban } from '@/components/opportunities/opportunity-kanban'

interface OpportunitiesPageProps {
  params: Promise<{ workspace: string }>
}

export default async function OpportunitiesPage({ params }: OpportunitiesPageProps) {
  const { workspace: workspaceSlug } = await params
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

  // Get custom stages for opportunities
  const { data: stages } = await supabase
    .from('custom_stages')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('type', 'opportunity')
    .order('order_index', { ascending: true })

  // Get all opportunities with contact and company info
  const { data: opportunities, error } = await supabase
    .from('opportunities')
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
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching opportunities:', error)
    return <div>Error loading opportunities</div>
  }

  // Calculate total pipeline value
  const totalValue = opportunities?.reduce((sum, opp) => {
    return sum + (opp.amount || 0)
  }, 0) || 0

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
          <h1 className="text-3xl font-bold text-slate-900">Oportunidades</h1>
          <p className="mt-1 text-sm text-slate-600">
            Pipeline de ventas y oportunidades
          </p>
        </div>
        <CreateOpportunityButton
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
          variant="primary"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Valor Total</p>
              <p className="text-2xl font-bold text-slate-900">{formatter.format(totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Plus className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Oportunidades Activas</p>
              <p className="text-2xl font-bold text-slate-900">{opportunities?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Ganadas este mes</p>
              <p className="text-2xl font-bold text-slate-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      {stages && stages.length > 0 ? (
        <OpportunityKanban
          stages={stages}
          opportunities={opportunities || []}
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
        />
      ) : (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <h3 className="text-lg font-medium text-slate-900">No hay etapas configuradas</h3>
          <p className="mt-2 text-sm text-slate-600">
            Se requieren etapas para gestionar oportunidades. Contacta al administrador.
          </p>
        </div>
      )}
    </div>
  )
}
