'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, TrendingUp, Search, User, Building2 } from 'lucide-react'
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

interface Stage {
  id: string
  name: string
}

interface CreateOpportunityModalProps {
  workspaceSlug: string
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateOpportunityModal({ workspaceSlug, workspaceId, isOpen, onClose, onSuccess }: CreateOpportunityModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stages, setStages] = useState<Stage[]>([])

  // Opportunity data
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    currency: 'MXN',
    probability: '50',
    expected_close_date: '',
    stage: '',
    notes: ''
  })

  // Contact search
  const [contactSearch, setContactSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searching, setSearching] = useState(false)

  // Load stages on mount
  useEffect(() => {
    if (isOpen) {
      loadStages()
    }
  }, [isOpen, workspaceId])

  const loadStages = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('custom_stages')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .eq('type', 'opportunity')
        .eq('stage_type', 'active')
        .order('order_index', { ascending: true })

      if (error) throw error

      setStages(data || [])
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, stage: data[0].name }))
      }
    } catch (err) {
      console.error('Error loading stages:', err)
    }
  }

  // Search contacts with debouncing
  useEffect(() => {
    if (contactSearch.length < 3) {
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
          .ilike('name', `%${contactSearch}%`)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedContact) {
      setError('Debes seleccionar un contacto')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Create opportunity
      const { error: insertError } = await supabase
        .from('opportunities')
        .insert([
          {
            workspace_id: workspaceId,
            title: formData.title,
            contact_id: selectedContact.id,
            stage: formData.stage,
            amount: formData.amount ? parseFloat(formData.amount) : null,
            currency: formData.currency,
            probability: parseInt(formData.probability),
            expected_close_date: formData.expected_close_date || null,
            notes: formData.notes || null
          }
        ])

      if (insertError) throw insertError

      // Success - close modal and refresh
      onClose()
      if (onSuccess) onSuccess()
      router.refresh()

      // Reset form
      setFormData({
        title: '',
        amount: '',
        currency: 'MXN',
        probability: '50',
        expected_close_date: '',
        stage: stages[0]?.name || '',
        notes: ''
      })
      setContactSearch('')
      setSelectedContact(null)
    } catch (err) {
      console.error('Error creating opportunity:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la oportunidad')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nueva Oportunidad</h2>
              <p className="text-sm text-slate-600">Agrega una oportunidad al pipeline</p>
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
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title - Required */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ej: Implementación de software"
                disabled={loading}
              />
            </div>

            {/* Contact Search - Required */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Contacto <span className="text-red-500">*</span>
              </label>

              {!selectedContact ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Buscar contacto... (mín. 3 letras)"
                      disabled={loading}
                    />
                  </div>

                  {searching && (
                    <div className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                      Buscando...
                    </div>
                  )}

                  {!searching && contactSearch.length >= 3 && searchResults.length > 0 && (
                    <div className="border border-slate-300 rounded-lg divide-y divide-slate-200 max-h-48 overflow-y-auto">
                      {searchResults.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => {
                            setSelectedContact(contact)
                            setContactSearch('')
                            setSearchResults([])
                          }}
                          className="w-full p-3 text-left hover:bg-orange-50 transition-colors"
                        >
                          <div className="font-medium text-slate-900">{contact.name}</div>
                          <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                            {contact.email && <div>{contact.email}</div>}
                            {contact.companies && (
                              <div className="text-slate-500">Empresa: {contact.companies.name}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searching && contactSearch.length >= 3 && searchResults.length === 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg text-center text-sm text-slate-600">
                      No se encontraron contactos
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-slate-900">{selectedContact.name}</span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1 space-y-0.5 ml-6">
                        {selectedContact.email && <div>{selectedContact.email}</div>}
                        {selectedContact.companies && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {selectedContact.companies.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedContact(null)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Amount & Probability */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  id="amount"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Stage & Probability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-slate-700 mb-2">
                  Etapa <span className="text-red-500">*</span>
                </label>
                <select
                  id="stage"
                  required
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.name}>
                      {stage.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="probability" className="block text-sm font-medium text-slate-700 mb-2">
                  Probabilidad (%)
                </label>
                <input
                  type="number"
                  id="probability"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Expected Close Date */}
            <div>
              <label htmlFor="expected_close_date" className="block text-sm font-medium text-slate-700 mb-2">
                Fecha estimada de cierre
              </label>
              <input
                type="date"
                id="expected_close_date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                Notas
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Notas sobre la oportunidad..."
                disabled={loading}
              />
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
              disabled={loading || !formData.title || !selectedContact}
              className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Oportunidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
