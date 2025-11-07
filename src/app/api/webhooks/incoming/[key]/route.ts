import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Use service role for webhook processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const runtime = 'edge'

interface IncomingWebhookData {
  event?: string
  data: Record<string, any>
  signature?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key: webhookKey } = await params
  const startTime = Date.now()

  try {
    // Get webhook configuration
    const { data: webhook, error: webhookError } = await supabaseAdmin
      .from('webhooks')
      .select('*')
      .eq('webhook_key', webhookKey)
      .eq('type', 'incoming')
      .eq('is_active', true)
      .single()

    if (webhookError || !webhook) {
      return NextResponse.json(
        { error: 'Webhook not found or inactive' },
        { status: 404 }
      )
    }

    // Parse request body
    const body: IncomingWebhookData = await request.json()

    // Validate signature if secret is configured
    if (webhook.secret && body.signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhook.secret)
        .update(JSON.stringify(body.data))
        .digest('hex')

      if (body.signature !== expectedSignature) {
        await logWebhook(webhook.id, webhook.workspace_id, {
          type: 'incoming',
          event: body.event || 'unknown',
          request_method: 'POST',
          request_url: request.url,
          request_body: body,
          success: false,
          error_message: 'Invalid signature',
          response_status: 401,
          response_time_ms: Date.now() - startTime,
        })

        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    // Process the incoming data based on event type
    let result: any
    const event = body.event || 'contact' // Default to contact if no event specified

    if (!webhook.allowed_events || webhook.allowed_events.includes(event)) {
      result = await processIncomingData(webhook.workspace_id, event, body.data)
    } else {
      throw new Error(`Event type '${event}' not allowed for this webhook`)
    }

    // Log successful webhook
    await logWebhook(webhook.id, webhook.workspace_id, {
      type: 'incoming',
      event,
      request_method: 'POST',
      request_url: request.url,
      request_body: body,
      response_status: 200,
      response_body: result,
      success: true,
      response_time_ms: Date.now() - startTime,
    })

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      data: result,
    })
  } catch (error: any) {
    console.error('Webhook processing error:', error)

    // Log failed webhook
    try {
      const { data: webhook } = await supabaseAdmin
        .from('webhooks')
        .select('id, workspace_id')
        .eq('webhook_key', webhookKey)
        .single()

      if (webhook) {
        await logWebhook(webhook.id, webhook.workspace_id, {
          type: 'incoming',
          event: 'error',
          request_method: 'POST',
          request_url: request.url,
          success: false,
          error_message: error.message,
          response_status: 500,
          response_time_ms: Date.now() - startTime,
        })
      }
    } catch (logError) {
      console.error('Failed to log webhook error:', logError)
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    )
  }
}

async function processIncomingData(
  workspaceId: string,
  event: string,
  data: Record<string, any>
) {
  switch (event) {
    case 'contact':
    case 'lead':
      return await createContact(workspaceId, data)

    case 'company':
      return await createCompany(workspaceId, data)

    case 'opportunity':
      return await createOpportunity(workspaceId, data)

    default:
      throw new Error(`Unknown event type: ${event}`)
  }
}

async function createContact(workspaceId: string, data: Record<string, any>) {
  // Check if company exists or create it
  let companyId = data.company_id

  if (!companyId && data.company_name) {
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('name', data.company_name)
      .single()

    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      const { data: newCompany, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({
          workspace_id: workspaceId,
          name: data.company_name,
          website: data.company_website,
          industry: data.company_industry,
        })
        .select('id')
        .single()

      if (companyError) throw companyError
      companyId = newCompany.id
    }
  }

  // Create or update contact
  const contactData: any = {
    workspace_id: workspaceId,
    name: data.name || data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
    email: data.email,
    phone: data.phone || data.phone_number,
    position: data.position || data.job_title,
    company_id: companyId,
    notes: data.notes || data.message,
    tags: data.tags || [],
  }

  // Check for existing contact by email
  if (data.email) {
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', data.email)
      .single()

    if (existingContact) {
      // Update existing contact
      const { data: updatedContact, error } = await supabaseAdmin
        .from('contacts')
        .update(contactData)
        .eq('id', existingContact.id)
        .select()
        .single()

      if (error) throw error
      return { contact: updatedContact, action: 'updated' }
    }
  }

  // Create new contact
  const { data: newContact, error } = await supabaseAdmin
    .from('contacts')
    .insert(contactData)
    .select()
    .single()

  if (error) throw error
  return { contact: newContact, action: 'created' }
}

async function createCompany(workspaceId: string, data: Record<string, any>) {
  const companyData: any = {
    workspace_id: workspaceId,
    name: data.name || data.company_name,
    website: data.website,
    industry: data.industry,
    address: data.address,
    tax_id: data.tax_id || data.rfc,
    notes: data.notes,
  }

  // Check for existing company by name
  const { data: existingCompany } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('name', companyData.name)
    .single()

  if (existingCompany) {
    // Update existing company
    const { data: updatedCompany, error } = await supabaseAdmin
      .from('companies')
      .update(companyData)
      .eq('id', existingCompany.id)
      .select()
      .single()

    if (error) throw error
    return { company: updatedCompany, action: 'updated' }
  }

  // Create new company
  const { data: newCompany, error } = await supabaseAdmin
    .from('companies')
    .insert(companyData)
    .select()
    .single()

  if (error) throw error
  return { company: newCompany, action: 'created' }
}

async function createOpportunity(workspaceId: string, data: Record<string, any>) {
  // Find or create contact
  let contactId = data.contact_id

  if (!contactId && data.contact_email) {
    const { data: existingContact } = await supabaseAdmin
      .from('contacts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', data.contact_email)
      .single()

    if (existingContact) {
      contactId = existingContact.id
    } else if (data.contact_name || data.contact_email) {
      const { data: newContact, error: contactError } = await supabaseAdmin
        .from('contacts')
        .insert({
          workspace_id: workspaceId,
          name: data.contact_name || data.contact_email,
          email: data.contact_email,
        })
        .select('id')
        .single()

      if (contactError) throw contactError
      contactId = newContact.id
    }
  }

  if (!contactId) {
    throw new Error('Contact is required for opportunity')
  }

  const opportunityData: any = {
    workspace_id: workspaceId,
    contact_id: contactId,
    title: data.title || data.opportunity_name,
    amount: data.amount || data.value,
    stage: data.stage || 'lead',
    probability: data.probability || 0,
    expected_close_date: data.expected_close_date || data.close_date,
    description: data.description || data.notes,
  }

  const { data: newOpportunity, error } = await supabaseAdmin
    .from('opportunities')
    .insert(opportunityData)
    .select()
    .single()

  if (error) throw error
  return { opportunity: newOpportunity, action: 'created' }
}

async function logWebhook(
  webhookId: string,
  workspaceId: string,
  logData: {
    type: string
    event: string
    request_method: string
    request_url: string
    request_body?: any
    request_headers?: any
    response_status: number
    response_body?: any
    success: boolean
    error_message?: string
    response_time_ms: number
  }
) {
  await supabaseAdmin.from('webhook_logs').insert({
    webhook_id: webhookId,
    workspace_id: workspaceId,
    ...logData,
  })
}
