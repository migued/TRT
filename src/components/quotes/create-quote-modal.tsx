'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, FileText, Search, User, Building2, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  companies: {
    id: string
    name: string
  } | null
}

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

interface CreateQuoteModalProps {
  workspaceSlug: string
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  opportunityId?: string
}

export function CreateQuoteModal({
  workspaceSlug,
  workspaceId,
  isOpen,
  onClose,
  onSuccess,
  opportunityId
}: CreateQuoteModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Contact search
  const [contactSearch, setContactSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searching, setSearching] = useState(false)

  // Products for search
  const [products, setProducts] = useState<Product[]>([])

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      unit_price: 0,
      subtotal: 0
    }
  ])

  // Quote data
  const [formData, setFormData] = useState({
    valid_until: '',
    tax_rate: '16', // 16% IVA for Mexico
    discount: '0',
    notes: '',
    terms: ''
  })

  // Load products on mount
  useEffect(() => {
    if (isOpen) {
      loadProducts()
      // If created from opportunity, pre-load opportunity data
      if (opportunityId) {
        loadOpportunityData()
      }
    }
  }, [isOpen, workspaceId, opportunityId])

  const loadProducts = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price')
        .eq('workspace_id', workspaceId)
        .order('name', { ascending: true })

      if (error) throw error
      setProducts(data || [])
    } catch (err) {
      console.error('Error loading products:', err)
    }
  }

  const loadOpportunityData = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          title,
          products,
          contacts (
            id,
            name,
            email,
            phone,
            companies (
              id,
              name
            )
          )
        `)
        .eq('id', opportunityId)
        .single()

      if (error) throw error

      // Set contact
      if (data.contacts) {
        setSelectedContact(data.contacts)
      }

      // Set line items from opportunity products if available
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        const items = data.products.map((p: any) => ({
          id: crypto.randomUUID(),
          description: p.name || p.description || '',
          quantity: p.quantity || 1,
          unit_price: p.price || 0,
          subtotal: (p.quantity || 1) * (p.price || 0)
        }))
        setLineItems(items)
      }
    } catch (err) {
      console.error('Error loading opportunity:', err)
    }
  }

  // Search contacts with debouncing
  useEffect(() => {
    if (contactSearch.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('contacts')
          .select(`
            id,
            name,
            email,
            phone,
            companies (
              id,
              name
            )
          `)
          .eq('workspace_id', workspaceId)
          .or(`name.ilike.%${contactSearch}%,email.ilike.%${contactSearch}%`)
          .limit(5)

        if (error) throw error
        setSearchResults(data || [])
      } catch (err) {
        console.error('Error searching contacts:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [contactSearch, workspaceId])

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

    if (!selectedContact) {
      setError('Selecciona un contacto')
      return
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.description)) {
      setError('Agrega al menos un artículo a la cotización')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()

      // Generate quote number
      const quoteNumber = `COT-${Date.now()}`

      const totals = calculateTotals()

      const { data, error: insertError } = await supabase
        .from('quotes')
        .insert({
          workspace_id: workspaceId,
          quote_number: quoteNumber,
          contact_id: selectedContact.id,
          items: lineItems,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          currency: 'MXN',
          status: 'draft',
          valid_until: formData.valid_until || null,
          notes: formData.notes || null,
          terms: formData.terms || null
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Success
      onClose()
      if (onSuccess) {
        onSuccess()
      }
      router.push(`/${workspaceSlug}/quotes/${data.id}`)
    } catch (err: any) {
      console.error('Error creating quote:', err)
      setError(err.message || 'Error al crear la cotización')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const formatter = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Nueva Cotización</h2>
              <p className="text-sm text-slate-600">Crear una propuesta comercial</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Contact Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Cliente *
            </label>
            {selectedContact ? (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <User className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedContact.name}</p>
                    {selectedContact.companies && (
                      <p className="text-sm text-slate-600">{selectedContact.companies.name}</p>
                    )}
                    {selectedContact.email && (
                      <p className="text-sm text-slate-500">{selectedContact.email}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Buscar cliente por nombre o email..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(contact => (
                      <button
                        key={contact.id}
                        type="button"
                        onClick={() => {
                          setSelectedContact(contact)
                          setContactSearch('')
                          setSearchResults([])
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left"
                      >
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <User className="h-4 w-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{contact.name}</p>
                          {contact.companies && (
                            <p className="text-sm text-slate-600">{contact.companies.name}</p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-slate-500">{contact.email}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-5 w-5 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-slate-700">
                Artículos *
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="inline-flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                <Plus className="h-4 w-4" />
                Agregar artículo
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, index) => (
                <div key={item.id} className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 space-y-3">
                    {/* Description with product selector */}
                    <div>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        placeholder="Descripción del artículo"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        list={`products-${item.id}`}
                      />
                      <datalist id={`products-${item.id}`}>
                        {products.map(product => (
                          <option key={product.id} value={product.name}>
                            {product.description}
                          </option>
                        ))}
                      </datalist>
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
                      className="flex-shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Descuento (%)</label>
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
                  <label className="block text-xs text-slate-600 mb-1">IVA (%)</label>
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
                    <span className="font-medium text-red-600">-{formatter.format(totals.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">IVA:</span>
                  <span className="font-medium text-slate-900">{formatter.format(totals.tax)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-300">
                  <span className="text-slate-900">Total:</span>
                  <span className="text-orange-600">{formatter.format(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Valid Until */}
          <div>
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
          <div>
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
          <div>
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
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Cotización'}
          </button>
        </div>
      </div>
    </div>
  )
}
