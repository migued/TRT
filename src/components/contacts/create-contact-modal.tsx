'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, User, Building2, Search, Plus, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  website: string | null
  contacts?: Array<{ count: number }>
}

interface CreateContactModalProps {
  workspaceSlug: string
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateContactModal({ workspaceSlug, workspaceId, isOpen, onClose, onSuccess }: CreateContactModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Contact form data
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    notes: ''
  })

  // Company search
  const [companySearch, setCompanySearch] = useState('')
  const [searchResults, setSearchResults] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showCompanyForm, setShowCompanyForm] = useState(false)
  const [searching, setSearching] = useState(false)

  // New company form data
  const [newCompanyData, setNewCompanyData] = useState({
    name: '',
    website: '',
    address: ''
  })

  // Search companies with debouncing
  useEffect(() => {
    if (companySearch.length < 3) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('companies')
          .select(`
            id,
            name,
            website,
            contacts(count)
          `)
          .eq('workspace_id', workspaceId)
          .ilike('name', `%${companySearch}%`)
          .limit(5)

        if (error) throw error
        setSearchResults(data || [])
      } catch (err) {
        console.error('Error searching companies:', err)
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [companySearch, workspaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      let companyId = selectedCompany?.id || null

      // Create new company if needed
      if (showCompanyForm && newCompanyData.name) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert([
            {
              workspace_id: workspaceId,
              name: newCompanyData.name,
              website: newCompanyData.website || null,
              address: newCompanyData.address || null,
              created_by: user.id
            }
          ])
          .select()
          .single()

        if (companyError) throw companyError
        companyId = newCompany.id
      }

      // Create contact
      const { error: contactError } = await supabase
        .from('contacts')
        .insert([
          {
            workspace_id: workspaceId,
            company_id: companyId,
            name: contactData.name,
            email: contactData.email || null,
            phone: contactData.phone || null,
            position: contactData.position || null,
            notes: contactData.notes || null,
            created_by: user.id
          }
        ])

      if (contactError) throw contactError

      // Success - close modal and refresh
      onClose()
      if (onSuccess) onSuccess()

      // Reset form
      setContactData({
        name: '',
        email: '',
        phone: '',
        position: '',
        notes: ''
      })
      setCompanySearch('')
      setSelectedCompany(null)
      setShowCompanyForm(false)
      setNewCompanyData({ name: '', website: '', address: '' })
    } catch (err) {
      console.error('Error creating contact:', err)
      setError(err instanceof Error ? err.message : 'Error al crear el contacto')
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
            <div className="p-2 bg-slate-100 rounded-lg">
              <User className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nuevo Contacto</h2>
              <p className="text-sm text-slate-600">Registra un nuevo contacto en el CRM</p>
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
            {/* Contact Name - Required */}
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 mb-2">
                Nombre completo <span className="text-slate-600">*</span>
              </label>
              <input
                type="text"
                id="contact-name"
                required
                value={contactData.name}
                onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="correo@ejemplo.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={contactData.phone}
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+52 55 1234 5678"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-2">
                Cargo
              </label>
              <input
                type="text"
                id="position"
                value={contactData.position}
                onChange={(e) => setContactData({ ...contactData, position: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Ej: Gerente de Ventas"
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
                value={contactData.notes}
                onChange={(e) => setContactData({ ...contactData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Información adicional sobre el contacto..."
                disabled={loading}
              />
            </div>

            {/* Company Section */}
            <div className="pt-6 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Empresa (Opcional)
              </label>

              {!selectedCompany && !showCompanyForm && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Buscar empresa existente... (mín. 3 letras)"
                      disabled={loading}
                    />
                  </div>

                  {/* Search Results */}
                  {searching && (
                    <div className="text-sm text-slate-600 p-3 bg-slate-50 rounded-lg">
                      Buscando...
                    </div>
                  )}

                  {!searching && companySearch.length >= 3 && searchResults.length > 0 && (
                    <div className="border border-slate-300 rounded-lg divide-y divide-slate-200 max-h-48 overflow-y-auto">
                      {searchResults.map((company) => {
                        const contactCount = company.contacts?.[0]?.count || 0
                        return (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => {
                              setSelectedCompany(company)
                              setCompanySearch('')
                              setSearchResults([])
                            }}
                            className="w-full p-3 text-left hover:bg-slate-100 transition-colors"
                          >
                            <div className="font-medium text-slate-900">{company.name}</div>
                            <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                              {company.website && (
                                <div className="flex items-center gap-1">
                                  <Globe className="h-3 w-3" />
                                  {company.website}
                                </div>
                              )}
                              <div className="text-slate-500">
                                {contactCount} {contactCount === 1 ? 'contacto' : 'contactos'}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!searching && companySearch.length >= 3 && searchResults.length === 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-slate-600 mb-3">No se encontraron empresas</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCompanyForm(true)
                          setNewCompanyData({ ...newCompanyData, name: companySearch })
                          setCompanySearch('')
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Crear nueva empresa
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Company */}
              {selectedCompany && (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-600" />
                        <span className="font-medium text-slate-900">{selectedCompany.name}</span>
                      </div>
                      {selectedCompany.website && (
                        <div className="text-sm text-slate-600 mt-1 ml-6">{selectedCompany.website}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCompany(null)}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* New Company Mini-Form */}
              {showCompanyForm && (
                <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Nueva Empresa</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCompanyForm(false)
                        setNewCompanyData({ name: '', website: '', address: '' })
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      value={newCompanyData.name}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="Nombre de la empresa *"
                      disabled={loading}
                    />
                    <input
                      type="url"
                      value={newCompanyData.website}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, website: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="Sitio web"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={newCompanyData.address}
                      onChange={(e) => setNewCompanyData({ ...newCompanyData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                      placeholder="Dirección"
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
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
              disabled={loading || !contactData.name}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Contacto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
