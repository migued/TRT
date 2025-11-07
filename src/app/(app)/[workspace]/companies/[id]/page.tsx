import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Building2, Globe, Users, FileText, Edit, Mail, Phone, Calendar, MapPin, Linkedin, Facebook, Instagram, Twitter } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DeleteCompanyButton } from '@/components/companies/delete-company-button'
import { AIAssistant } from '@/components/ai/ai-assistant'

interface CompanyPageProps {
  params: {
    workspace: string
    id: string
  }
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { workspace: workspaceSlug, id: companyId } = params
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    notFound()
  }

  // Get company with related data
  const { data: company, error } = await supabase
    .from('companies')
    .select(`
      *,
      contacts (
        id,
        name,
        email,
        phone,
        position
      )
    `)
    .eq('id', companyId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !company) {
    notFound()
  }

  const contacts = company.contacts || []

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

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Building2 className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              {company.address && (
                <p className="text-sm text-slate-600 mt-2">{company.address}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${workspaceSlug}/companies/${companyId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <DeleteCompanyButton
              companyId={companyId}
              companyName={company.name}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Details Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Información de la Empresa</h2>

            <div className="space-y-4">
              {company.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Sitio Web</p>
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-600"
                    >
                      {company.website}
                    </a>
                  </div>
                </div>
              )}

              {company.tax_id && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">RFC</p>
                    <p className="text-slate-900">{company.tax_id}</p>
                  </div>
                </div>
              )}

              {company.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Dirección</p>
                    <p className="text-slate-900">{company.address}</p>
                  </div>
                </div>
              )}

              {(company.linkedin_url || company.facebook_url || company.instagram_url || company.twitter_url) && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-600 mb-3">Redes Sociales</p>
                  <div className="flex flex-wrap gap-3">
                    {company.linkedin_url && (
                      <a
                        href={company.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                        <span className="text-sm">LinkedIn</span>
                      </a>
                    )}
                    {company.facebook_url && (
                      <a
                        href={company.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Facebook className="h-4 w-4" />
                        <span className="text-sm">Facebook</span>
                      </a>
                    )}
                    {company.instagram_url && (
                      <a
                        href={company.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        <span className="text-sm">Instagram</span>
                      </a>
                    )}
                    {company.twitter_url && (
                      <a
                        href={company.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <Twitter className="h-4 w-4" />
                        <span className="text-sm">Twitter</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {company.notes && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-sm font-medium text-slate-600 mb-2">Notas</p>
                  <p className="text-slate-700 whitespace-pre-wrap">{company.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Related Contacts */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contactos ({contacts.length})
              </h2>
              <Link
                href={`/${workspaceSlug}/contacts/new?company_id=${companyId}`}
                className="text-sm text-slate-600 hover:text-slate-600"
              >
                + Agregar contacto
              </Link>
            </div>

            {contacts.length > 0 ? (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/${workspaceSlug}/contacts/${contact.id}`}
                    className="block p-4 border border-slate-200 rounded-lg hover:border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">{contact.name}</p>
                        {contact.position && (
                          <p className="text-sm text-slate-600 mt-1">{contact.position}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="h-4 w-4" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <Phone className="h-4 w-4" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 mb-4">No hay contactos asociados a esta empresa</p>
                <Link
                  href={`/${workspaceSlug}/contacts/new?company_id=${companyId}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  <Users className="h-4 w-4" />
                  Agregar Primer Contacto
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Información del Sistema</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-600">Creado</p>
                  <p className="text-slate-900 font-medium">
                    {new Date(company.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {company.updated_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Última actualización</p>
                    <p className="text-slate-900 font-medium">
                      {new Date(company.updated_at).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Estadísticas</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Contactos</span>
                <span className="text-lg font-semibold text-slate-900">{contacts.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-sm">Oportunidades</span>
                <span className="text-lg font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-sm">Proyectos</span>
                <span className="text-lg font-semibold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        workspaceId={workspace.id}
        companyId={company.id}
        includeAnalytics={true}
      />
    </div>
  )
}
