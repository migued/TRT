'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CreateProductModal } from './create-product-modal'

interface CreateProductButtonProps {
  workspaceSlug: string
  workspaceId: string
  variant?: 'primary' | 'empty'
}

export function CreateProductButton({ workspaceSlug, workspaceId, variant = 'primary' }: CreateProductButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-white hover:bg-slate-100'
            : 'mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-white hover:bg-slate-100'
        }
      >
        <Plus className="h-4 w-4" />
        {variant === 'primary' ? 'Nuevo Producto' : 'Crear Primer Producto'}
      </button>

      <CreateProductModal
        workspaceSlug={workspaceSlug}
        workspaceId={workspaceId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
