import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import { ProductsTable } from '@/components/products/products-table'
import { CreateProductButton } from '@/components/products/create-product-button'
import { ProductFilters } from '@/components/products/product-filters'

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
      <ProductFilters workspaceSlug={workspaceSlug} />

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
