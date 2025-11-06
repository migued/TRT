'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DeleteOpportunityButtonProps {
  opportunityId: string
  opportunityTitle: string
  workspaceSlug: string
}

export function DeleteOpportunityButton({ opportunityId, opportunityTitle, workspaceSlug }: DeleteOpportunityButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: deleteError } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityId)

      if (deleteError) throw deleteError

      // Redirect to opportunities list
      router.push(`/${workspaceSlug}/opportunities`)
      router.refresh()
    } catch (err) {
      console.error('Error deleting opportunity:', err)
      setError(err instanceof Error ? err.message : 'Error al eliminar la oportunidad')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Confirmar eliminación
                </h3>
                <p className="text-slate-600">
                  ¿Estás seguro de que deseas eliminar la oportunidad <strong>{opportunityTitle}</strong>?
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Esta acción no se puede deshacer. La oportunidad será eliminada permanentemente.
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
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300"
              >
                {loading ? 'Eliminando...' : 'Eliminar Oportunidad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
