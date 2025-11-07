'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CreateWebhookButtonProps {
  workspaceSlug: string
  workspaceId: string
}

const WEBHOOK_EVENTS = {
  incoming: ['contact', 'company', 'opportunity', 'lead'],
  outgoing: [
    'contact.created',
    'contact.updated',
    'company.created',
    'opportunity.created',
    'opportunity.won',
    'opportunity.lost',
    'order.created',
    'project.created',
    'quote.created',
    'quote.sent',
  ],
}

export function CreateWebhookButton({ workspaceSlug, workspaceId }: CreateWebhookButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    type: 'incoming' as 'incoming' | 'outgoing',
    description: '',
    target_url: '',
    events: [] as string[],
    allowed_events: [] as string[],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: workspaceId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create webhook')
      }

      router.refresh()
      setIsOpen(false)
      setFormData({
        name: '',
        type: 'incoming',
        description: '',
        target_url: '',
        events: [],
        allowed_events: [],
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleEvent = (event: string) => {
    const field = formData.type === 'incoming' ? 'allowed_events' : 'events'
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(event)
        ? prev[field].filter((e) => e !== event)
        : [...prev[field], event],
    }))
  }

  const availableEvents = WEBHOOK_EVENTS[formData.type]
  const selectedEvents = formData.type === 'incoming' ? formData.allowed_events : formData.events

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
      >
        <Plus className="h-4 w-4" />
        Create Webhook
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-slate-900">Create Webhook</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-slate-100 border border-slate-200 text-slate-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Webhook Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Webhook Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'incoming' }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.type === 'incoming'
                        ? 'border-slate-200 bg-slate-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <h3 className="font-semibold text-slate-900 mb-1">Incoming</h3>
                    <p className="text-xs text-slate-600">
                      Receive data from external sources
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'outgoing' }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      formData.type === 'outgoing'
                        ? 'border-slate-200 bg-slate-100'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <h3 className="font-semibold text-slate-900 mb-1">Outgoing</h3>
                    <p className="text-xs text-slate-600">
                      Send events to external services
                    </p>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Webhook Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Contact Form, Zapier Integration"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description of this webhook"
                />
              </div>

              {/* Target URL (for outgoing only) */}
              {formData.type === 'outgoing' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.target_url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, target_url: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/webhook"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    The URL where webhook events will be sent
                  </p>
                </div>
              )}

              {/* Events */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {formData.type === 'incoming' ? 'Allowed Events' : 'Subscribe to Events'}
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                  {availableEvents.map((event) => (
                    <label
                      key={event}
                      className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">{event}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formData.type === 'incoming'
                    ? 'Events that this webhook can create'
                    : 'Events that will trigger this webhook'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
