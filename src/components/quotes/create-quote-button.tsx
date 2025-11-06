'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateQuoteModal } from './create-quote-modal'

interface CreateQuoteButtonProps {
  workspaceSlug: string
  workspaceId: string
  variant?: 'primary' | 'secondary'
  opportunityId?: string
}

export function CreateQuoteButton({
  workspaceSlug,
  workspaceId,
  variant = 'primary',
  opportunityId
}: CreateQuoteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const buttonClasses = variant === 'primary'
    ? 'inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium'
    : 'inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium'

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={buttonClasses}>
        <Plus className="h-5 w-5" />
        Nueva Cotización
      </button>

      <CreateQuoteModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        opportunityId={opportunityId}
      />
    </>
  )
}
