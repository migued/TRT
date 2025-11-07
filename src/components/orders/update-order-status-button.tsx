'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UpdateOrderStatusButtonProps {
  orderId: string
  currentStatus: string
  workspaceSlug: string
}

export function UpdateOrderStatusButton({ orderId, currentStatus, workspaceSlug }: UpdateOrderStatusButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      setShowMenu(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Error al actualizar el estado')
    } finally {
      setLoading(false)
    }
  }

  const nextStatus = currentStatus === 'pending' ? 'in_progress' : 'completed'
  const nextLabel = currentStatus === 'pending' ? 'Iniciar Proceso' : 'Marcar Completada'
  const NextIcon = currentStatus === 'pending' ? Clock : CheckCircle

  return (
    <div className="relative">
      <button
        onClick={() => handleStatusUpdate(nextStatus)}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
      >
        <NextIcon className="h-4 w-4" />
        {loading ? 'Actualizando...' : nextLabel}
      </button>
    </div>
  )
}
