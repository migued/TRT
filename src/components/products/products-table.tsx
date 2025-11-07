import Link from 'next/link'
import { Package, Box, Zap, DollarSign, MoreVertical } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  sku: string | null
  base_price: number | null
  currency: string
  type: 'physical' | 'digital' | 'service'
  active: boolean
  tags: string[]
}

interface ProductsTableProps {
  products: Product[]
  workspaceSlug: string
}

export function ProductsTable({ products, workspaceSlug }: ProductsTableProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'physical':
        return <Package className="h-4 w-4" />
      case 'digital':
        return <Box className="h-4 w-4" />
      case 'service':
        return <Zap className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'physical':
        return 'Físico'
      case 'digital':
        return 'Digital'
      case 'service':
        return 'Servicio'
      default:
        return type
    }
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Sin precio'

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 2
    })

    return formatter.format(price)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Categoría
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              SKU
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Precio
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <Link
                  href={`/${workspaceSlug}/products/${product.id}`}
                  className="block"
                >
                  <div className="font-medium text-slate-900 hover:text-slate-600">
                    {product.name}
                  </div>
                  {product.description && (
                    <div className="text-sm text-slate-500 mt-1 line-clamp-1">
                      {product.description}
                    </div>
                  )}
                </Link>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {getTypeIcon(product.type)}
                  <span>{getTypeLabel(product.type)}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                {product.category ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                    {product.category}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                {product.sku ? (
                  <span className="text-sm font-mono text-slate-600">
                    {product.sku}
                  </span>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-900">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  {formatPrice(product.base_price, product.currency)}
                </div>
              </td>
              <td className="px-6 py-4">
                {product.active ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    Inactivo
                  </span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <Link
                  href={`/${workspaceSlug}/products/${product.id}`}
                  className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
