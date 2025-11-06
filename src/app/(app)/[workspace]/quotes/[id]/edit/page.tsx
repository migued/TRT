import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditQuoteForm } from '@/components/quotes/edit-quote-form'

interface EditQuotePageProps {
  params: Promise<{ workspace: string; id: string }>
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { workspace: workspaceSlug, id } = await params
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

  // Get quote
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
      contacts (
        id,
        name,
        email,
        phone,
        companies (
          id,
          name
        )
      )
    `)
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single()

  if (error || !quote) {
    notFound()
  }

  // Only allow editing draft quotes
  if (quote.status !== 'draft') {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          No se puede editar
        </h1>
        <p className="text-slate-600">
          Solo las cotizaciones en borrador pueden ser editadas.
        </p>
      </div>
    )
  }

  // Get all products
  const { data: products } = await supabase
    .from('products')
    .select('id, name, description, price')
    .eq('workspace_id', workspace.id)
    .order('name', { ascending: true })

  return (
    <EditQuoteForm
      quote={quote}
      products={products || []}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
    />
  )
}
