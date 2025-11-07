import { ScanLine } from 'lucide-react'

export default function EscanerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Escáner Inteligente</h1>
          <p className="mt-1 text-sm text-slate-600">
            Escanea documentos con IA
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
            <ScanLine className="h-8 w-8 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Funcionalidad de Escáner
          </h2>
          <p className="text-slate-600 mb-6">
            El escáner está disponible en las páginas de Contactos, Empresas y Finanzas.
            <br />
            Busca el botón de escáner en esas páginas para usar la funcionalidad.
          </p>
        </div>
      </div>
    </div>
  )
}
