'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MarkOpportunityLostButtonProps {
  opportunityId: string
  opportunityTitle: string
  workspaceSlug: string
}

export function MarkOpportunityLostButton({ opportunityId, opportunityTitle, workspaceSlug }: MarkOpportunityLostButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lostReason, setLostReason] = useState('')

  const handleMarkLost = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          lost_at: new Date().toISOString(),
          lost_reason: lostReason || null,
          won_at: null
        })
        .eq('id', opportunityId)

      if (updateError) throw updateError

      // Refresh and close modal
      setShowConfirm(false)
      setLostReason('')
      router.refresh()
    } catch (err) {
      console.error('Error marking opportunity as lost:', err)
      setError(err instanceof Error ? err.message : 'Error al marcar como perdida')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
      >
        <TrendingDown className="h-4 w-4" />
        Marcar como Perdida
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Marcar como Perdida
                </h3>
                <p className="text-slate-600">
                  ¿Confirmas que perdiste la oportunidad <strong>{opportunityTitle}</strong>?
                </p>
              </div>
            </div>

            {/* Lost Reason */}
            <div className="mb-4">
              <label htmlFor="lost-reason" className="block text-sm font-medium text-slate-700 mb-2">
                Razón (opcional)
              </label>
              <textarea
                id="lost-reason"
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="¿Por qué se perdió esta oportunidad?"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setLostReason('')
                }}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkLost}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 disabled:bg-slate-100 inline-flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                {loading ? 'Marcando...' : 'Marcar como Perdida'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
