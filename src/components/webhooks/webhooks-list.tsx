'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Trash2, ExternalLink, Check } from 'lucide-react'
import { DeleteWebhookButton } from './delete-webhook-button'
import { ToggleWebhookButton } from './toggle-webhook-button'

interface WebhooksListProps {
  webhooks: any[]
  workspaceSlug: string
}

export function WebhooksList({ webhooks, workspaceSlug }: WebhooksListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set())

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleSecret = (webhookId: string) => {
    setRevealedSecrets((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(webhookId)) {
        newSet.delete(webhookId)
      } else {
        newSet.add(webhookId)
      }
      return newSet
    })
  }

  const getWebhookUrl = (webhook: any) => {
    if (webhook.type === 'incoming' && webhook.webhook_key) {
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL
      return `${baseUrl}/api/webhooks/incoming/${webhook.webhook_key}`
    }
    return webhook.target_url
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{webhook.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  webhook.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {webhook.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              {webhook.description && (
                <p className="text-sm text-slate-600 mt-1">{webhook.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ToggleWebhookButton
                webhookId={webhook.id}
                isActive={webhook.is_active}
                workspaceSlug={workspaceSlug}
              />
              <DeleteWebhookButton
                webhookId={webhook.id}
                webhookName={webhook.name}
                workspaceSlug={workspaceSlug}
              />
            </div>
          </div>

          {/* URL */}
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              {webhook.type === 'incoming' ? 'Webhook URL' : 'Target URL'}
            </label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 bg-slate-50 px-3 py-2 rounded text-sm text-slate-900 font-mono overflow-x-auto">
                {getWebhookUrl(webhook)}
              </code>
              <button
                onClick={() => copyToClipboard(getWebhookUrl(webhook), `${webhook.id}-url`)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Copy URL"
              >
                {copiedId === `${webhook.id}-url` ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
              {webhook.type === 'outgoing' && (
                <a
                  href={webhook.target_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                  title="Open URL"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Secret */}
          <div className="mb-3">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              Secret Key
            </label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 bg-slate-50 px-3 py-2 rounded text-sm text-slate-900 font-mono">
                {revealedSecrets.has(webhook.id)
                  ? webhook.secret
                  : '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                onClick={() => toggleSecret(webhook.id)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title={revealedSecrets.has(webhook.id) ? 'Hide secret' : 'Show secret'}
              >
                {revealedSecrets.has(webhook.id) ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => copyToClipboard(webhook.secret, `${webhook.id}-secret`)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                title="Copy secret"
              >
                {copiedId === `${webhook.id}-secret` ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Events */}
          <div>
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">
              {webhook.type === 'incoming' ? 'Allowed Events' : 'Subscribed Events'}
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(webhook.type === 'incoming' ? webhook.allowed_events : webhook.events)?.map((event: string) => (
                <span
                  key={event}
                  className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded"
                >
                  {event}
                </span>
              )) || (
                <span className="text-sm text-slate-500">No events configured</span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Created {new Date(webhook.created_at).toLocaleDateString()}</span>
            <span>ID: {webhook.id.slice(0, 8)}...</span>
          </div>
        </div>
      ))}
    </div>
  )
}
