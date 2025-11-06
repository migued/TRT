import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { StreamingTextResponse } from 'ai'

export const runtime = 'edge'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()
    const supabase = await createClient()

    // Get current user and workspace
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Build system prompt with CRM context
    let systemPrompt = `You are an AI sales assistant for a CRM platform. You help sales teams with:
- Writing professional emails and messages
- Analyzing customer data and suggesting next steps
- Drafting quotes and proposals
- Summarizing customer interactions
- Recommending products based on customer needs
- Providing insights from the CRM data

Be concise, professional, and actionable. When suggesting actions, be specific.

Current context:`

    // Add workspace context if provided
    if (context?.workspaceId) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('name')
        .eq('id', context.workspaceId)
        .single()

      if (workspace) {
        systemPrompt += `\nWorkspace: ${workspace.name}`
      }
    }

    // Add contact context if provided
    if (context?.contactId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select(`
          name,
          email,
          phone,
          position,
          companies (name),
          opportunities (title, amount, stage, created_at),
          quotes (quote_number, status, total, created_at),
          orders (order_number, status, total, created_at)
        `)
        .eq('id', context.contactId)
        .single()

      if (contact) {
        systemPrompt += `\n\nContact Information:
- Name: ${contact.name}
- Email: ${contact.email || 'N/A'}
- Company: ${contact.companies?.name || 'N/A'}
- Position: ${contact.position || 'N/A'}`

        if (contact.opportunities && contact.opportunities.length > 0) {
          systemPrompt += `\n\nRecent Opportunities:\n${contact.opportunities.slice(0, 3).map((o: any) =>
            `- ${o.title} (${o.stage}) - $${o.amount || 0}`
          ).join('\n')}`
        }

        if (contact.quotes && contact.quotes.length > 0) {
          systemPrompt += `\n\nRecent Quotes:\n${contact.quotes.slice(0, 3).map((q: any) =>
            `- ${q.quote_number} (${q.status}) - $${q.total || 0}`
          ).join('\n')}`
        }

        if (contact.orders && contact.orders.length > 0) {
          systemPrompt += `\n\nRecent Orders:\n${contact.orders.slice(0, 3).map((o: any) =>
            `- ${o.order_number} (${o.status}) - $${o.total || 0}`
          ).join('\n')}`
        }
      }
    }

    // Add opportunity context if provided
    if (context?.opportunityId) {
      const { data: opportunity } = await supabase
        .from('opportunities')
        .select(`
          title,
          amount,
          stage,
          probability,
          notes,
          contacts (name, email, companies (name))
        `)
        .eq('id', context.opportunityId)
        .single()

      if (opportunity) {
        systemPrompt += `\n\nCurrent Opportunity:
- Title: ${opportunity.title}
- Amount: $${opportunity.amount || 0}
- Stage: ${opportunity.stage}
- Probability: ${opportunity.probability}%
- Contact: ${opportunity.contacts?.name} at ${opportunity.contacts?.companies?.name || 'Unknown'}
${opportunity.notes ? `- Notes: ${opportunity.notes}` : ''}`
      }
    }

    // Add quote context if provided
    if (context?.quoteId) {
      const { data: quote } = await supabase
        .from('quotes')
        .select(`
          quote_number,
          status,
          total,
          items,
          notes,
          terms,
          contacts (name, email)
        `)
        .eq('id', context.quoteId)
        .single()

      if (quote) {
        systemPrompt += `\n\nCurrent Quote:
- Number: ${quote.quote_number}
- Status: ${quote.status}
- Total: $${quote.total || 0}
- Contact: ${quote.contacts?.name}
- Items: ${Array.isArray(quote.items) ? quote.items.length : 0} items`
      }
    }

    // Add order context if provided
    if (context?.orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select(`
          order_number,
          status,
          total,
          items,
          notes,
          contacts (name, email, companies (name)),
          quotes (quote_number)
        `)
        .eq('id', context.orderId)
        .single()

      if (order) {
        systemPrompt += `\n\nCurrent Order:
- Number: ${order.order_number}
- Status: ${order.status}
- Total: $${order.total || 0}
- Contact: ${order.contacts?.name} at ${order.contacts?.companies?.name || 'N/A'}
- Items: ${Array.isArray(order.items) ? order.items.length : 0} items
${order.quotes ? `- From Quote: ${order.quotes.quote_number}` : ''}`
      }
    }

    // Add project context if provided
    if (context?.projectId) {
      const { data: project } = await supabase
        .from('projects')
        .select(`
          title,
          description,
          status,
          stage,
          start_date,
          due_date,
          contacts (name, companies (name)),
          orders (order_number, total)
        `)
        .eq('id', context.projectId)
        .single()

      if (project) {
        systemPrompt += `\n\nCurrent Project:
- Title: ${project.title}
- Status: ${project.status}
- Stage: ${project.stage}
- Start: ${project.start_date || 'N/A'}
- Due: ${project.due_date || 'N/A'}
- Contact: ${project.contacts?.name} at ${project.contacts?.companies?.name || 'N/A'}
${project.description ? `- Description: ${project.description}` : ''}
${project.orders ? `- Order Value: $${project.orders.total}` : ''}`

        // Get project tasks
        const { data: tasks } = await supabase
          .from('tasks')
          .select('title, status, priority, due_date')
          .eq('project_id', context.projectId)
          .order('created_at', { ascending: false })
          .limit(10)

        if (tasks && tasks.length > 0) {
          const pendingTasks = tasks.filter(t => t.status === 'pending')
          const completedTasks = tasks.filter(t => t.status === 'completed')
          systemPrompt += `\n\nProject Tasks:
- Total: ${tasks.length} (${completedTasks.length} completed, ${pendingTasks.length} pending)
Recent Tasks:\n${tasks.slice(0, 5).map(t =>
  `  - [${t.status === 'completed' ? '✓' : ' '}] ${t.title} (${t.priority})`
).join('\n')}`
        }
      }
    }

    // Add company context if provided
    if (context?.companyId) {
      const { data: company } = await supabase
        .from('companies')
        .select(`
          name,
          industry,
          website,
          notes
        `)
        .eq('id', context.companyId)
        .single()

      if (company) {
        systemPrompt += `\n\nCurrent Company:
- Name: ${company.name}
- Industry: ${company.industry || 'N/A'}
- Website: ${company.website || 'N/A'}`

        // Get contacts from this company
        const { data: contacts } = await supabase
          .from('contacts')
          .select('name, position, email')
          .eq('company_id', context.companyId)
          .limit(5)

        if (contacts && contacts.length > 0) {
          systemPrompt += `\n\nContacts at ${company.name}:\n${contacts.map(c =>
            `- ${c.name} (${c.position || 'Unknown position'})`
          ).join('\n')}`
        }

        // Get opportunities with this company
        const { data: opportunities } = await supabase
          .from('opportunities')
          .select('title, amount, stage, contacts!inner(company_id)')
          .eq('contacts.company_id', context.companyId)
          .order('created_at', { ascending: false })
          .limit(5)

        if (opportunities && opportunities.length > 0) {
          const totalValue = opportunities.reduce((sum, o) => sum + (o.amount || 0), 0)
          systemPrompt += `\n\nOpportunities with ${company.name}:
- Total Pipeline Value: $${totalValue}
- Opportunities:\n${opportunities.map(o =>
  `  - ${o.title} (${o.stage}) - $${o.amount || 0}`
).join('\n')}`
        }
      }
    }

    // Add products catalog context (always available for product recommendations)
    if (context?.workspaceId) {
      const { data: products } = await supabase
        .from('products')
        .select('name, description, price, category')
        .eq('workspace_id', context.workspaceId)
        .order('name', { ascending: true })
        .limit(20)

      if (products && products.length > 0) {
        systemPrompt += `\n\nAvailable Products/Services (${products.length}):\n${products.map(p =>
          `- ${p.name}: ${p.description || 'No description'} - $${p.price}${p.category ? ` (${p.category})` : ''}`
        ).join('\n')}`
      }
    }

    // Add workspace-wide insights for analytics
    if (context?.includeAnalytics && context?.workspaceId) {
      // Get top opportunities
      const { data: topOpportunities } = await supabase
        .from('opportunities')
        .select('title, amount, stage, probability')
        .eq('workspace_id', context.workspaceId)
        .order('amount', { ascending: false })
        .limit(5)

      if (topOpportunities && topOpportunities.length > 0) {
        const totalPipeline = topOpportunities.reduce((sum, o) => sum + (o.amount || 0), 0)
        systemPrompt += `\n\nTop Opportunities in Pipeline:
- Total Value: $${totalPipeline}
${topOpportunities.map(o =>
  `- ${o.title}: $${o.amount || 0} (${o.stage}, ${o.probability}% probability)`
).join('\n')}`
      }

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('type, amount, description, transaction_date')
        .eq('workspace_id', context.workspaceId)
        .order('transaction_date', { ascending: false })
        .limit(10)

      if (transactions && transactions.length > 0) {
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        systemPrompt += `\n\nRecent Financial Activity:
- Recent Income: $${income}
- Recent Expenses: $${expenses}
- Net: $${income - expenses}
Recent Transactions:\n${transactions.slice(0, 5).map(t =>
  `- ${t.type === 'income' ? '+' : '-'}$${t.amount}: ${t.description}`
).join('\n')}`
      }
    }

    // Call Claude API with streaming
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      system: systemPrompt,
    })

    // Convert Anthropic stream to standard format
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              controller.enqueue(encoder.encode(text))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('AI chat error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
