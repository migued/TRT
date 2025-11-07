import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Package, Box, Zap, DollarSign, Edit, Calendar, Tag, FileText, Weight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { DeleteProductButton } from '@/components/products/delete-product-button'

interface ProductPageProps {
  params: {
    workspace: string
    id: string
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { workspace: workspaceSlug, id: productId } = params
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

  // Get product
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !product) {
    notFound()
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'physical':
        return <Package className="h-6 w-6 text-slate-600" />
      case 'digital':
        return <Box className="h-6 w-6 text-slate-600" />
      case 'service':
        return <Zap className="h-6 w-6 text-slate-600" />
      default:
        return <Package className="h-6 w-6 text-slate-600" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'physical':
        return 'Producto Físico'
      case 'digital':
        return 'Producto Digital'
      case 'service':
        return 'Servicio'
      default:
        return type
    }
  }

  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return 'Sin precio definido'

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 2
    })

    return formatter.format(price)
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href={`/${workspaceSlug}/products`}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              {getTypeIcon(product.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-slate-600">{getTypeLabel(product.type)}</span>
                {product.category && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm text-slate-600">{product.category}</span>
                  </>
                )}
                {product.sku && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm font-mono text-slate-600">{product.sku}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/${workspaceSlug}/products/${productId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Link>
            <DeleteProductButton
              productId={productId}
              productName={product.name}
              workspaceSlug={workspaceSlug}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Details Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Información del Producto</h2>

            <div className="space-y-4">
              {/* Price */}
              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Precio Base</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatPrice(product.base_price, product.currency)}
                  </p>
                </div>
              </div>

              {product.description && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Descripción</p>
                      <p className="text-slate-700 whitespace-pre-wrap">{product.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Type-specific fields */}
              {product.type === 'physical' && product.weight_kg && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <Weight className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Peso</p>
                      <p className="text-slate-900">{product.weight_kg} kg</p>
                    </div>
                  </div>
                </div>
              )}

              {product.type === 'service' && product.delivery_time_days && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Tiempo de entrega</p>
                      <p className="text-slate-900">{product.delivery_time_days} días</p>
                    </div>
                  </div>
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-start gap-3">
                    <Tag className="h-5 w-5 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Etiquetas</p>
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Uso del Producto</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-600 mt-1">En Cotizaciones</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-600 mt-1">En Órdenes</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-900">$0</p>
                <p className="text-sm text-slate-600 mt-1">Ingresos Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Estado</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-600 mb-2">Estado actual</p>
                {product.active ? (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Card */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Información del Sistema</h3>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-slate-600">Creado</p>
                  <p className="text-slate-900 font-medium">
                    {new Date(product.created_at).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {product.updated_at && (
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-slate-600">Última actualización</p>
                    <p className="text-slate-900 font-medium">
                      {new Date(product.updated_at).toLocaleDateString('es-MX', {
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
        </div>
      </div>
    </div>
  )
}
