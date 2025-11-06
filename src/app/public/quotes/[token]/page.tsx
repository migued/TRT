import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { FileText, Calendar, Mail, Phone, Building2, User } from 'lucide-react'

interface PublicQuotePageProps {
  params: Promise<{ token: string }>
}

export default async function PublicQuotePage({ params }: PublicQuotePageProps) {
  const { token } = await params
  const supabase = await createClient()

  // Get quote by public token (no auth required)
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
      ),
      workspaces (
        id,
        name
      )
    `)
    .eq('public_token', token)
    .single()

  if (error || !quote) {
    notFound()
  }

  // Track that the quote was viewed
  if (quote.status === 'sent' && !quote.viewed_at) {
    await supabase
      .from('quotes')
      .update({
        status: 'viewed',
        viewed_at: new Date().toISOString()
      })
      .eq('id', quote.id)
  }

  const contact = quote.contacts
  const company = contact?.companies
  const workspace = quote.workspaces

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
    sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
    viewed: { label: 'Vista', color: 'bg-purple-100 text-purple-700' },
    accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-700' },
    expired: { label: 'Expirada', color: 'bg-red-100 text-red-700' },
  }

  const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.draft

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{workspace?.name || 'Cotización'}</h1>
              <p className="text-sm text-slate-600 mt-1">Propuesta Comercial</p>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span className="text-lg font-semibold text-slate-900">{quote.quote_number}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Status and Dates */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
                  {status.label}
                </span>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4" />
                    <span>Emitida: {formatDate(quote.created_at)}</span>
                  </div>
                  {quote.valid_until && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span>Válida hasta: {formatDate(quote.valid_until)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Client Info */}
              {contact && (
                <div className="text-right">
                  <p className="text-sm text-slate-500 mb-1">Para:</p>
                  <p className="font-semibold text-slate-900">{contact.name}</p>
                  {company && (
                    <p className="text-sm text-slate-600">{company.name}</p>
                  )}
                  {contact.email && (
                    <div className="flex items-center justify-end gap-2 mt-2 text-sm text-slate-600">
                      <Mail className="h-3 w-3" />
                      {contact.email}
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
                      <Phone className="h-3 w-3" />
                      {contact.phone}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Detalle de la Cotización</h2>
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
                    <span className="font-medium text-red-600">-{formatter.format(quote.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA:</span>
                  <span className="font-medium text-slate-900">{formatter.format(quote.tax || 0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-orange-600">{formatter.format(quote.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          {quote.terms && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Términos y Condiciones</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.terms}</p>
            </div>
          )}

          {/* Footer */}
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-sm text-slate-600">
              ¿Tiene preguntas sobre esta cotización? Contáctenos para más información.
            </p>
            {quote.status !== 'accepted' && (
              <p className="text-xs text-slate-500 mt-2">
                Esta cotización es válida hasta el {formatDate(quote.valid_until)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
