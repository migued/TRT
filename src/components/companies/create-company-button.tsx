'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateCompanyModal } from './create-company-modal'

interface CreateCompanyButtonProps {
  workspaceSlug: string
  workspaceId: string
  variant?: 'primary' | 'empty'
}

export function CreateCompanyButton({ workspaceSlug, workspaceId, variant = 'primary' }: CreateCompanyButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
            : 'mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700'
        }
      >
        <Plus className="h-4 w-4" />
        {variant === 'primary' ? 'Nueva Empresa' : 'Crear Primera Empresa'}
      </button>

      <CreateCompanyModal
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
