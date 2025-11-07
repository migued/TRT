'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DeleteWebhookButtonProps {
  webhookId: string
  webhookName: string
  workspaceSlug: string
}

export function DeleteWebhookButton({ webhookId, webhookName, workspaceSlug }: DeleteWebhookButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/webhooks/${webhookId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete webhook')
      }

      router.refresh()
      setShowConfirm(false)
    } catch (error) {
      console.error('Error deleting webhook:', error)
      alert('Failed to delete webhook')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-slate-600 hover:bg-slate-100 rounded"
        title="Delete webhook"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Webhook</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete &quot;{webhookName}&quot;? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
