'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MarkOpportunityWonButtonProps {
  opportunityId: string
  opportunityTitle: string
  workspaceSlug: string
}

export function MarkOpportunityWonButton({ opportunityId, opportunityTitle, workspaceSlug }: MarkOpportunityWonButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMarkWon = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          won_at: new Date().toISOString(),
          lost_at: null,
          lost_reason: null
        })
        .eq('id', opportunityId)

      if (updateError) throw updateError

      // Refresh and close modal
      setShowConfirm(false)
      router.refresh()
    } catch (err) {
      console.error('Error marking opportunity as won:', err)
      setError(err instanceof Error ? err.message : 'Error al marcar como ganada')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        <Trophy className="h-4 w-4" />
        Marcar como Ganada
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Marcar como Ganada
                </h3>
                <p className="text-slate-600">
                  ¿Confirmas que ganaste la oportunidad <strong>{opportunityTitle}</strong>?
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Esta acción moverá la oportunidad al estado "Ganada".
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleMarkWon}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {loading ? 'Marcando...' : 'Marcar como Ganada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
