'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Linkedin, Facebook, Instagram, Twitter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  name: string
  website: string | null
  address: string | null
  tax_id: string | null
  linkedin_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  twitter_url: string | null
  notes: string | null
}

interface EditCompanyFormProps {
  company: Company
  workspaceSlug: string
}

export function EditCompanyForm({ company, workspaceSlug }: EditCompanyFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: company.name,
    website: company.website || '',
    address: company.address || '',
    tax_id: company.tax_id || '',
    linkedin_url: company.linkedin_url || '',
    facebook_url: company.facebook_url || '',
    instagram_url: company.instagram_url || '',
    twitter_url: company.twitter_url || '',
    notes: company.notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error: updateError } = await supabase
        .from('companies')
        .update({
          name: formData.name,
          website: formData.website || null,
          address: formData.address || null,
          tax_id: formData.tax_id || null,
          linkedin_url: formData.linkedin_url || null,
          facebook_url: formData.facebook_url || null,
          instagram_url: formData.instagram_url || null,
          twitter_url: formData.twitter_url || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)

      if (updateError) throw updateError

      // Redirect to company detail page
      router.push(`/${workspaceSlug}/companies/${company.id}`)
    } catch (err) {
      console.error('Error updating company:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar la empresa')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/${workspaceSlug}/companies/${company.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a detalles
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Building2 className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Editar Empresa</h1>
            <p className="text-slate-600">Actualiza la información de {company.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Name - Required */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Nombre de la empresa <span className="text-slate-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://ejemplo.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="tax_id" className="block text-sm font-medium text-slate-700 mb-2">
                  RFC
                </label>
                <input
                  type="text"
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <Linkedin className="h-5 w-5 text-slate-600 flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://linkedin.com/company/..."
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-slate-600 flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://facebook.com/..."
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Instagram className="h-5 w-5 text-pink-500 flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://instagram.com/..."
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Twitter className="h-5 w-5 text-slate-900 flex-shrink-0" />
                  <input
                    type="url"
                    value={formData.twitter_url}
                    onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
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
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional sobre la empresa..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>

            <Link
              href={`/${workspaceSlug}/companies/${company.id}`}
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
