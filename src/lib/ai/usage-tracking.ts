/**
 * AI Usage Tracking Utilities
 * Tracks and manages AI usage with soft monthly limits
 */

import { createClient } from '@/lib/supabase/server'

export interface UsageStats {
  totalMessages: number
  totalTokens: number
  totalCost: number
  filesProcessed: number
  messageLimit: number
  tokenLimit: number
  warningShown: boolean
  percentUsed: number
  isOverLimit: boolean
}

export interface UsageUpdate {
  tokens: number
  cost: number
  filesProcessed?: number
}

export class UsageTracker {
  /**
   * Get current month's usage for a user
   */
  async getCurrentUsage(userId: string, workspaceId: string): Promise<UsageStats | null> {
    const supabase = await createClient()
    const month = this.getCurrentMonth()

    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('month', month)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching usage:', error)
      return null
    }

    if (!data) {
      // No usage record yet, return default
      return {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        filesProcessed: 0,
        messageLimit: 1000,
        tokenLimit: 1000000,
        warningShown: false,
        percentUsed: 0,
        isOverLimit: false
      }
    }

    const percentUsed = (data.total_messages / data.message_limit) * 100

    return {
      totalMessages: data.total_messages,
      totalTokens: data.total_tokens,
      totalCost: parseFloat(data.total_cost),
      filesProcessed: data.files_processed,
      messageLimit: data.message_limit,
      tokenLimit: data.token_limit,
      warningShown: data.warning_shown,
      percentUsed,
      isOverLimit: data.total_messages >= data.message_limit
    }
  }

  /**
   * Update usage after an AI interaction
   */
  async updateUsage(
    userId: string,
    workspaceId: string,
    update: UsageUpdate
  ): Promise<boolean> {
    const supabase = await createClient()
    const month = this.getCurrentMonth()

    try {
      // Use the database function for atomic updates
      const { error } = await supabase.rpc('track_ai_usage', {
        p_user_id: userId,
        p_workspace_id: workspaceId,
        p_tokens: update.tokens,
        p_cost: update.cost
      })

      if (error) {
        console.error('Error tracking usage:', error)
        return false
      }

      // If files were processed, update that separately
      if (update.filesProcessed && update.filesProcessed > 0) {
        await supabase
          .from('ai_usage_tracking')
          .update({
            files_processed: supabase.rpc('increment', { x: update.filesProcessed })
          })
          .eq('user_id', userId)
          .eq('workspace_id', workspaceId)
          .eq('month', month)
      }

      return true
    } catch (error) {
      console.error('Error updating usage:', error)
      return false
    }
  }

  /**
   * Check if user is approaching or over limit (soft limit)
   */
  async checkUsageLimit(
    userId: string,
    workspaceId: string
  ): Promise<{
    canContinue: boolean
    warning?: string
    usage: UsageStats | null
  }> {
    const usage = await this.getCurrentUsage(userId, workspaceId)

    if (!usage) {
      return { canContinue: true, usage: null }
    }

    // Soft limit - show warning but allow continue
    if (usage.percentUsed >= 100 && !usage.warningShown) {
      // Mark warning as shown
      await this.markWarningShown(userId, workspaceId)

      return {
        canContinue: true,
        warning: `Has alcanzado tu límite mensual de ${usage.messageLimit} mensajes. Puedes continuar usando el servicio, pero considera los costos adicionales.`,
        usage
      }
    }

    if (usage.percentUsed >= 80 && usage.percentUsed < 100) {
      return {
        canContinue: true,
        warning: `Has usado ${Math.round(usage.percentUsed)}% de tu límite mensual (${usage.totalMessages}/${usage.messageLimit} mensajes).`,
        usage
      }
    }

    return { canContinue: true, usage }
  }

  /**
   * Mark warning as shown for current month
   */
  private async markWarningShown(userId: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()
    const month = this.getCurrentMonth()

    await supabase
      .from('ai_usage_tracking')
      .update({ warning_shown: true })
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('month', month)
  }

  /**
   * Get usage history for multiple months
   */
  async getUsageHistory(
    userId: string,
    workspaceId: string,
    months: number = 6
  ): Promise<UsageStats[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .order('month', { ascending: false })
      .limit(months)

    if (error) {
      console.error('Error fetching usage history:', error)
      return []
    }

    return (data || []).map(d => ({
      totalMessages: d.total_messages,
      totalTokens: d.total_tokens,
      totalCost: parseFloat(d.total_cost),
      filesProcessed: d.files_processed,
      messageLimit: d.message_limit,
      tokenLimit: d.token_limit,
      warningShown: d.warning_shown,
      percentUsed: (d.total_messages / d.message_limit) * 100,
      isOverLimit: d.total_messages >= d.message_limit
    }))
  }

  /**
   * Reset warning flag for new month (called automatically)
   */
  async resetMonthlyWarning(userId: string, workspaceId: string): Promise<void> {
    const supabase = await createClient()
    const month = this.getCurrentMonth()

    await supabase
      .from('ai_usage_tracking')
      .update({ warning_shown: false })
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .eq('month', month)
  }

  /**
   * Get current month in YYYY-MM format
   */
  private getCurrentMonth(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }

  /**
   * Calculate cost based on model and tokens
   * Prices from OpenRouter (approximate, should be updated regularly)
   */
  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    // Prices per 1M tokens (from OpenRouter)
    const prices: Record<string, { input: number; output: number }> = {
      'x-ai/grok-2-vision-1212': { input: 2.00, output: 10.00 }, // Grok 4 Fast with vision
      'deepseek/deepseek-r1': { input: 0.55, output: 2.19 },
      'deepseek/deepseek-chat': { input: 0.14, output: 0.28 },
      'qwen/qwen-2.5-vl-32b-instruct': { input: 0.40, output: 0.40 },
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    }

    const modelPrices = prices[model] || { input: 0.50, output: 1.50 } // Default fallback

    const inputCost = (inputTokens / 1000000) * modelPrices.input
    const outputCost = (outputTokens / 1000000) * modelPrices.output

    return inputCost + outputCost
  }
}

// Export singleton instance
export const usageTracker = new UsageTracker()

// Helper to format cost
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`
  }
  return `$${cost.toFixed(4)}`
}

// Helper to format large numbers
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toString()
}
