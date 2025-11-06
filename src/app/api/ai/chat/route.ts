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
