'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Building2, User, Search, Plus, Linkedin, Facebook, Instagram, Twitter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company_id: string | null
  companies?: {
    name: string
  }
}

interface CreateCompanyModalProps {
  workspaceSlug: string
  workspaceId: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CreateCompanyModal({ workspaceSlug, workspaceId, isOpen, onClose, onSuccess }: CreateCompanyModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Company form data
  const [companyData, setCompanyData] = useState({
    name: '',
    website: '',
    address: '',
    tax_id: '',
    linkedin_url: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    notes: ''
  })

  // Contact search
  const [contactSearch, setContactSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [searching, setSearching] = useState(false)

  // New contact form data
  const [newContactData, setNewContactData] = useState({
    name: '',
    email: '',
    phone: '',
    position: ''
  })

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
            company_id,
            companies (
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
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuario no autenticado')

      // Create company
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([
          {
            workspace_id: workspaceId,
            name: companyData.name,
            website: companyData.website || null,
            address: companyData.address || null,
            tax_id: companyData.tax_id || null,
            linkedin_url: companyData.linkedin_url || null,
            facebook_url: companyData.facebook_url || null,
            instagram_url: companyData.instagram_url || null,
            twitter_url: companyData.twitter_url || null,
            notes: companyData.notes || null,
            created_by: user.id
          }
        ])
        .select()
        .single()

      if (companyError) throw companyError

      // Handle contact association
      if (selectedContact) {
        // Link existing contact to company
        const { error: updateError } = await supabase
          .from('contacts')
          .update({ company_id: newCompany.id })
          .eq('id', selectedContact.id)

        if (updateError) throw updateError
      } else if (showContactForm && newContactData.name) {
        // Create new contact linked to company
        const { error: contactError } = await supabase
          .from('contacts')
          .insert([
            {
              workspace_id: workspaceId,
              company_id: newCompany.id,
              name: newContactData.name,
              email: newContactData.email || null,
              phone: newContactData.phone || null,
              position: newContactData.position || null,
              created_by: user.id
            }
          ])

        if (contactError) throw contactError
      }

      // Success - close modal and refresh
      onClose()
      if (onSuccess) onSuccess()
      router.refresh()

      // Reset form
      setCompanyData({
        name: '',
        website: '',
        address: '',
        tax_id: '',
        linkedin_url: '',
        facebook_url: '',
        instagram_url: '',
        twitter_url: '',
        notes: ''
      })
      setContactSearch('')
      setSelectedContact(null)
      setShowContactForm(false)
      setNewContactData({ name: '', email: '', phone: '', position: '' })
    } catch (err) {
      console.error('Error creating company:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la empresa')
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
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nueva Empresa</h2>
              <p className="text-sm text-slate-600">Registra una nueva empresa en el CRM</p>
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
            {/* Company Name - Required */}
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la empresa <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="company-name"
                required
                value={companyData.name}
                onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Acme Corporation"
                disabled={loading}
              />
            </div>

            {/* Website & RFC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-2">
                  Sitio web
                </label>
                <input
                  type="url"
                  id="website"
                  value={companyData.website}
                  onChange={(e) => setCompanyData({ ...companyData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://ejemplo.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="tax-id" className="block text-sm font-medium text-slate-700 mb-2">
                  RFC
                </label>
                <input
                  type="text"
                  id="tax-id"
                  value={companyData.tax_id}
                  onChange={(e) => setCompanyData({ ...companyData, tax_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC123456789"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                id="address"
                value={companyData.address}
                onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Calle, Número, Colonia, Ciudad, Estado, CP"
                disabled={loading}
              />
            </div>

            {/* Social Media */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Redes Sociales
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <input
                    type="url"
                    value={companyData.linkedin_url}
                    onChange={(e) => setCompanyData({ ...companyData, linkedin_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/company/..."
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <input
                    type="url"
                    value={companyData.facebook_url}
                    onChange={(e) => setCompanyData({ ...companyData, facebook_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/..."
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500 flex-shrink-0" />
                  <input
                    type="url"
                    value={companyData.instagram_url}
                    onChange={(e) => setCompanyData({ ...companyData, instagram_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/..."
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-5 w-5 text-slate-900 flex-shrink-0" />
                  <input
                    type="url"
                    value={companyData.twitter_url}
                    onChange={(e) => setCompanyData({ ...companyData, twitter_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://twitter.com/... o https://x.com/..."
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                Notas
              </label>
              <textarea
                id="notes"
                value={companyData.notes}
                onChange={(e) => setCompanyData({ ...companyData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Información adicional sobre la empresa..."
                disabled={loading}
              />
            </div>

            {/* Contact Section */}
            <div className="pt-6 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Contacto Principal (Opcional)
              </label>

              {!selectedContact && !showContactForm && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Buscar contacto existente... (mín. 3 letras)"
                      disabled={loading}
                    />
                  </div>

                  {/* Search Results */}
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
                          className="w-full p-3 text-left hover:bg-blue-50 transition-colors"
                        >
                          <div className="font-medium text-slate-900">{contact.name}</div>
                          <div className="text-sm text-slate-600 mt-1 space-y-0.5">
                            {contact.email && <div>{contact.email}</div>}
                            {contact.phone && <div>{contact.phone}</div>}
                            {contact.companies && (
                              <div className="text-slate-500">Empresa actual: {contact.companies.name}</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!searching && contactSearch.length >= 3 && searchResults.length === 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg text-center">
                      <p className="text-sm text-slate-600 mb-3">No se encontraron contactos</p>
                      <button
                        type="button"
                        onClick={() => {
                          setShowContactForm(true)
                          setNewContactData({ ...newContactData, name: contactSearch })
                          setContactSearch('')
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                      >
                        <Plus className="h-4 w-4" />
                        Crear nuevo contacto
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected Contact */}
              {selectedContact && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-slate-900">{selectedContact.name}</span>
                      </div>
                      <div className="text-sm text-slate-600 mt-1 space-y-0.5 ml-6">
                        {selectedContact.email && <div>{selectedContact.email}</div>}
                        {selectedContact.phone && <div>{selectedContact.phone}</div>}
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

              {/* New Contact Mini-Form */}
              {showContactForm && (
                <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Nuevo Contacto</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContactForm(false)
                        setNewContactData({ name: '', email: '', phone: '', position: '' })
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={newContactData.name}
                        onChange={(e) => setNewContactData({ ...newContactData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Nombre *"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        value={newContactData.email}
                        onChange={(e) => setNewContactData({ ...newContactData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Email"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        value={newContactData.phone}
                        onChange={(e) => setNewContactData({ ...newContactData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Teléfono"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newContactData.position}
                        onChange={(e) => setNewContactData({ ...newContactData, position: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Cargo"
                        disabled={loading}
                      />
                    </div>
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
              disabled={loading || !companyData.name}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
