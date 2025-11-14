'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Inbox, Send, Search, Filter, Plus, MailOpen, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { EmailThread } from './email-thread'
import { EmailComposer } from './email-composer'

interface Email {
  id: string
  subject: string
  body: string
  from_email: string
  to_email: string
  direction: 'inbound' | 'outbound'
  status: string
  sent_at: string
  created_at: string
  opened_at?: string
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

interface EmailListProps {
  emails: Email[]
  stats: {
    total: number
    sent: number
    received: number
    unread: number
  }
  workspaceId: string
  workspaceSlug: string
  initialSearch?: string
  initialType?: string
  initialStatus?: string
}

export function EmailList({
  emails,
  stats,
  workspaceId,
  workspaceSlug,
  initialSearch,
  initialType,
  initialStatus
}: EmailListProps) {
  const router = useRouter()
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [search, setSearch] = useState(initialSearch || '')
  const [activeFilter, setActiveFilter] = useState(initialType || 'all')
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  const handleSearch = (value: string) => {
    setSearch(value)
    const params = new URLSearchParams()
    if (value) params.set('q', value)
    if (activeFilter !== 'all') params.set('type', activeFilter)
    router.push(`/${workspaceSlug}/inbox${params.toString() ? '?' + params.toString() : ''}`)
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (filter !== 'all') params.set('type', filter)
    router.push(`/${workspaceSlug}/inbox${params.toString() ? '?' + params.toString() : ''}`)
  }

  const filteredEmails = emails

  return (
    <>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
          {/* Compose Button */}
          <div className="p-4">
            <button
              onClick={() => setIsComposerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
            >
              <Plus className="h-5 w-5" />
              Nuevo Email
            </button>
          </div>

          {/* Stats */}
          <div className="px-4 py-2 space-y-1">
            <button
              onClick={() => handleFilterChange('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeFilter === 'all'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5" />
                <span className="text-sm font-medium">Todos</span>
              </div>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('inbound')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeFilter === 'inbound'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MailOpen className="h-5 w-5" />
                <span className="text-sm font-medium">Recibidos</span>
              </div>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                {stats.received}
              </span>
            </button>

            <button
              onClick={() => handleFilterChange('outbound')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                activeFilter === 'outbound'
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5" />
                <span className="text-sm font-medium">Enviados</span>
              </div>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                {stats.sent}
              </span>
            </button>
          </div>
        </div>

        {/* Email List */}
        <div className="w-96 bg-slate-50 border-r border-slate-200 flex flex-col">
          {/* Search */}
          <div className="p-4 bg-white border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar emails..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-sm"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Mail className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-slate-600 font-medium">No hay emails</p>
                <p className="text-sm text-slate-500 mt-1">
                  {search ? 'Intenta con otra búsqueda' : 'Comienza enviando un email'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filteredEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`w-full text-left p-4 hover:bg-white transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-white border-l-4 border-slate-900' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {email.direction === 'inbound' ? (
                          <MailOpen className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        ) : (
                          <Send className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="font-medium text-slate-900 truncate text-sm">
                          {email.contacts?.name || email.from_email}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(email.sent_at), {
                          addSuffix: true,
                          locale: es
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 font-medium truncate mb-1">
                      {email.subject}
                    </p>
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {email.body.replace(/<[^>]*>/g, '').substring(0, 100)}...
                    </p>
                    {(email.quotes || email.orders) && (
                      <div className="flex gap-2 mt-2">
                        {email.quotes && (
                          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            Cotización #{email.quotes.quote_number}
                          </span>
                        )}
                        {email.orders && (
                          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                            Orden #{email.orders.order_number}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Detail */}
        <div className="flex-1 bg-white">
          {selectedEmail ? (
            <EmailThread email={selectedEmail} workspaceId={workspaceId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Mail className="h-16 w-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-600">Selecciona un email</p>
              <p className="text-sm text-slate-500 mt-1">
                Elige un email de la lista para ver su contenido
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Email Composer Modal */}
      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => {
          setIsComposerOpen(false)
          router.refresh()
        }}
        workspaceId={workspaceId}
      />
    </>
  )
}
