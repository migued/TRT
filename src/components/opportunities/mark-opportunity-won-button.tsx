'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Check, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface MarkOpportunityWonButtonProps {
  opportunityId: string
  opportunityTitle: string
  workspaceSlug: string
  workspaceId: string
  contactId: string
}

export function MarkOpportunityWonButton({
  opportunityId,
  opportunityTitle,
  workspaceSlug,
  workspaceId,
  contactId
}: MarkOpportunityWonButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCreateOrder, setShowCreateOrder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasOrder, setHasOrder] = useState(false)
  const [acceptedQuote, setAcceptedQuote] = useState<any>(null)

  useEffect(() => {
    if (showConfirm) {
      checkForOrderAndQuote()
    }
  }, [showConfirm])

  const checkForOrderAndQuote = async () => {
    try {
      const supabase = createClient()

      // Check if order exists
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .single()

      setHasOrder(!!order)

      // Get accepted quote if exists
      const { data: quote } = await supabase
        .from('quotes')
        .select('*')
        .eq('opportunity_id', opportunityId)
        .eq('status', 'accepted')
        .single()

      setAcceptedQuote(quote)
    } catch (err) {
      console.error('Error checking for order/quote:', err)
    }
  }

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

      // If no order exists, prompt to create one
      if (!hasOrder && !acceptedQuote) {
        setShowConfirm(false)
        setShowCreateOrder(true)
      } else {
        // Already has order or accepted quote will auto-create one
        setShowConfirm(false)
        router.refresh()
      }
    } catch (err) {
      console.error('Error marking opportunity as won:', err)
      setError(err instanceof Error ? err.message : 'Error al marcar como ganada')
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    setLoading(true)

    try {
      const supabase = createClient()

      // Generate order number
      const { data: orderNumber, error: numberError } = await supabase
        .rpc('generate_order_number', { p_workspace_id: workspaceId })

      if (numberError) throw numberError

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          workspace_id: workspaceId,
          order_number: orderNumber as string,
          contact_id: contactId,
          opportunity_id: opportunityId,
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          total: 0,
          currency: 'MXN',
          status: 'pending',
          notes: `Orden creada desde oportunidad: ${opportunityTitle}`
        })
        .select()
        .single()

      if (orderError) throw orderError

      setShowCreateOrder(false)
      router.push(`/${workspaceSlug}/orders/${order.id}`)
    } catch (err) {
      console.error('Error creating order:', err)
      setError(err instanceof Error ? err.message : 'Error al crear orden')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
      >
        <Trophy className="h-4 w-4" />
        Marcar como Ganada
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Trophy className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Marcar como Ganada
                </h3>
                <p className="text-slate-600">
                  ¿Confirmas que ganaste la oportunidad <strong>{opportunityTitle}</strong>?
                </p>
                {hasOrder && (
                  <p className="text-sm text-slate-500 mt-2">
                    ✓ Ya existe una orden para esta oportunidad.
                  </p>
                )}
                {acceptedQuote && (
                  <p className="text-sm text-slate-500 mt-2">
                    ✓ Hay una cotización aceptada. Se creará automáticamente una orden.
                  </p>
                )}
                {!hasOrder && !acceptedQuote && (
                  <p className="text-sm text-slate-500 mt-2">
                    Después podrás crear una orden para esta oportunidad.
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
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
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-100 inline-flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                {loading ? 'Marcando...' : 'Marcar como Ganada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg">
                <Package className="h-6 w-6 text-slate-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  ¡Oportunidad Ganada!
                </h3>
                <p className="text-slate-600">
                  ¿Deseas crear una orden ahora para <strong>{opportunityTitle}</strong>?
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  Esto te llevará a la página de creación de orden con los datos prellenados.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateOrder(false)
                  router.refresh()
                }}
                disabled={loading}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50"
              >
                Más Tarde
              </button>
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-100 inline-flex items-center gap-2"
              >
                <Package className="h-4 w-4" />
                {loading ? 'Creando...' : 'Crear Orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
