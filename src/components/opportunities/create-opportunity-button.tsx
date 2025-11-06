'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateOpportunityModal } from './create-opportunity-modal'

interface CreateOpportunityButtonProps {
  workspaceSlug: string
  workspaceId: string
  variant?: 'primary' | 'empty'
}

export function CreateOpportunityButton({ workspaceSlug, workspaceId, variant = 'primary' }: CreateOpportunityButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700'
            : 'mt-6 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700'
        }
      >
        <Plus className="h-4 w-4" />
        {variant === 'primary' ? 'Nueva Oportunidad' : 'Crear Primera Oportunidad'}
      </button>

      <CreateOpportunityModal
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
