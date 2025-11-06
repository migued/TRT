'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface DeleteContactButtonProps {
  workspaceSlug: string
  contactId: string
  contactName: string
}

export function DeleteContactButton({
  workspaceSlug,
  contactId,
  contactName,
}: DeleteContactButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId)

      if (error) throw error

      // Redirect to contacts list
      router.push(`/${workspaceSlug}/contacts`)
      router.refresh()
    } catch (error) {
      console.error('Error deleting contact:', error)
      alert('Error al eliminar el contacto')
    } finally {
      setDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-900">
            ¿Eliminar contacto?
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            ¿Estás seguro de que quieres eliminar a <strong>{contactName}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex gap-3 justify-end">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
    >
      <Trash2 className="h-4 w-4" />
      Eliminar
    </button>
  )
}
