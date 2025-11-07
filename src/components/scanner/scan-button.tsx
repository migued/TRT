'use client'

import { useState } from 'react'
import { Scan } from 'lucide-react'
import { SmartScannerModal } from './smart-scanner-modal'

interface ScanButtonProps {
  type: 'business-card' | 'receipt'
  workspaceId: string
  workspaceSlug: string
  label?: string
  variant?: 'default' | 'outline'
}

export function ScanButton({
  type,
  workspaceId,
  workspaceSlug,
  label,
  variant = 'default'
}: ScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const defaultLabel = type === 'business-card' ? 'Escanear Tarjeta' : 'Escanear Recibo'

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          variant === 'outline'
            ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            : 'bg-slate-900 text-white hover:bg-slate-800'
        }`}
      >
        <Scan className="h-4 w-4" />
        {label || defaultLabel}
      </button>

      <SmartScannerModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        type={type}
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
      />
    </>
  )
}
