'use client'

import { useState } from 'react'
import { Power, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ToggleWebhookButtonProps {
  webhookId: string
  isActive: boolean
  workspaceSlug: string
}

export function ToggleWebhookButton({ webhookId, isActive, workspaceSlug }: ToggleWebhookButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })

      if (!response.ok) {
        throw new Error('Failed to toggle webhook')
      }

      router.refresh()
    } catch (error) {
      console.error('Error toggling webhook:', error)
      alert('Failed to toggle webhook')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`p-2 rounded ${
        isActive
          ? 'text-green-600 hover:bg-green-50'
          : 'text-slate-400 hover:bg-slate-50'
      } disabled:opacity-50`}
      title={isActive ? 'Deactivate webhook' : 'Activate webhook'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Power className="h-4 w-4" />
      )}
    </button>
  )
}
