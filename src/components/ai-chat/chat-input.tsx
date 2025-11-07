'use client'

import { useState, useRef } from 'react'
import { Send, Paperclip, X, FileText, Image, FileSpreadsheet, Loader2 } from 'lucide-react'

interface ChatInputProps {
  conversationId: string
  onMessageSent: (userMessage: any, assistantMessage: any, warning?: string) => void
}

export default function ChatInput({ conversationId, onMessageSent }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])

    // Validate files
    const validFiles = selectedFiles.filter(file => {
      const sizeMB = file.size / (1024 * 1024)
      const ext = file.name.toLowerCase().split('.').pop()
      const allowedTypes = ['pdf', 'xls', 'xlsx', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'webp']

      if (sizeMB > 10) {
        alert(`Archivo "${file.name}" es muy grande (máximo 10MB)`)
        return false
      }

      if (!ext || !allowedTypes.includes(ext)) {
        alert(`Tipo de archivo "${ext}" no soportado`)
        return false
      }

      return true
    })

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isSending) return

    setIsSending(true)
    setIsStreaming(true)

    const userMessageContent = input
    setInput('')

    try {
      // TODO: Handle file uploads
      // For now, we'll just send the text message

      const response = await fetch(`/api/ai-chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: userMessageContent,
          files: files.length > 0 ? files.map(f => ({ fileName: f.name, fileType: f.type })) : undefined,
          useReasoning: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // Create user message object
      const userMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user' as const,
        content: userMessageContent,
        created_at: new Date().toISOString()
      }

      // Stream the assistant's response
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let assistantContent = ''
      let assistantReasoning = ''
      let assistantMessageId = null
      let warning = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'content') {
              assistantContent += data.content
            } else if (data.type === 'reasoning') {
              assistantReasoning += data.reasoning
            } else if (data.type === 'done') {
              assistantMessageId = data.messageId
              if (data.warning) {
                warning = data.warning
              }
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          } catch (e) {
            console.error('Error parsing SSE:', e)
          }
        }
      }

      // Create assistant message object
      const assistantMessage = {
        id: assistantMessageId || `temp-assistant-${Date.now()}`,
        role: 'assistant' as const,
        content: assistantContent,
        reasoning: assistantReasoning || undefined,
        created_at: new Date().toISOString()
      }

      // Clear files after successful send
      setFiles([])

      // Call the callback with both messages
      onMessageSent(userMessage, assistantMessage, warning || undefined)

    } catch (error: any) {
      console.error('Error sending message:', error)
      alert('Error al enviar el mensaje: ' + error.message)
    } finally {
      setIsSending(false)
      setIsStreaming(false)
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image className="h-4 w-4" />
    }
    if (['xls', 'xlsx'].includes(ext || '')) {
      return <FileSpreadsheet className="h-4 w-4" />
    }
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      {/* File Previews */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg text-sm"
            >
              {getFileIcon(file.name)}
              <span className="truncate max-w-[150px]">{file.name}</span>
              <button
                onClick={() => removeFile(index)}
                className="text-slate-500 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* File Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="p-3 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Adjuntar archivos"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xls,.xlsx,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder={isStreaming ? "Generando respuesta..." : "Escribe tu mensaje..."}
          rows={1}
          disabled={isSending}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </form>

      <p className="text-xs text-slate-500 mt-2 text-center">
        Presiona Enter para enviar, Shift+Enter para nueva línea
        {files.length > 0 && ` • ${files.length} archivo(s) adjunto(s)`}
      </p>
    </div>
  )
}
