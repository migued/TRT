'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
}

interface LineItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface EditQuoteFormProps {
  quote: any
  products: Product[]
  workspaceSlug: string
  workspaceId: string
}

export function EditQuoteForm({ quote, products, workspaceSlug, workspaceId }: EditQuoteFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize line items from quote
  const [lineItems, setLineItems] = useState<LineItem[]>(
    Array.isArray(quote.items) && quote.items.length > 0
      ? quote.items.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          subtotal: item.subtotal || 0
        }))
      : [{
          id: crypto.randomUUID(),
          description: '',
          quantity: 1,
          unit_price: 0,
          subtotal: 0
        }]
  )

  // Initialize form data
  const [formData, setFormData] = useState({
    valid_until: quote.valid_until || '',
    tax_rate: String((quote.tax / (quote.subtotal - (quote.discount || 0))) * 100 || 16),
    discount: String((quote.discount / quote.subtotal) * 100 || 0),
    notes: quote.notes || '',
    terms: quote.terms || ''
  })

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
    const discountAmount = (subtotal * parseFloat(formData.discount || '0')) / 100
    const taxableAmount = subtotal - discountAmount
    const taxAmount = (taxableAmount * parseFloat(formData.tax_rate || '0')) / 100
    const total = taxableAmount + taxAmount

    return {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total
    }
  }

  const totals = calculateTotals()

  // Add line item
  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        unit_price: 0,
        subtotal: 0
      }
    ])
  }

  // Remove line item
  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id))
    }
  }

  // Update line item
  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value }
        // Recalculate subtotal
        updated.subtotal = updated.quantity * updated.unit_price
        return updated
      }
      return item
    }))
  }

  // Select product for line item
  const selectProductForItem = (itemId: string, product: Product) => {
    setLineItems(lineItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          description: product.name + (product.description ? ` - ${product.description}` : ''),
          unit_price: product.price,
          subtotal: item.quantity * product.price
        }
      }
      return item
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      setError('Agrega al menos un artículo a la cotización')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const totals = calculateTotals()

      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          items: lineItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          valid_until: formData.valid_until || null,
          notes: formData.notes || null,
          terms: formData.terms || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', quote.id)

      if (updateError) throw updateError

      // Success
      router.push(`/${workspaceSlug}/quotes/${quote.id}`)
    } catch (err: any) {
      console.error('Error updating quote:', err)
      setError(err.message || 'Error al actualizar la cotización')
      setLoading(false)
    }
  }

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${workspaceSlug}/quotes/${quote.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la cotización
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Cotización</h1>
            <p className="mt-1 text-sm text-slate-600">{quote.quote_number}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {error && (
          <div className="bg-slate-100 border border-slate-200 text-slate-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Client Info (read-only) */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Cliente</h2>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-medium text-slate-900">{quote.contacts?.name}</p>
            {quote.contacts?.companies && (
              <p className="text-sm text-slate-600">{quote.contacts.companies.name}</p>
            )}
            {quote.contacts?.email && (
              <p className="text-sm text-slate-500">{quote.contacts.email}</p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Artículos</h2>
            <button
              type="button"
              onClick={addLineItem}
              className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-600 font-medium"
            >
              <Plus className="h-4 w-4" />
              Agregar artículo
            </button>
          </div>

          <div className="space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-1 space-y-3">
                  {/* Description */}
                  <div>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Descripción del artículo"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {products.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {products.slice(0, 3).map(product => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => selectProductForItem(item.id, product)}
                            className="text-xs px-2 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-slate-700"
                          >
                            {product.name} - {formatter.format(product.price)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Precio Unitario</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Subtotal</label>
                      <div className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 font-medium">
                        {formatter.format(item.subtotal)}
                      </div>
                    </div>
                  </div>
                </div>

                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(item.id)}
                    className="flex-shrink-0 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Totales</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Descuento (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">IVA (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-300">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium text-slate-900">{formatter.format(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Descuento:</span>
                  <span className="font-medium text-slate-600">-{formatter.format(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">IVA:</span>
                <span className="font-medium text-slate-900">{formatter.format(totals.tax)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                <span className="text-slate-900">Total:</span>
                <span className="text-slate-600">{formatter.format(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Valid Until */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Válida Hasta
          </label>
          <input
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Notas Internas
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Notas internas sobre esta cotización..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Terms */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Términos y Condiciones
          </label>
          <textarea
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            rows={3}
            placeholder="Términos y condiciones de la cotización..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href={`/${workspaceSlug}/quotes/${quote.id}`}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
