import Link from 'next/link'
import { DollarSign, Calendar, Building2, User, TrendingUp } from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  amount: number | null
  currency: string
  probability: number
  expected_close_date: string | null
  contacts: {
    id: string
    name: string
    companies: {
      id: string
      name: string
    } | null
  } | null
}

interface OpportunityCardProps {
  opportunity: Opportunity
  workspaceSlug: string
  onDragStart: (id: string) => void
}

export function OpportunityCard({ opportunity, workspaceSlug, onDragStart }: OpportunityCardProps) {
  const formatCurrency = (amount: number | null, currency: string) => {
    if (amount === null) return 'Sin monto'

    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 0
    })

    return formatter.format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return null

    const dateObj = new Date(date)
    return new Intl.DateTimeFormat('es-MX', {
      month: 'short',
      day: 'numeric'
    }).format(dateObj)
  }

  return (
    <Link
      href={`/${workspaceSlug}/opportunities/${opportunity.id}`}
      draggable
      onDragStart={() => onDragStart(opportunity.id)}
      className="block bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-all cursor-move"
    >
      {/* Title */}
      <h4 className="font-medium text-slate-900 mb-3 line-clamp-2">
        {opportunity.title}
      </h4>

      {/* Amount */}
      <div className="flex items-center gap-2 text-sm text-slate-900 font-semibold mb-3">
        <DollarSign className="h-4 w-4 text-orange-600" />
        {formatCurrency(opportunity.amount, opportunity.currency)}
      </div>

      {/* Company & Contact */}
      <div className="space-y-2 mb-3">
        {opportunity.contacts?.companies && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{opportunity.contacts.companies.name}</span>
          </div>
        )}
        {opportunity.contacts && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="h-3 w-3" />
            <span className="truncate">{opportunity.contacts.name}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
        {opportunity.expected_close_date && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(opportunity.expected_close_date)}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          <span>{opportunity.probability}%</span>
        </div>
      </div>
    </Link>
  )
}
