'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Package, Box, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface CreateProductModalProps {
  workspaceSlug: string
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateProductModal({ workspaceSlug, workspaceId, isOpen, onClose, onSuccess }: CreateProductModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'service' as 'physical' | 'digital' | 'service',
    category: '',
    sku: '',
    base_price: '',
    currency: 'MXN',
    active: true,
    // Physical product fields
    weight_kg: '',
    // Service fields
    delivery_time_days: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Prepare data based on type
      const productData: any = {
        workspace_id: workspaceId,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        category: formData.category || null,
        sku: formData.sku || null,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        currency: formData.currency,
        active: formData.active
      }

      // Add type-specific fields
      if (formData.type === 'physical' && formData.weight_kg) {
        productData.weight_kg = parseFloat(formData.weight_kg)
      }

      if (formData.type === 'service' && formData.delivery_time_days) {
        productData.delivery_time_days = parseInt(formData.delivery_time_days)
      }

      // Create product
      const { error: insertError } = await supabase
        .from('products')
        .insert([productData])

      if (insertError) throw insertError

      // Success - close modal and refresh
      onClose()
      if (onSuccess) onSuccess()

      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'service',
        category: '',
        sku: '',
        base_price: '',
        currency: 'MXN',
        active: true,
        weight_kg: '',
        delivery_time_days: ''
      })
    } catch (err) {
      console.error('Error creating product:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el producto')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Package className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nuevo Producto</h2>
              <p className="text-sm text-slate-600">Agrega un producto o servicio al catálogo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Name - Required */}
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-slate-700 mb-2">
                Nombre <span className="text-slate-600">*</span>
              </label>
              <input
                type="text"
                id="product-name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: Consultoría empresarial"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe el producto o servicio..."
                disabled={loading}
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tipo de Producto <span className="text-slate-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'physical' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'physical'
                      ? 'border-slate-200 bg-slate-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  disabled={loading}
                >
                  <Package className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  <div className="text-sm font-medium text-slate-900">Físico</div>
                  <div className="text-xs text-slate-500 mt-1">Producto tangible</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'digital' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'digital'
                      ? 'border-slate-200 bg-slate-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  disabled={loading}
                >
                  <Box className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  <div className="text-sm font-medium text-slate-900">Digital</div>
                  <div className="text-xs text-slate-500 mt-1">Producto descargable</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'service' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'service'
                      ? 'border-slate-200 bg-slate-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  disabled={loading}
                >
                  <Zap className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  <div className="text-sm font-medium text-slate-900">Servicio</div>
                  <div className="text-xs text-slate-500 mt-1">Servicio o consultoría</div>
                </button>
              </div>
            </div>

            {/* Category & SKU */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría
                </label>
                <input
                  type="text"
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Consultoría"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-2">
                  SKU / Código
                </label>
                <input
                  type="text"
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: CONS-001"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="base-price" className="block text-sm font-medium text-slate-700 mb-2">
                  Precio Base
                </label>
                <input
                  type="number"
                  id="base-price"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-slate-700 mb-2">
                  Moneda
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={loading}
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Type-specific fields */}
            {formData.type === 'physical' && (
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-slate-700 mb-2">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  step="0.01"
                  min="0"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
            )}

            {formData.type === 'service' && (
              <div>
                <label htmlFor="delivery-time" className="block text-sm font-medium text-slate-700 mb-2">
                  Tiempo de entrega (días)
                </label>
                <input
                  type="number"
                  id="delivery-time"
                  min="1"
                  value={formData.delivery_time_days}
                  onChange={(e) => setFormData({ ...formData, delivery_time_days: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: 15"
                  disabled={loading}
                />
              </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-slate-600 focus:ring-purple-500 border-slate-300 rounded"
                disabled={loading}
              />
              <label htmlFor="active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Producto activo (visible en el catálogo)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
