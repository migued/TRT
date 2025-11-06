import { createClient } from '@/lib/supabase/server'
import { Plus, Search } from 'lucide-react'
import { ProductsTable } from '@/components/products/products-table'
import { CreateProductButton } from '@/components/products/create-product-button'

interface ProductsPageProps {
  params: Promise<{ workspace: string }>
  searchParams: Promise<{ search?: string; type?: string; active?: string }>
}

export default async function ProductsPage({ params, searchParams }: ProductsPageProps) {
  const { workspace: workspaceSlug } = await params
  const { search, type, active } = await searchParams
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

  // Get products with filters
  let query = supabase
    .from('products')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  // Apply type filter
  if (type && type !== 'all') {
    query = query.eq('type', type)
  }

  // Apply active filter
  if (active === 'true') {
    query = query.eq('active', true)
  } else if (active === 'false') {
    query = query.eq('active', false)
  }

  const { data: products, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return <div>Error loading products</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catálogo de productos y servicios
          </p>
        </div>
        <CreateProductButton
          workspaceSlug={workspaceSlug}
          workspaceId={workspace.id}
          variant="primary"
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg bg-white p-4 shadow">
        <form action="" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  name="search"
                  defaultValue={search}
                  placeholder="Buscar por nombre, descripción o SKU..."
                  className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Buscar
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              name="type"
              defaultValue={type || 'all'}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              <option value="all">Todos los tipos</option>
              <option value="physical">Producto Físico</option>
              <option value="digital">Producto Digital</option>
              <option value="service">Servicio</option>
            </select>

            <select
              name="active"
              defaultValue={active || 'all'}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              onChange={(e) => e.currentTarget.form?.requestSubmit()}
            >
              <option value="all">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
        </form>
      </div>

      {/* Products List */}
      <div className="rounded-lg bg-white shadow">
        {products && products.length > 0 ? (
          <ProductsTable products={products} workspaceSlug={workspaceSlug} />
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Plus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-slate-900">
              No hay productos
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {search || type !== 'all' || active !== 'all'
                ? 'No se encontraron productos con ese criterio de búsqueda.'
                : 'Comienza agregando tu primer producto o servicio.'}
            </p>
            {!search && type === 'all' && active === 'all' && (
              <CreateProductButton
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
