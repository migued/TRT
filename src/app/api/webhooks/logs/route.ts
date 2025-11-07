import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// GET /api/webhooks/logs - Get webhook logs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const webhookId = searchParams.get('webhook_id')
    const workspaceId = searchParams.get('workspace_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!webhookId && !workspaceId) {
      return NextResponse.json(
        { error: 'Either webhook_id or workspace_id is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('webhook_logs')
      .select(`
        *,
        webhooks (
          id,
          name,
          type
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (webhookId) {
      query = query.eq('webhook_id', webhookId)
    } else if (workspaceId) {
      query = query.eq('workspace_id', workspaceId)
    }

    const { data: logs, error } = await query

    if (error) throw error

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs', message: error.message },
      { status: 500 }
    )
  }
}
