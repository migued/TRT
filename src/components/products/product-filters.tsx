'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProductFiltersProps {
  workspaceSlug: string
}

export function ProductFilters({ workspaceSlug }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get('search')
    const type = formData.get('type')
    const active = formData.get('active')

    const params = new URLSearchParams()
    if (search) params.set('search', search.toString())
    if (type && type !== 'all') params.set('type', type.toString())
    if (active && active !== 'all') params.set('active', active.toString())

    router.push(`/${workspaceSlug}/products?${params.toString()}`)
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const form = e.currentTarget.form
    if (form) {
      form.requestSubmit()
    }
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                name="search"
                defaultValue={searchParams.get('search') || ''}
                placeholder="Buscar por nombre, descripción o SKU..."
                className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2 focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Buscar
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            name="type"
            defaultValue={searchParams.get('type') || 'all'}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            onChange={handleFilterChange}
          >
            <option value="all">Todos los tipos</option>
            <option value="physical">Producto Físico</option>
            <option value="digital">Producto Digital</option>
            <option value="service">Servicio</option>
          </select>

          <select
            name="active"
            defaultValue={searchParams.get('active') || 'all'}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            onChange={handleFilterChange}
          >
            <option value="all">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </form>
    </div>
  )
}
