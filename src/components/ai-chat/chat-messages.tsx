'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, User, ChevronDown, ChevronUp, FileText, Loader2, Sparkles } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
}

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expandedReasoning, setExpandedReasoning] = useState<Set<string>>(new Set())

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch {
      return ''
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
              <Bot className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              ¡Comienza una conversación!
            </h3>
            <p className="text-slate-600">
              Escribe un mensaje abajo para empezar a chatear con la IA
            </p>
          </div>
        </div>
      )}

      {messages.map((message) => {
        const isUser = message.role === 'user'
        const isReasoningExpanded = expandedReasoning.has(message.id)

        return (
          <div
            key={message.id}
            className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                isUser
                  ? 'bg-slate-900'
                  : 'bg-slate-700'
              }`}
            >
              {isUser ? (
                <User className="h-5 w-5 text-white" />
              ) : (
                <Bot className="h-5 w-5 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
              <div
                className={`inline-block max-w-[85%] ${
                  isUser ? 'text-left' : ''
                }`}
              >
                {/* Reasoning Section (for assistant messages) */}
                {!isUser && message.reasoning && (
                  <div className="mb-2">
                    <button
                      onClick={() => toggleReasoning(message.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium mb-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Proceso de razonamiento</span>
                      {isReasoningExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {isReasoningExpanded && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-slate-600" />
                          <span className="text-sm font-semibold text-slate-900">
                            Razonamiento del Modelo
                          </span>
                        </div>
                        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                          {message.reasoning}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Main Message */}
                <div
                  className={`rounded-lg px-4 py-3 ${
                    isUser
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>

                  {/* File Attachments */}
                  {message.ai_file_attachments && message.ai_file_attachments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.ai_file_attachments.map((file: any) => (
                        <div
                          key={file.id}
                          className={`flex items-center gap-2 p-2 rounded ${
                            isUser ? 'bg-white/20' : 'bg-slate-100'
                          }`}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.file_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div
                  className={`mt-1 text-xs text-slate-500 ${
                    isUser ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatDate(message.created_at)}
                  {!isUser && message.model && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{message.model}</span>
                    </>
                  )}
                  {!isUser && message.total_tokens !== undefined && (
                    <>
                      <span className="mx-1">•</span>
                      <span>{message.total_tokens} tokens</span>
                    </>
                  )}
                  {!isUser && message.cost !== undefined && (
                    <>
                      <span className="mx-1">•</span>
                      <span>${message.cost.toFixed(4)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {isLoading && (
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              <span className="text-sm text-slate-600">Pensando...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
