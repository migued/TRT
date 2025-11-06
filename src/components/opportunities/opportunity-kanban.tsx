'use client'

import { useState } from 'react'
import { OpportunityCard } from './opportunity-card'
import { createClient } from '@/lib/supabase/client'

interface Stage {
  id: string
  name: string
  color: string | null
  order_index: number
  stage_type: 'active' | 'won' | 'lost'
}

interface Opportunity {
  id: string
  title: string
  amount: number | null
  currency: string
  probability: number
  stage: string
  expected_close_date: string | null
  contacts: {
    id: string
    name: string
    email: string | null
    companies: {
      id: string
      name: string
    } | null
  } | null
}

interface OpportunityKanbanProps {
  stages: Stage[]
  opportunities: Opportunity[]
  workspaceSlug: string
  workspaceId: string
}

export function OpportunityKanban({ stages, opportunities: initialOpportunities, workspaceSlug, workspaceId }: OpportunityKanbanProps) {
  const [opportunities, setOpportunities] = useState(initialOpportunities)
  const [draggedOpportunity, setDraggedOpportunity] = useState<string | null>(null)

  // Group opportunities by stage
  const opportunitiesByStage = stages.reduce((acc, stage) => {
    acc[stage.name] = opportunities.filter(opp => opp.stage === stage.name)
    return acc
  }, {} as Record<string, Opportunity[]>)

  const handleDragStart = (opportunityId: string) => {
    setDraggedOpportunity(opportunityId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault()

    if (!draggedOpportunity) return

    // Optimistic update - update UI immediately
    setOpportunities(prev =>
      prev.map(opp =>
        opp.id === draggedOpportunity
          ? { ...opp, stage: targetStage }
          : opp
      )
    )

    setDraggedOpportunity(null)

    // Persist to database in background
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('opportunities')
        .update({ stage: targetStage })
        .eq('id', draggedOpportunity)

      if (error) {
        // Revert on error - refetch from server
        console.error('Error updating opportunity stage:', error)
        setOpportunities(initialOpportunities)
      }
    } catch (error) {
      console.error('Error updating opportunity stage:', error)
      // Revert on error
      setOpportunities(initialOpportunities)
    }
  }

  const getStageColor = (stage: Stage) => {
    if (stage.stage_type === 'won') return 'bg-green-100 border-green-300'
    if (stage.stage_type === 'lost') return 'bg-red-100 border-red-300'
    return stage.color ? `bg-${stage.color}-100 border-${stage.color}-300` : 'bg-slate-100 border-slate-300'
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex gap-4 min-w-full">
        {stages.map((stage) => {
          const stageOpportunities = opportunitiesByStage[stage.name] || []
          const stageValue = stageOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0)

          return (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.name)}
            >
              {/* Stage Header */}
              <div className={`rounded-t-lg border-2 ${getStageColor(stage)} p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                  <span className="text-sm font-medium text-slate-600">
                    {stageOpportunities.length}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    minimumFractionDigits: 0
                  }).format(stageValue)}
                </p>
              </div>

              {/* Stage Column */}
              <div className="bg-slate-50 border-2 border-t-0 border-slate-200 rounded-b-lg p-4 min-h-[500px] space-y-3">
                {stageOpportunities.length > 0 ? (
                  stageOpportunities.map((opportunity) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      workspaceSlug={workspaceSlug}
                      onDragStart={handleDragStart}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-sm text-slate-400">
                    Arrastra oportunidades aquí
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
