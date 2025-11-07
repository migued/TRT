'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DeleteQuoteButtonProps {
  quoteId: string
  quoteNumber: string
  workspaceSlug: string
}

export function DeleteQuoteButton({ quoteId, quoteNumber, workspaceSlug }: DeleteQuoteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId)

      if (error) throw error

      router.push(`/${workspaceSlug}/quotes`)
    } catch (error) {
      console.error('Error deleting quote:', error)
      alert('Error al eliminar la cotización')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors font-medium"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              ¿Eliminar cotización?
            </h3>
            <p className="text-slate-600 mb-2">
              Estás a punto de eliminar la cotización <strong>{quoteNumber}</strong>.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Esta acción no se puede deshacer.
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
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
