'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Send, Sparkles, Loader2 } from 'lucide-react'

interface EmailComposerProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  contactId?: string
  quoteId?: string
  orderId?: string
  defaultTo?: string
  defaultSubject?: string
  defaultBody?: string
}

export function EmailComposer({
  isOpen,
  onClose,
  workspaceId,
  contactId,
  quoteId,
  orderId,
  defaultTo = '',
  defaultSubject = '',
  defaultBody = ''
}: EmailComposerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [formData, setFormData] = useState({
    to: defaultTo,
    subject: defaultSubject,
    body: defaultBody
  })

  const handleSend = async () => {
    if (!formData.to || !formData.subject || !formData.body) {
      alert('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.to,
          subject: formData.subject,
          html: formData.body.replace(/\n/g, '<br>'),
          workspaceId,
          contactId,
          quoteId,
          orderId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al enviar email')
      }

      alert('Email enviado exitosamente!')
      onClose()
      router.refresh()
    } catch (error: any) {
      console.error('Error sending email:', error)
      alert(error.message || 'Error al enviar el email')
    } finally {
      setLoading(false)
    }
  }

  const handleAiDraft = async () => {
    setAiLoading(true)
    try {
      const context = {
        workspaceId,
        contactId,
        quoteId,
        orderId
      }

      const prompt = formData.subject
        ? `Redacta un email profesional sobre: ${formData.subject}`
        : 'Redacta un email de seguimiento profesional'

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context
        })
      })

      if (!response.ok) throw new Error('AI request failed')

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiText = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          aiText += decoder.decode(value)
          setFormData(prev => ({ ...prev, body: aiText }))
        }
      }
    } catch (error) {
      console.error('AI draft error:', error)
      alert('Error al generar borrador con IA')
    } finally {
      setAiLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Nuevo Email</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Para
            </label>
            <input
              type="email"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              placeholder="cliente@ejemplo.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Asunto
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Asunto del email..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={loading}
            />
          </div>

          {/* AI Draft Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAiDraft}
              disabled={aiLoading || loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generar con IA
                </>
              )}
            </button>
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mensaje
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Escribe tu mensaje aquí..."
              rows={12}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none font-sans"
              disabled={loading}
            />
            <p className="text-xs text-slate-500 mt-1">
              El formato se preservará en el email enviado
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={loading || !formData.to || !formData.subject || !formData.body}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
