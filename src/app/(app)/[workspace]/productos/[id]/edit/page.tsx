import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProductForm } from '@/components/products/edit-product-form'

interface EditProductPageProps {
  params: {
    workspace: string
    id: string
  }
}

export default async function EditProductPage({ params }: EditProductPageProps) {
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
    .select('id')
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

  return <EditProductForm product={product} workspaceSlug={workspaceSlug} />
}
