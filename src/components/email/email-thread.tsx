'use client'

import { useState, useEffect } from 'react'
import { Reply, Forward, Archive, Trash2, MoreVertical, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmailComposer } from './email-composer'

interface Email {
  id: string
  subject: string
  body: string
  from_email: string
  to_email: string
  cc_email?: string[]
  direction: 'inbound' | 'outbound'
  status: string
  sent_at: string
  contacts?: {
    id: string
    name: string
    email: string
  }
  quotes?: {
    id: string
    quote_number: string
  }
  orders?: {
    id: string
    order_number: string
  }
}

interface EmailThreadProps {
  email: Email
  workspaceId: string
}

export function EmailThread({ email, workspaceId }: EmailThreadProps) {
  const [isReplyOpen, setIsReplyOpen] = useState(false)
  const [threadEmails, setThreadEmails] = useState<Email[]>([email])

  useEffect(() => {
    // Fetch thread emails if this is part of a thread
    // For now, just show the single email
    setThreadEmails([email])
  }, [email.id])

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este email?')) return

    try {
      // In a real implementation, you would call an API to delete the email
      alert('Funcionalidad de eliminar próximamente')
    } catch (error) {
      console.error('Error deleting email:', error)
      alert('Error al eliminar el email')
    }
  }

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="border-b border-slate-200 p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{email.subject}</h1>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">
                <span className="font-medium">
                  {email.direction === 'inbound' ? 'De: ' : 'Para: '}
                </span>
                {email.contacts?.name || email.from_email}
                {email.contacts && (
                  <span className="text-slate-500"> &lt;{email.contacts.email}&gt;</span>
                )}
              </p>
              {email.cc_email && email.cc_email.length > 0 && (
                <p className="text-sm text-slate-600 mt-1">
                  <span className="font-medium">CC: </span>
                  {email.cc_email.join(', ')}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                {format(new Date(email.sent_at), "PPP 'a las' p", { locale: es })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsReplyOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Reply className="h-4 w-4" />
                Responder
              </button>
              <button
                onClick={() => alert('Funcionalidad de reenviar próximamente')}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="Reenviar"
              >
                <Forward className="h-4 w-4 text-slate-600" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>

          {/* Related Items */}
          {(email.quotes || email.orders) && (
            <div className="flex gap-2 mt-4">
              {email.quotes && (
                <a
                  href={`/${workspaceId}/quotes/${email.quotes.id}`}
                  className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  📄 Cotización #{email.quotes.quote_number}
                </a>
              )}
              {email.orders && (
                <a
                  href={`/${workspaceId}/orders/${email.orders.id}`}
                  className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  📦 Orden #{email.orders.order_number}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl">
            <div
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: email.body }}
            />
          </div>

          {/* Thread History */}
          {threadEmails.length > 1 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-4">
                {threadEmails.length - 1} mensaje(s) anterior(es)
              </h3>
              {threadEmails.slice(0, -1).map((threadEmail) => (
                <div
                  key={threadEmail.id}
                  className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900">
                      {threadEmail.contacts?.name || threadEmail.from_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(new Date(threadEmail.sent_at), 'PPP', { locale: es })}
                    </p>
                  </div>
                  <div
                    className="text-sm text-slate-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: threadEmail.body }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reply Composer */}
      <EmailComposer
        isOpen={isReplyOpen}
        onClose={() => setIsReplyOpen(false)}
        workspaceId={workspaceId}
        contactId={email.contacts?.id}
        quoteId={email.quotes?.id}
        orderId={email.orders?.id}
        defaultTo={email.direction === 'inbound' ? email.from_email : email.to_email}
        defaultSubject={email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`}
      />
    </>
  )
}
