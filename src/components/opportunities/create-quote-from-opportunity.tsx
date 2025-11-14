'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { CreateQuoteModal } from '@/components/quotes/create-quote-modal'

interface CreateQuoteFromOpportunityProps {
  opportunityId: string
  workspaceId: string
  workspaceSlug: string
}

export function CreateQuoteFromOpportunity({
  opportunityId,
  workspaceId,
  workspaceSlug
}: CreateQuoteFromOpportunityProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
      >
        <FileText className="h-4 w-4" />
        Crear Cotización
      </button>

      <CreateQuoteModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        opportunityId={opportunityId}
        onSuccess={() => {
          setShowModal(false)
          window.location.reload()
        }}
      />
    </>
  )
}
