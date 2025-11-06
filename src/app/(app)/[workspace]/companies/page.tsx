import { Plus } from 'lucide-react'
import Link from 'next/link'

interface CompaniesPageProps {
  params: Promise<{ workspace: string }>
}

export default async function CompaniesPage({ params }: CompaniesPageProps) {
  const { workspace: workspaceSlug } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Empresas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona empresas y organizaciones
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/companies/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Empresa
        </Link>
      </div>

      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-slate-900">Próximamente</h3>
        <p className="mt-2 text-sm text-slate-600">
          Gestión de empresas y organizaciones
        </p>
      </div>
    </div>
  )
}
