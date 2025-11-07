'use client'

import { useState } from 'react'
import { Mail } from 'lucide-react'
import { EmailComposer } from './email-composer'

interface SendEmailButtonProps {
  workspaceId: string
  contactId?: string
  quoteId?: string
  orderId?: string
  contactEmail?: string
  defaultSubject?: string
  defaultBody?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}

export function SendEmailButton({
  workspaceId,
  contactId,
  quoteId,
  orderId,
  contactEmail,
  defaultSubject,
  defaultBody,
  variant = 'secondary',
  size = 'md'
}: SendEmailButtonProps) {
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  }

  const variantClasses = variant === 'primary'
    ? 'bg-slate-100 text-white hover:bg-slate-100'
    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'

  return (
    <>
      <button
        onClick={() => setIsComposerOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg transition-colors font-medium ${sizeClasses[size]} ${variantClasses}`}
      >
        <Mail className="h-4 w-4" />
        Enviar Email
      </button>

      <EmailComposer
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        workspaceId={workspaceId}
        contactId={contactId}
        quoteId={quoteId}
        orderId={orderId}
        defaultTo={contactEmail}
        defaultSubject={defaultSubject}
        defaultBody={defaultBody}
      />
    </>
  )
}
