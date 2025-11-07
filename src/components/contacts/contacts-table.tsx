'use client'

import Link from 'next/link'
import { Mail, Phone, Building2, MoreVertical } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  tags: string[]
  created_at: string
  companies?: {
    id: string
    name: string
  } | null
}

interface ContactsTableProps {
  contacts: Contact[]
  workspaceSlug: string
}

export function ContactsTable({ contacts, workspaceSlug }: ContactsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Empresa
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Tags
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4">
                <Link
                  href={`/${workspaceSlug}/contacts/${contact.id}`}
                  className="font-medium text-slate-900 hover:text-slate-600"
                >
                  {contact.name}
                </Link>
              </td>
              <td className="px-6 py-4">
                {contact.companies ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="h-4 w-4" />
                    <span>{contact.companies.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="space-y-1">
                  {contact.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:text-slate-600"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4" />
                      <a
                        href={`tel:${contact.phone}`}
                        className="hover:text-slate-600"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}
                  {!contact.email && !contact.phone && (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {contact.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-right">
                <button className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
