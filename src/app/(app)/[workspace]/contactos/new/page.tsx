'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function NewContactPage() {
  const params = useParams()
  const workspaceSlug = params.workspace as string
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Get workspace ID
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', workspaceSlug)
        .single()

      if (!workspace) {
        throw new Error('Workspace not found')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Create contact
      const { error: insertError } = await supabase
        .from('contacts')
        .insert({
          workspace_id: workspace.id,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          notes: formData.notes || null,
          created_by: user?.id,
          source: 'manual',
        })

      if (insertError) throw insertError

      // Redirect to contacts list
      router.push(`/${workspaceSlug}/contacts`)
    } catch (err: any) {
      console.error('Error creating contact:', err)
      setError(err.message || 'Error al crear el contacto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${workspaceSlug}/contacts`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a contactos
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Nuevo Contacto
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Agrega un nuevo contacto a tu CRM
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow">
        {error && (
          <div className="mb-6 rounded-md bg-slate-100 p-4 text-sm text-slate-600">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Name - Required */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-slate-700"
            >
              Nombre <span className="text-slate-600">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Juan Pérez"
            />
          </div>

          {/* Email - Optional */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="juan@empresa.com"
            />
          </div>

          {/* Phone - Optional */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-slate-700"
            >
              Teléfono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="+52 55 1234 5678"
            />
          </div>

          {/* Notes - Optional */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-slate-700"
            >
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Información adicional sobre el contacto..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear Contacto'}
          </button>
          <Link
            href={`/${workspaceSlug}/contacts`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
