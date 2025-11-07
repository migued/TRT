import Link from 'next/link'
import { Webhook, Users, Settings as SettingsIcon, Mail, Bot } from 'lucide-react'

interface SettingsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params

  const settingsSections = [
    {
      title: 'Chat con IA',
      description: 'Ver uso de mensajes y límites mensuales del asistente de IA',
      icon: Bot,
      href: `/${workspaceSlug}/settings/chat-con-ia`,
      available: true,
    },
    {
      title: 'Webhooks',
      description: 'Connect external services and automate workflows',
      icon: Webhook,
      href: `/${workspaceSlug}/settings/webhooks`,
      available: true,
    },
    {
      title: 'Team',
      description: 'Manage team members and permissions',
      icon: Users,
      href: `/${workspaceSlug}/settings/team`,
      available: false,
    },
    {
      title: 'Workspace',
      description: 'Configure workspace settings and preferences',
      icon: SettingsIcon,
      href: `/${workspaceSlug}/settings/workspace`,
      available: false,
    },
    {
      title: 'Email',
      description: 'Email templates and sending configuration',
      icon: Mail,
      href: `/${workspaceSlug}/settings/email`,
      available: false,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-600">
          Administra la configuración de tu workspace
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon

          if (section.available) {
            return (
              <Link
                key={section.href}
                href={section.href}
                className="block bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-slate-100 rounded-lg">
                    <Icon className="h-6 w-6 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </Link>
            )
          }

          return (
            <div
              key={section.href}
              className="bg-white rounded-lg border border-slate-200 p-6 opacity-60"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Icon className="h-6 w-6 text-slate-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{section.description}</p>
                  <p className="text-xs text-slate-500 mt-2">Próximamente</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
