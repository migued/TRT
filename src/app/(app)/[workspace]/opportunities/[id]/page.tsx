import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, TrendingUp, DollarSign, Calendar, User, Building2, Mail, Phone, Edit, FileText, TrendingDown, Trash2, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MarkOpportunityWonButton } from '@/components/opportunities/mark-opportunity-won-button'
import { MarkOpportunityLostButton } from '@/components/opportunities/mark-opportunity-lost-button'
import { DeleteOpportunityButton } from '@/components/opportunities/delete-opportunity-button'
import { CreateQuoteButton } from '@/components/quotes/create-quote-button'
import { AIAssistant } from '@/components/ai/ai-assistant'

interface OpportunityPageProps {
  params: Promise<{
    workspace: string
    id: string
  }>
}

export default async function OpportunityPage({ params }: OpportunityPageProps) {
  const { workspace: workspaceSlug, id: opportunityId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    notFound()
  }

  // Get opportunity with contact and company info
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      contacts (
        id,
        name,
        email,
        phone,
        position,
        companies (
          id,
          name,
          website
        )
      )
    `)
    .eq('id', opportunityId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !opportunity) {
    notFound()
  }

  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return 'Sin monto definido'

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 2
    })

    return formatter.format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Sin fecha'

    const dateObj = new Date(date)
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj)
  }

  const isWon = !!opportunity.won_at
  const isLost = !!opportunity.lost_at

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/${workspaceSlug}/opportunities`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a oportunidades
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isWon ? 'bg-slate-100' : isLost ? 'bg-slate-100' : 'bg-slate-100'}`}>
              {isWon ? (
                <Trophy className="h-6 w-6 text-slate-600" />
              ) : isLost ? (
                <TrendingDown className="h-6 w-6 text-slate-600" />
              ) : (
                <TrendingUp className="h-6 w-6 text-slate-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{opportunity.title}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isWon ? 'bg-slate-100 text-slate-600' :
                  isLost ? 'bg-slate-100 text-slate-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {isWon ? 'Ganada' : isLost ? 'Perdida' : opportunity.stage}
                </span>
                <span className="text-sm text-slate-600">{opportunity.probability}% probabilidad</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isWon && !isLost && (
              <>
                <CreateQuoteButton
                  workspaceSlug={workspaceSlug}
                  workspaceId={workspace.id}
                  variant="secondary"
                  opportunityId={opportunityId}
                />
                <Link
                  href={`/${workspaceSlug}/opportunities/${opportunityId}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
                <MarkOpportunityWonButton
                  opportunityId={opportunityId}
                  opportunityTitle={opportunity.title}
                  workspaceSlug={workspaceSlug}
                />
                <MarkOpportunityLostButton
                  opportunityId={opportunityId}
                  opportunityTitle={opportunity.title}
                  workspaceSlug={workspaceSlug}
                />
              </>
            )}
            <DeleteOpportunityButton
              opportunityId={opportunityId}
              opportunityTitle={opportunity.title}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Opportunity Details Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Información de la Oportunidad</h2>

            <div className="space-y-4">
              {/* Amount */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Monto</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatCurrency(opportunity.amount, opportunity.currency)}
                  </p>
                </div>
              </div>

              {/* Expected Close Date */}
              {opportunity.expected_close_date && (
                <div className="flex items-start gap-3 pt-4 border-t border-slate-200">
                  <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Fecha estimada de cierre</p>
                    <p className="text-slate-900">{formatDate(opportunity.expected_close_date)}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {opportunity.notes && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Notas</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{opportunity.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Won/Lost Info */}
              {isWon && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3 p-4 bg-slate-100 rounded-lg">
                    <Trophy className="h-5 w-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Oportunidad Ganada</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatDate(opportunity.won_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isLost && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3 p-4 bg-slate-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-slate-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Oportunidad Perdida</p>
                      <p className="text-sm text-slate-600 mt-1">
                        {formatDate(opportunity.lost_at)}
                      </p>
                      {opportunity.lost_reason && (
                        <p className="text-sm text-slate-600 mt-2">
                          Razón: {opportunity.lost_reason}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact & Company Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Contacto y Empresa</h2>

            <div className="space-y-4">
              {/* Contact */}
              {opportunity.contacts && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Contacto</span>
                  </div>
                  <Link
                    href={`/${workspaceSlug}/contacts/${opportunity.contacts.id}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <p className="font-medium text-slate-900">{opportunity.contacts.name}</p>
                    {opportunity.contacts.position && (
                      <p className="text-sm text-slate-600 mt-1">{opportunity.contacts.position}</p>
                    )}
                    <div className="mt-3 flex flex-col gap-2 text-sm">
                      {opportunity.contacts.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4" />
                          <a href={`mailto:${opportunity.contacts.email}`} className="hover:text-slate-600">
                            {opportunity.contacts.email}
                          </a>
                        </div>
                      )}
                      {opportunity.contacts.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${opportunity.contacts.phone}`} className="hover:text-slate-600">
                            {opportunity.contacts.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              )}

              {/* Company */}
              {opportunity.contacts?.companies && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-5 w-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Empresa</span>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-lg">
                    <Link
                      href={`/${workspaceSlug}/companies/${opportunity.contacts.companies.id}`}
                      className="font-medium text-slate-900 hover:text-slate-600"
                    >
                      {opportunity.contacts.companies.name}
                    </Link>
                    {opportunity.contacts.companies.website && (
                      <a
                        href={opportunity.contacts.companies.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-slate-600 hover:text-slate-600 mt-1 block"
                      >
                        {opportunity.contacts.companies.website}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Información del Sistema</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-600">Creado</p>
                  <p className="text-slate-900 font-medium">
                    {formatDate(opportunity.created_at)}
                  </p>
                </div>
              </div>

              {opportunity.updated_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Última actualización</p>
                    <p className="text-slate-900 font-medium">
                      {formatDate(opportunity.updated_at)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Activities Placeholder */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Actividades Recientes</h3>
            <p className="text-sm text-slate-500">No hay actividades registradas</p>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        workspaceId={workspace.id}
        opportunityId={opportunityId}
        contactId={opportunity.contact_id}
      />
    </div>
  )
}
