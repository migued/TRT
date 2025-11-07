import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Building2, Edit, Trash2 } from 'lucide-react'
import { notFound, redirect } from 'next/navigation'
import { DeleteContactButton } from '@/components/contacts/delete-contact-button'
import { AIAssistant } from '@/components/ai/ai-assistant'

interface ContactDetailPageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function ContactDetailPage({ params }: ContactDetailPageProps) {
  const { workspace: workspaceSlug, id: contactId } = await params
  const supabase = await createClient()

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    redirect('/login')
  }

  // Get contact with company info
  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      *,
      companies(id, name)
    `)
    .eq('id', contactId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !contact) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${workspaceSlug}/contacts`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a contactos
        </Link>
      </div>

      {/* Contact Card */}
      <div className="rounded-lg bg-white shadow">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {contact.name}
              </h1>
              {contact.companies && (
                <div className="mt-1 flex items-center gap-2 text-slate-600">
                  <Building2 className="h-4 w-4" />
                  <span>{(contact.companies as any).name}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${workspaceSlug}/contacts/${contactId}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Link>
              <DeleteContactButton
                workspaceSlug={workspaceSlug}
                contactId={contactId}
                contactName={contact.name}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="px-6 py-6">
          <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">
            Información de Contacto
          </h2>
          <dl className="space-y-4">
            {contact.email && (
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm font-medium text-slate-700">Email</dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {contact.email}
                    </a>
                  </dd>
                </div>
              </div>
            )}

            {contact.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <dt className="text-sm font-medium text-slate-700">Teléfono</dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {contact.phone}
                    </a>
                  </dd>
                </div>
              </div>
            )}

            {(!contact.email && !contact.phone) && (
              <p className="text-sm text-slate-500">
                No hay información de contacto disponible
              </p>
            )}
          </dl>
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-6">
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">
              Etiquetas
            </h2>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div className="border-t border-slate-200 px-6 py-6">
            <h2 className="text-sm font-medium text-slate-700 uppercase tracking-wider mb-4">
              Notas
            </h2>
            <p className="text-slate-600 whitespace-pre-wrap">{contact.notes}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-slate-700">Creado</dt>
              <dd className="mt-1 text-slate-600">
                {new Date(contact.created_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-700">Actualizado</dt>
              <dd className="mt-1 text-slate-600">
                {new Date(contact.updated_at).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Related Items Placeholder */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-900">Oportunidades</h3>
          <p className="mt-2 text-sm text-slate-600">
            Próximamente: Ver oportunidades relacionadas
          </p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-900">Órdenes</h3>
          <p className="mt-2 text-sm text-slate-600">
            Próximamente: Ver órdenes relacionadas
          </p>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        workspaceId={workspace.id}
        contactId={contact.id}
        companyId={contact.companies?.id}
      />
    </div>
  )
}
