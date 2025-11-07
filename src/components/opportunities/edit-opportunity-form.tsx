'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Search, User, Building2, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  name: string
  email: string | null
  companies: {
    id: string
    name: string
  } | null
}

interface Stage {
  id: string
  name: string
}

interface Opportunity {
  id: string
  title: string
  amount: number | null
  currency: string
  probability: number
  expected_close_date: string | null
  stage: string
  notes: string | null
  contact_id: string
  contacts: {
    id: string
    name: string
    email: string | null
    companies: {
      id: string
      name: string
    } | null
  }
}

interface EditOpportunityFormProps {
  opportunity: Opportunity
  stages: Stage[]
  workspaceSlug: string
  workspaceId: string
}

export function EditOpportunityForm({ opportunity, stages, workspaceSlug, workspaceId }: EditOpportunityFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    title: opportunity.title,
    amount: opportunity.amount?.toString() || '',
    currency: opportunity.currency,
    probability: opportunity.probability.toString(),
    expected_close_date: opportunity.expected_close_date || '',
    stage: opportunity.stage,
    notes: opportunity.notes || ''
  })

  // Contact state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(opportunity.contacts)
  const [contactSearch, setContactSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [searching, setSearching] = useState(false)

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

      const { error: updateError } = await supabase
        .from('opportunities')
        .update({
          title: formData.title,
          contact_id: selectedContact.id,
          stage: formData.stage,
          amount: formData.amount ? parseFloat(formData.amount) : null,
          currency: formData.currency,
          probability: parseInt(formData.probability),
          expected_close_date: formData.expected_close_date || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', opportunity.id)

      if (updateError) throw updateError

      // Redirect to opportunity detail page
      router.push(`/${workspaceSlug}/opportunities/${opportunity.id}`)
    } catch (err) {
      console.error('Error updating opportunity:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar la oportunidad')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/${workspaceSlug}/opportunities/${opportunity.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a detalles
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <TrendingUp className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Oportunidad</h1>
            <p className="text-slate-600">Actualiza la información de {opportunity.title}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Title - Required */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                Título <span className="text-slate-600">*</span>
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

            {/* Contact - Required */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Contacto <span className="text-slate-600">*</span>
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
                          className="w-full p-3 text-left hover:bg-slate-100 transition-colors"
                        >
                          <div className="font-medium text-slate-900">{contact.name}</div>
                          <div className="text-sm text-slate-600 mt-1">
                            {contact.email && <div>{contact.email}</div>}
                            {contact.companies && (
                              <div className="text-slate-500">Empresa: {contact.companies.name}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-600" />
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

            {/* Amount & Currency */}
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
                  Etapa <span className="text-slate-600">*</span>
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
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Notas sobre la oportunidad..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || !formData.title || !selectedContact}
              className="px-6 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            <Link
              href={`/${workspaceSlug}/opportunities/${opportunity.id}`}
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
