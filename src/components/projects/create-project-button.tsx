'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Folder } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CreateProjectButtonProps {
  orderId: string
  workspaceSlug: string
  workspaceId: string
}

export function CreateProjectButton({ orderId, workspaceSlug, workspaceId }: CreateProjectButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
  })

  const handleCreate = async () => {
    if (!formData.title) {
      alert('El título es requerido')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // Get order data
      const { data: order } = await supabase
        .from('orders')
        .select('contact_id')
        .eq('id', orderId)
        .single()

      if (!order) throw new Error('Order not found')

      // Get first project stage
      const { data: stages } = await supabase
        .from('custom_stages')
        .select('name')
        .eq('workspace_id', workspaceId)
        .eq('type', 'project')
        .order('order_index', { ascending: true })
        .limit(1)

      const firstStage = stages?.[0]?.name || 'En Planificación'

      // Create project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          workspace_id: workspaceId,
          title: formData.title,
          description: formData.description || null,
          contact_id: order.contact_id,
          order_id: orderId,
          stage: firstStage,
          status: 'active',
          start_date: formData.start_date || null,
          due_date: formData.due_date || null
        })
        .select()
        .single()

      if (error) throw error

      setShowModal(false)
      router.push(`/${workspaceSlug}/projects/${project.id}`)
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert(error.message || 'Error al crear el proyecto')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
      >
        <Folder className="h-4 w-4" />
        Crear Proyecto
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Crear Proyecto
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nombre del proyecto..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descripción del proyecto..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha Entrega
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Proyecto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
