'use client'

import Link from 'next/link'
import { Globe, Users, MoreVertical } from 'lucide-react'

interface Company {
  id: string
  name: string
  website: string | null
  industry: string | null
  created_at: string
  contacts: { count: number }[]
}

interface CompaniesTableProps {
  companies: Company[]
  workspaceSlug: string
}

export function CompaniesTable({ companies, workspaceSlug }: CompaniesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Industria
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Sitio Web
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
              Contactos
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {companies.map((company) => {
            const contactCount = company.contacts?.[0]?.count || 0

            return (
              <tr
                key={company.id}
                className="hover:bg-slate-50 transition-colors"
              >
                <td className="px-6 py-4">
                  <Link
                    href={`/${workspaceSlug}/companies/${company.id}`}
                    className="font-medium text-slate-900 hover:text-blue-600"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  {company.industry ? (
                    <span className="text-sm text-slate-600">{company.industry}</span>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {company.website ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Globe className="h-4 w-4" />
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-600"
                      >
                        {company.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="h-4 w-4" />
                    <span>{contactCount}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
