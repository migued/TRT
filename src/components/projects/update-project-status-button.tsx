'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Pause, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UpdateProjectStatusButtonProps {
  projectId: string
  workspaceSlug: string
}

export function UpdateProjectStatusButton({ projectId, workspaceSlug }: UpdateProjectStatusButtonProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)

      if (error) throw error

      setShowMenu(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating project status:', error)
      alert('Error al actualizar el estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        Actualizar Estado
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-10">
          <button
            onClick={() => handleStatusUpdate('completed')}
            disabled={loading}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4 text-green-600" />
            Completar
          </button>
          <button
            onClick={() => handleStatusUpdate('on_hold')}
            disabled={loading}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Pause className="h-4 w-4 text-yellow-600" />
            Pausar
          </button>
          <button
            onClick={() => handleStatusUpdate('cancelled')}
            disabled={loading}
            className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <XCircle className="h-4 w-4 text-red-600" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
