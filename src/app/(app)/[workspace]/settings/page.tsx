interface SettingsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace: workspaceSlug } = await params

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-600">
          Administra la configuración de tu workspace
        </p>
      </div>

      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-slate-900">Próximamente</h3>
        <p className="mt-2 text-sm text-slate-600">
          Configuración del workspace, equipo, integraciones y más
        </p>
      </div>
    </div>
  )
}
