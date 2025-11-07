import { createClient } from '@/lib/supabase/server'
import { Plus, Search } from 'lucide-react'
import { CompaniesTable } from '@/components/companies/companies-table'
import { CreateCompanyButton } from '@/components/companies/create-company-button'

interface CompaniesPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ search?: string }>
}

export default async function CompaniesPage({ params, searchParams }: CompaniesPageProps) {
  const { workspace: workspaceSlug } = await params
  const { search } = await searchParams
  const supabase = await createClient()

  // Get workspace
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) {
    return <div>Workspace not found</div>
  }

  // Get companies with contact count
  let query = supabase
    .from('companies')
    .select(`
      *,
      contacts(count)
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,website.ilike.%${search}%`)
  }

  const { data: companies, error } = await query

  if (error) {
    console.error('Error fetching companies:', error)
    return <div>Error loading companies</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Empresas</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona empresas y organizaciones
          </p>
        </div>
        <CreateCompanyButton
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
          variant="primary"
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form action="" className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Buscar por nombre o sitio web..."
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Companies List */}
      <div className="rounded-lg bg-white shadow">
        {companies && companies.length > 0 ? (
          <CompaniesTable companies={companies} workspaceSlug={workspaceSlug} />
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              No hay empresas
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {search
                ? 'No se encontraron empresas con ese criterio de búsqueda.'
                : 'Comienza agregando tu primera empresa.'}
            </p>
            {!search && (
              <CreateCompanyButton
                workspaceSlug={workspaceSlug}
                workspaceId={workspace.id}
                variant="empty"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
