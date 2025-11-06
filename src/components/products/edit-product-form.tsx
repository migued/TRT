'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, Box, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  sku: string | null
  base_price: number | null
  currency: string
  type: 'physical' | 'digital' | 'service'
  weight_kg: number | null
  delivery_time_days: number | null
  active: boolean
  tags: string[]
}

interface EditProductFormProps {
  product: Product
  workspaceSlug: string
}

export function EditProductForm({ product, workspaceSlug }: EditProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    type: product.type,
    category: product.category || '',
    sku: product.sku || '',
    base_price: product.base_price?.toString() || '',
    currency: product.currency,
    active: product.active,
    weight_kg: product.weight_kg?.toString() || '',
    delivery_time_days: product.delivery_time_days?.toString() || '',
    tags: product.tags.join(', ')
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Prepare update data
      const updateData: any = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        category: formData.category || null,
        sku: formData.sku || null,
        base_price: formData.base_price ? parseFloat(formData.base_price) : null,
        currency: formData.currency,
        active: formData.active,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : [],
        updated_at: new Date().toISOString()
      }

      // Add type-specific fields
      if (formData.type === 'physical') {
        updateData.weight_kg = formData.weight_kg ? parseFloat(formData.weight_kg) : null
        updateData.delivery_time_days = null // Clear service field
      } else if (formData.type === 'service') {
        updateData.delivery_time_days = formData.delivery_time_days ? parseInt(formData.delivery_time_days) : null
        updateData.weight_kg = null // Clear physical field
      } else {
        // Digital - clear both
        updateData.weight_kg = null
        updateData.delivery_time_days = null
      }

      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id)

      if (updateError) throw updateError

      // Redirect to product detail page
      router.push(`/${workspaceSlug}/products/${product.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error updating product:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar el producto')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/${workspaceSlug}/products/${product.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a detalles
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Producto</h1>
            <p className="text-slate-600">Actualiza la información de {product.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Name - Required */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
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
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Describe el producto o servicio..."
                disabled={loading}
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Tipo de Producto <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'physical' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'physical'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  disabled={loading}
                >
                  <Package className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium text-slate-900">Físico</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'digital' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'digital'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  disabled={loading}
                >
                  <Box className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium text-slate-900">Digital</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'service' })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.type === 'service'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  disabled={loading}
                >
                  <Zap className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-sm font-medium text-slate-900">Servicio</div>
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

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-2">
                Etiquetas
              </label>
              <input
                type="text"
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Ej: premium, nuevo, destacado (separados por comas)"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">
                Separa las etiquetas con comas
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-slate-300 rounded"
                disabled={loading}
              />
              <label htmlFor="active" className="text-sm font-medium text-slate-700 cursor-pointer">
                Producto activo (visible en el catálogo)
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            <Link
              href={`/${workspaceSlug}/products/${product.id}`}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
