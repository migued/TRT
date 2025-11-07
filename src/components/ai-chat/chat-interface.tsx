'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Menu, X, AlertCircle } from 'lucide-react'
import ConversationList from './conversation-list'
import ChatMessages from './chat-messages'
import ChatInput from './chat-input'

interface AIChatInterfaceProps {
  workspaceId: string
  initialConversationId?: string
}

interface Conversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  last_message_at: string
  message_count: number
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  reasoning?: string
  reasoning_details?: any[]
  created_at: string
  model?: string
  total_tokens?: number
  cost?: number
  ai_file_attachments?: any[]
}

export default function AIChatInterface({
  workspaceId,
  initialConversationId
}: AIChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(
    initialConversationId || null
  )
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usageWarning, setUsageWarning] = useState<string | null>(null)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when conversation changes
  useEffect(() => {
    if (currentConversationId) {
      loadMessages(currentConversationId)
    } else {
      setMessages([])
    }
  }, [currentConversationId])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/ai-chat/conversations')
      if (!response.ok) throw new Error('Failed to load conversations')

      const data = await response.json()
      setConversations(data.conversations || [])

      // If no current conversation and there are conversations, select the first one
      if (!currentConversationId && data.conversations && data.conversations.length > 0) {
        setCurrentConversationId(data.conversations[0].id)
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error)
      setError('No se pudieron cargar las conversaciones')
    }
  }

  const loadMessages = async (conversationId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/ai-chat/conversations/${conversationId}`)
      if (!response.ok) throw new Error('Failed to load messages')

      const data = await response.json()
      setMessages(data.messages || [])
      setError(null)
    } catch (error: any) {
      console.error('Error loading messages:', error)
      setError('No se pudieron cargar los mensajes')
    } finally {
      setIsLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/ai-chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      if (!response.ok) throw new Error('Failed to create conversation')

      const data = await response.json()
      setConversations(prev => [data.conversation, ...prev])
      setCurrentConversationId(data.conversation.id)
      setMessages([])
      setError(null)
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      setError('No se pudo crear una nueva conversación')
    }
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return

    try {
      const response = await fetch(`/api/ai-chat/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete conversation')

      // Remove from list
      setConversations(prev => prev.filter(c => c.id !== conversationId))

      // If we deleted the current conversation, clear it
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null)
        setMessages([])
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error)
      setError('No se pudo eliminar la conversación')
    }
  }

  const generateTitle = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/ai-chat/conversations/${conversationId}/title`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to generate title')

      const data = await response.json()

      // Update conversation in list
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? { ...c, title: data.title } : c))
      )
    } catch (error: any) {
      console.error('Error generating title:', error)
    }
  }

  const exportConversation = async (conversationId: string, format: 'markdown' | 'json' = 'markdown') => {
    try {
      const response = await fetch(`/api/ai-chat/conversations/${conversationId}/export?format=${format}`)

      if (!response.ok) throw new Error('Failed to export conversation')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `conversation-${conversationId}.${format === 'json' ? 'json' : 'md'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Error exporting conversation:', error)
      setError('No se pudo exportar la conversación')
    }
  }

  return (
    <div className="flex h-full bg-slate-50">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar - Conversation List */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 lg:z-0 w-80 h-full bg-white border-r border-slate-200 transition-transform duration-300`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-slate-200">
            <button
              onClick={createNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
            >
              <Plus className="h-5 w-5" />
              Nueva Conversación
            </button>
          </div>

          {/* Conversation List */}
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={setCurrentConversationId}
            onDeleteConversation={deleteConversation}
            onGenerateTitle={generateTitle}
            onExportConversation={exportConversation}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {usageWarning && (
          <div className="p-4 bg-orange-50 border-b border-orange-200">
            <div className="flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              <span>{usageWarning}</span>
            </div>
          </div>
        )}

        {currentConversationId ? (
          <>
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
            />

            <ChatInput
              conversationId={currentConversationId}
              onMessageSent={(newMessage, response, warning) => {
                // Add user message
                setMessages(prev => [...prev, newMessage])

                // Add assistant message
                if (response) {
                  setMessages(prev => [...prev, response])
                }

                // Show usage warning if any
                if (warning) {
                  setUsageWarning(warning)
                }

                // Auto-generate title if this is the first message and no title exists
                const conversation = conversations.find(c => c.id === currentConversationId)
                if (conversation && !conversation.title && messages.length === 0) {
                  setTimeout(() => {
                    generateTitle(currentConversationId)
                  }, 2000)
                }

                // Reload conversations to update message count
                loadConversations()
              }}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Bienvenido al Chat con IA
              </h2>
              <p className="text-slate-600 mb-6">
                Crea una nueva conversación para comenzar
              </p>
              <button
                onClick={createNewConversation}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all font-medium"
              >
                <Plus className="h-5 w-5" />
                Nueva Conversación
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
