import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-slate-200 rounded animate-pulse mb-2" />
          <div className="h-5 w-64 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-slate-200 rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
        <p className="text-sm text-slate-600 text-center">Cargando empresas...</p>
      </div>
    </div>
  )
}
