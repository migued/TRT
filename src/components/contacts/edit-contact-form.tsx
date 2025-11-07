'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  notes: string | null
}

interface EditContactFormProps {
  workspaceSlug: string
  contact: Contact
}

export function EditContactForm({ workspaceSlug, contact }: EditContactFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: contact.name,
    email: contact.email || '',
    phone: contact.phone || '',
    notes: contact.notes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()

      // Update contact
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          notes: formData.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contact.id)

      if (updateError) throw updateError

      // Redirect to contact detail
      router.push(`/${workspaceSlug}/contacts/${contact.id}`)
    } catch (err: any) {
      console.error('Error updating contact:', err)
      setError(err.message || 'Error al actualizar el contacto')
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
          href={`/${workspaceSlug}/contacts/${contact.id}`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al contacto
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Editar Contacto
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Actualiza la información de {contact.name}
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
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-white hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <Link
            href={`/${workspaceSlug}/contacts/${contact.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
