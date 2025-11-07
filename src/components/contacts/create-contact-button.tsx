'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateContactModal } from './create-contact-modal'

interface CreateContactButtonProps {
  workspaceSlug: string
  workspaceId: string
  variant?: 'primary' | 'empty'
}

export function CreateContactButton({ workspaceSlug, workspaceId, variant = 'primary' }: CreateContactButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
            : 'mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800'
        }
      >
        <Plus className="h-4 w-4" />
        {variant === 'primary' ? 'Nuevo Contacto' : 'Crear Primer Contacto'}
      </button>

      <CreateContactModal
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
