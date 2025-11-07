import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, User, Building2, Calendar, Mail, Phone, Edit, Send, CheckCircle, Trash2, ExternalLink } from 'lucide-react'
import { MarkQuoteAcceptedButton } from '@/components/quotes/mark-quote-accepted-button'
import { DeleteQuoteButton } from '@/components/quotes/delete-quote-button'
import { CreateOrderButton } from '@/components/orders/create-order-button'
import { AIAssistant } from '@/components/ai/ai-assistant'
import { SendEmailButton } from '@/components/email/send-email-button'

interface QuoteDetailPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function QuoteDetailPage({ params }: QuoteDetailPageProps) {
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

  // Get quote with contact info
  const { data: quote, error } = await supabase
    .from('quotes')
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
      )
    `)
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !quote) {
    notFound()
  }

  // Check if order already exists for this quote
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id, order_number')
    .eq('quote_id', id)
    .single()

  const contact = quote.contacts
  const company = contact?.companies

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: quote.currency || 'MXN',
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
    draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
    sent: { label: 'Enviada', color: 'bg-slate-100 text-slate-600' },
    viewed: { label: 'Vista', color: 'bg-slate-100 text-slate-600' },
    accepted: { label: 'Aceptada', color: 'bg-slate-100 text-slate-600' },
    expired: { label: 'Expirada', color: 'bg-slate-100 text-slate-600' },
  }

  const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft

  // Generate email body for quote
  const generateQuoteEmailBody = () => {
    const itemsList = Array.isArray(quote.items)
      ? quote.items.map((item: any) => `- ${item.description}: ${item.quantity} x ${formatter.format(item.unit_price)} = ${formatter.format(item.subtotal)}`).join('\n')
      : ''

    return `Estimado/a ${contact?.name || 'Cliente'},

Adjunto encontrarás la cotización ${quote.quote_number} con los siguientes detalles:

ARTÍCULOS:
${itemsList}

TOTALES:
Subtotal: ${formatter.format(quote.subtotal || 0)}
${quote.discount > 0 ? `Descuento: -${formatter.format(quote.discount)}\n` : ''}IVA: ${formatter.format(quote.tax || 0)}
TOTAL: ${formatter.format(quote.total || 0)}

${quote.valid_until ? `Esta cotización es válida hasta: ${formatDate(quote.valid_until)}\n` : ''}
Puedes revisar los detalles completos en: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tudominio.com'}/${workspaceSlug}/public/quotes/${quote.public_token}

${quote.terms ? `\nTérminos y Condiciones:\n${quote.terms}\n` : ''}
Quedamos atentos a cualquier duda o comentario.

Saludos cordiales,
${workspace.name}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${workspaceSlug}/quotes`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cotizaciones
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-slate-900">{quote.quote_number}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="mt-2 text-slate-600">
              Creada el {formatDate(quote.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {quote.status === 'draft' && (
              <>
                <Link
                  href={`/${workspaceSlug}/quotes/${quote.id}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  <Edit className="h-4 w-4" />
                  Editar
                </Link>
                <SendEmailButton
                  workspaceId={workspace.id}
                  quoteId={quote.id}
                  contactId={contact?.id}
                  contactEmail={contact?.email || ''}
                  defaultSubject={`Cotización ${quote.quote_number} - ${workspace.name}`}
                  defaultBody={generateQuoteEmailBody()}
                  variant="primary"
                />
              </>
            )}

            {(quote.status === 'sent' || quote.status === 'viewed') && (
              <MarkQuoteAcceptedButton
                quoteId={quote.id}
                workspaceSlug={workspaceSlug}
              />
            )}

            {quote.status === 'accepted' && !existingOrder && (
              <CreateOrderButton
                quoteId={quote.id}
                workspaceSlug={workspaceSlug}
                workspaceId={workspace.id}
              />
            )}

            {quote.status === 'accepted' && existingOrder && (
              <Link
                href={`/${workspaceSlug}/orders/${existingOrder.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
              >
                <CheckCircle className="h-4 w-4" />
                Ver Orden {existingOrder.order_number}
              </Link>
            )}

            {quote.status !== 'accepted' && (
              <DeleteQuoteButton
                quoteId={quote.id}
                quoteNumber={quote.quote_number}
                workspaceSlug={workspaceSlug}
              />
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
                  {Array.isArray(quote.items) && quote.items.map((item: any, index: number) => (
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
                  <span className="font-medium text-slate-900">{formatter.format(quote.subtotal || 0)}</span>
                </div>
                {quote.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Descuento:</span>
                    <span className="font-medium text-slate-600">-{formatter.format(quote.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA:</span>
                  <span className="font-medium text-slate-900">{formatter.format(quote.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-slate-600">{formatter.format(quote.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notas Internas</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}

          {/* Terms */}
          {quote.terms && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Términos y Condiciones</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{quote.terms}</p>
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
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-600 font-medium"
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
                      className="flex items-center gap-2 text-slate-600 hover:text-slate-600 font-medium"
                    >
                      <Building2 className="h-4 w-4" />
                      {company.name}
                    </Link>
                    {company.website && (
                      <a
                        href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-600 mt-2"
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

          {/* Details */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Detalles</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Válida Hasta</p>
                <div className="flex items-center gap-2 text-sm text-slate-900">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(quote.valid_until)}
                </div>
              </div>

              {quote.sent_at && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Enviada</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <Send className="h-4 w-4 text-slate-400" />
                    {formatDate(quote.sent_at)}
                  </div>
                </div>
              )}

              {quote.viewed_at && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Vista por Cliente</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <FileText className="h-4 w-4 text-slate-400" />
                    {formatDate(quote.viewed_at)}
                  </div>
                </div>
              )}

              {quote.accepted_at && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Aceptada</p>
                  <div className="flex items-center gap-2 text-sm text-slate-900">
                    <CheckCircle className="h-4 w-4 text-slate-600" />
                    {formatDate(quote.accepted_at)}
                  </div>
                </div>
              )}

              {quote.public_token && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Enlace Público</p>
                  <a
                    href={`/${workspaceSlug}/public/quotes/${quote.public_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-slate-600 hover:text-slate-600 flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver enlace
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Historial</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-slate-400"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Cotización creada</p>
                  <p className="text-xs text-slate-500">{formatDate(quote.created_at)}</p>
                </div>
              </div>

              {quote.sent_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-slate-100"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Enviada al cliente</p>
                    <p className="text-xs text-slate-500">{formatDate(quote.sent_at)}</p>
                  </div>
                </div>
              )}

              {quote.viewed_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-slate-100"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Vista por el cliente</p>
                    <p className="text-xs text-slate-500">{formatDate(quote.viewed_at)}</p>
                  </div>
                </div>
              )}

              {quote.accepted_at && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 mt-2 rounded-full bg-slate-100"></div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Aceptada</p>
                    <p className="text-xs text-slate-500">{formatDate(quote.accepted_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        workspaceId={workspace.id}
        quoteId={quote.id}
        contactId={quote.contacts?.id}
      />
    </div>
  )
}
