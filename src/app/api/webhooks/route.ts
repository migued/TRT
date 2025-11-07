import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'edge'

// GET /api/webhooks - List all webhooks for a workspace
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id is required' },
        { status: 400 }
      )
    }

    const { data: webhooks, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ webhooks })
  } catch (error: any) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/webhooks - Create a new webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      workspace_id,
      name,
      type,
      target_url,
      events,
      allowed_events,
      description,
      headers,
    } = body

    if (!workspace_id || !name || !type) {
      return NextResponse.json(
        { error: 'workspace_id, name, and type are required' },
        { status: 400 }
      )
    }

    if (type === 'outgoing' && !target_url) {
      return NextResponse.json(
        { error: 'target_url is required for outgoing webhooks' },
        { status: 400 }
      )
    }

    // Generate webhook key for incoming webhooks
    const webhookKey = type === 'incoming' ? generateWebhookKey() : null

    // Generate secret for signature validation
    const secret = generateSecret()

    const webhookData: any = {
      workspace_id,
      name,
      type,
      description,
      secret,
    }

    if (type === 'incoming') {
      webhookData.webhook_key = webhookKey
      webhookData.allowed_events = allowed_events || ['contact', 'company', 'opportunity']
    }

    if (type === 'outgoing') {
      webhookData.target_url = target_url
      webhookData.events = events || []
      webhookData.headers = headers || {}
    }

    const { data: webhook, error } = await supabase
      .from('webhooks')
      .insert(webhookData)
      .select()
      .single()

    if (error) throw error

    // Generate the full webhook URL for incoming webhooks
    if (type === 'incoming') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      webhook.webhook_url = `${baseUrl}/api/webhooks/incoming/${webhook.webhook_key}`
    }

    return NextResponse.json({ webhook })
  } catch (error: any) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook', message: error.message },
      { status: 500 }
    )
  }
}

function generateWebhookKey(): string {
  return 'whk_' + crypto.randomBytes(32).toString('hex')
}

function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}
