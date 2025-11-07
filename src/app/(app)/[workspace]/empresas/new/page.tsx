'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function NewCompanyPage() {
  const params = useParams()
  const workspaceSlug = params.workspace as string
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    tax_id: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Get workspace_id from slug
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', workspaceSlug)
        .single()

      if (!workspace) {
        throw new Error('Workspace no encontrado')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuario no autenticado')
      }

      // Create company
      const { error: insertError } = await supabase
        .from('companies')
        .insert([
          {
            workspace_id: workspace.id,
            name: formData.name,
            website: formData.website || null,
            industry: formData.industry || null,
            size: formData.size || null,
            tax_id: formData.tax_id || null,
            notes: formData.notes || null,
            created_by: user.id
          }
        ])

      if (insertError) throw insertError

      // Redirect to companies list
      router.push(`/${workspaceSlug}/companies`)
      router.refresh()
    } catch (err) {
      console.error('Error creating company:', err)
      setError(err instanceof Error ? err.message : 'Error al crear la empresa')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/${workspaceSlug}/companies`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a empresas
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Building2 className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nueva Empresa</h1>
            <p className="text-slate-600">Registra una nueva empresa en el CRM</p>
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

            {/* Website */}
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

            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-2">
                Industria
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Seleccionar industria...</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Manufactura">Manufactura</option>
                <option value="Servicios">Servicios</option>
                <option value="Retail">Retail</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Construcción">Construcción</option>
                <option value="Alimentación">Alimentación</option>
                <option value="Logística">Logística</option>
                <option value="Consultoría">Consultoría</option>
                <option value="Otra">Otra</option>
              </select>
            </div>

            {/* Company Size */}
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-slate-700 mb-2">
                Tamaño de empresa
              </label>
              <select
                id="size"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="">Seleccionar tamaño...</option>
                <option value="1-10">1-10 empleados</option>
                <option value="11-50">11-50 empleados</option>
                <option value="51-200">51-200 empleados</option>
                <option value="201-500">201-500 empleados</option>
                <option value="501+">501+ empleados</option>
              </select>
            </div>

            {/* Tax ID (RFC for Mexico) */}
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
                placeholder="Ej: ABC123456789"
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
              {loading ? 'Guardando...' : 'Guardar Empresa'}
            </button>

            <Link
              href={`/${workspaceSlug}/companies`}
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
