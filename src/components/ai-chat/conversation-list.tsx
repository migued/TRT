'use client'

import { MessageSquare, Trash2, Download, FileText, MoreVertical } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  last_message_at: string
  message_count: number
}

interface ConversationListProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onGenerateTitle: (id: string) => void
  onExportConversation: (id: string, format: 'markdown' | 'json') => void
}

export default function ConversationList({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onGenerateTitle,
  onExportConversation
}: ConversationListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch {
      return 'hace un momento'
    }
  }

  const getDisplayTitle = (conversation: Conversation) => {
    if (conversation.title) return conversation.title
    if (conversation.message_count === 0) return 'Nueva conversación'
    return `Conversación ${conversation.id.slice(0, 8)}...`
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No hay conversaciones aún</p>
        </div>
      ) : (
        <div className="py-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative px-3 py-2 mx-2 rounded-lg mb-1 cursor-pointer transition-colors ${
                currentConversationId === conversation.id
                  ? 'bg-slate-900 text-white'
                  : 'hover:bg-slate-100'
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <MessageSquare className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  currentConversationId === conversation.id ? 'text-white' : 'text-slate-600'
                }`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-medium truncate ${
                      currentConversationId === conversation.id ? 'text-white' : 'text-slate-900'
                    }`}>
                      {getDisplayTitle(conversation)}
                    </h3>

                    {/* Menu Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === conversation.id ? null : conversation.id)
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                        currentConversationId === conversation.id
                          ? 'hover:bg-slate-800'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      <MoreVertical className={`h-4 w-4 ${
                        currentConversationId === conversation.id ? 'text-white' : 'text-slate-600'
                      }`} />
                    </button>
                  </div>

                  <div className={`flex items-center gap-2 text-xs mt-1 ${
                    currentConversationId === conversation.id ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    <span>{conversation.message_count} mensajes</span>
                    <span>•</span>
                    <span>{formatDate(conversation.last_message_at)}</span>
                  </div>
                </div>
              </div>

              {/* Context Menu */}
              {openMenuId === conversation.id && (
                <div
                  className="absolute right-2 top-12 z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onGenerateTitle(conversation.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generar título
                  </button>

                  <button
                    onClick={() => {
                      onExportConversation(conversation.id, 'markdown')
                      setOpenMenuId(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar (MD)
                  </button>

                  <button
                    onClick={() => {
                      onExportConversation(conversation.id, 'json')
                      setOpenMenuId(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar (JSON)
                  </button>

                  <div className="border-t border-slate-200 my-1" />

                  <button
                    onClick={() => {
                      onDeleteConversation(conversation.id)
                      setOpenMenuId(null)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
