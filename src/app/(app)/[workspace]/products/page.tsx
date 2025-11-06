import { Plus } from 'lucide-react'
import Link from 'next/link'

interface ProductsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { workspace: workspaceSlug } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Productos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Catálogo de productos y servicios
          </p>
        </div>
        <Link
          href={`/${workspaceSlug}/products/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Link>
      </div>

      <div className="rounded-lg bg-white p-12 text-center shadow">
        <h3 className="text-lg font-medium text-slate-900">Próximamente</h3>
        <p className="mt-2 text-sm text-slate-600">
          Catálogo de productos y servicios
        </p>
      </div>
    </div>
  )
}
