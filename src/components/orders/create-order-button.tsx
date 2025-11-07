'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CreateOrderButtonProps {
  quoteId: string
  workspaceSlug: string
  workspaceId: string
}

export function CreateOrderButton({ quoteId, workspaceSlug, workspaceId }: CreateOrderButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Get quote data
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (quoteError) throw quoteError

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`

      // Create order from quote
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          workspace_id: workspaceId,
          order_number: orderNumber,
          contact_id: quote.contact_id,
          opportunity_id: quote.opportunity_id,
          quote_id: quoteId,
          items: quote.items,
          subtotal: quote.subtotal,
          tax: quote.tax,
          discount: quote.discount,
          total: quote.total,
          currency: quote.currency,
          status: 'pending',
          notes: quote.notes
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create initial income transaction for the order
      await supabase
        .from('transactions')
        .insert({
          workspace_id: workspaceId,
          type: 'income',
          order_id: order.id,
          amount: order.total,
          currency: order.currency,
          category: 'Venta',
          description: `Ingreso por orden ${order.order_number}`,
          payment_method: 'transfer',
          transaction_date: new Date().toISOString().split('T')[0]
        })

      setShowConfirm(false)
      router.push(`/${workspaceSlug}/orders/${order.id}`)
    } catch (error: any) {
      console.error('Error creating order:', error)
      alert(error.message || 'Error al crear la orden')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium"
      >
        <ShoppingCart className="h-4 w-4" />
        Crear Orden
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              ¿Crear orden de venta?
            </h3>
            <p className="text-slate-600 mb-6">
              Esto creará una orden de venta confirmada a partir de esta cotización aceptada. Se registrará automáticamente como ingreso en el sistema financiero.
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
                onClick={handleCreate}
                disabled={loading}
                className="px-4 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Sí, crear orden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
