import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { usageTracker } from '@/lib/ai/usage-tracking'

export const runtime = 'edge'

/**
 * GET /api/ai-chat/usage
 * Get current usage statistics for the user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '6')

    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get current month usage
    const currentUsage = await usageTracker.getCurrentUsage(user.id, profile.workspace_id)

    // Get usage history
    const history = await usageTracker.getUsageHistory(user.id, profile.workspace_id, months)

    return NextResponse.json({
      current: currentUsage,
      history
    })
  } catch (error: any) {
    console.error('Error in GET /api/ai-chat/usage:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
