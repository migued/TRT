import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WebhookPayload {
  event: string
  workspace_id: string
  data: Record<string, any>
  timestamp: string
}

/**
 * Trigger outgoing webhooks for a specific event
 */
export async function triggerWebhooks(
  workspaceId: string,
  event: string,
  data: Record<string, any>
) {
  try {
    // Find all active outgoing webhooks for this workspace that subscribe to this event
    const { data: webhooks, error } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('type', 'outgoing')
      .eq('is_active', true)
      .contains('events', [event])

    if (error) {
      console.error('Error fetching webhooks:', error)
      return
    }

    if (!webhooks || webhooks.length === 0) {
      return
    }

    // Trigger all matching webhooks in parallel
    const promises = webhooks.map((webhook) =>
      sendWebhook(webhook, event, workspaceId, data)
    )

    await Promise.allSettled(promises)
  } catch (error) {
    console.error('Error triggering webhooks:', error)
  }
}

/**
 * Send a single webhook request
 */
async function sendWebhook(
  webhook: any,
  event: string,
  workspaceId: string,
  data: Record<string, any>
) {
  const startTime = Date.now()
  const payload: WebhookPayload = {
    event,
    workspace_id: workspaceId,
    data,
    timestamp: new Date().toISOString(),
  }

  try {
    // Generate signature
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event,
      'X-Webhook-ID': webhook.id,
      'User-Agent': 'TRT-CRM-Webhooks/1.0',
      ...webhook.headers,
    }

    // Send the request
    const response = await fetch(webhook.target_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    const responseTime = Date.now() - startTime
    const responseBody = await response.text()

    let parsedBody: any
    try {
      parsedBody = JSON.parse(responseBody)
    } catch {
      parsedBody = { raw: responseBody }
    }

    // Log the webhook call
    await supabaseAdmin.from('webhook_logs').insert({
      webhook_id: webhook.id,
      workspace_id: workspaceId,
      type: 'outgoing',
      event,
      request_method: 'POST',
      request_url: webhook.target_url,
      request_headers: headers,
      request_body: payload,
      response_status: response.status,
      response_body: parsedBody,
      response_time_ms: responseTime,
      success: response.ok,
      error_message: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
    })

    return { success: response.ok, status: response.status }
  } catch (error: any) {
    const responseTime = Date.now() - startTime

    // Log the failed webhook
    await supabaseAdmin.from('webhook_logs').insert({
      webhook_id: webhook.id,
      workspace_id: workspaceId,
      type: 'outgoing',
      event,
      request_method: 'POST',
      request_url: webhook.target_url,
      request_body: payload,
      response_time_ms: responseTime,
      success: false,
      error_message: error.message,
    })

    console.error(`Failed to send webhook ${webhook.id}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Convenience functions for common CRM events
 */

export async function triggerContactCreated(workspaceId: string, contact: any) {
  await triggerWebhooks(workspaceId, 'contact.created', contact)
}

export async function triggerContactUpdated(workspaceId: string, contact: any) {
  await triggerWebhooks(workspaceId, 'contact.updated', contact)
}

export async function triggerOpportunityCreated(workspaceId: string, opportunity: any) {
  await triggerWebhooks(workspaceId, 'opportunity.created', opportunity)
}

export async function triggerOpportunityWon(workspaceId: string, opportunity: any) {
  await triggerWebhooks(workspaceId, 'opportunity.won', opportunity)
}

export async function triggerOpportunityLost(workspaceId: string, opportunity: any) {
  await triggerWebhooks(workspaceId, 'opportunity.lost', opportunity)
}

export async function triggerOrderCreated(workspaceId: string, order: any) {
  await triggerWebhooks(workspaceId, 'order.created', order)
}

export async function triggerProjectCreated(workspaceId: string, project: any) {
  await triggerWebhooks(workspaceId, 'project.created', project)
}

export async function triggerQuoteCreated(workspaceId: string, quote: any) {
  await triggerWebhooks(workspaceId, 'quote.created', quote)
}

export async function triggerQuoteSent(workspaceId: string, quote: any) {
  await triggerWebhooks(workspaceId, 'quote.sent', quote)
}
