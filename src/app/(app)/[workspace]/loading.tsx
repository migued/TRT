import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600 mx-auto mb-4" />
        <p className="text-sm text-slate-600">Cargando...</p>
      </div>
    </div>
  )
}
