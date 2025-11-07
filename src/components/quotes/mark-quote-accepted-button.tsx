'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MarkQuoteAcceptedButtonProps {
  quoteId: string
  workspaceSlug: string
}

export function MarkQuoteAcceptedButton({ quoteId, workspaceSlug }: MarkQuoteAcceptedButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleAccept = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('quotes')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', quoteId)

      if (error) throw error

      setShowConfirm(false)
      router.refresh()
    } catch (error) {
      console.error('Error marking quote as accepted:', error)
      alert('Error al marcar la cotización como aceptada')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium"
      >
        <CheckCircle className="h-4 w-4" />
        Marcar Aceptada
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              ¿Marcar como aceptada?
            </h3>
            <p className="text-slate-600 mb-6">
              Esto indicará que el cliente ha aceptado la cotización. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Marcando...' : 'Sí, marcar como aceptada'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
