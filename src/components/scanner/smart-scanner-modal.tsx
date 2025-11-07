'use client'

import { useState, useRef } from 'react'
import { X, Upload, Camera, Loader2, Check, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ScannedData {
  id: string
  imageUrl: string
  type: 'business-card' | 'receipt'
  data: any
  confidence: number
  edited?: boolean
}

interface SmartScannerModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'business-card' | 'receipt'
  workspaceId: string
  workspaceSlug: string
}

export function SmartScannerModal({
  isOpen,
  onClose,
  type,
  workspaceId,
  workspaceSlug
}: SmartScannerModalProps) {
  const router = useRouter()
  const [images, setImages] = useState<File[]>([])
  const [scannedData, setScannedData] = useState<ScannedData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setImages(files)
    setError(null)

    // Start scanning all images
    await scanImages(files)
  }

  const scanImages = async (files: File[]) => {
    setIsScanning(true)
    const scanned: ScannedData[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i]
        const imageUrl = URL.createObjectURL(file)

        // Convert to base64
        const base64 = await fileToBase64(file)

        // Call scanner API
        const response = await fetch('/api/scanner/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            type,
          }),
        })

        if (!response.ok) {
          throw new Error('Scan failed')
        }

        const result = await response.json()

        scanned.push({
          id: `${Date.now()}-${i}`,
          imageUrl,
          type,
          data: result.data,
          confidence: result.confidence,
        })

      } catch (error) {
        console.error('Error scanning image:', error)
        setError(`Error escaneando imagen ${i + 1}`)
      }
    }

    setScannedData(scanned)
    setIsScanning(false)
    setCurrentIndex(0)
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  const updateField = (field: string, value: any) => {
    setScannedData(prev => {
      const updated = [...prev]
      updated[currentIndex] = {
        ...updated[currentIndex],
        data: {
          ...updated[currentIndex].data,
          [field]: value,
        },
        edited: true,
      }
      return updated
    })
  }

  const handleCreateAll = async () => {
    setIsCreating(true)
    setError(null)

    try {
      if (type === 'business-card') {
        // Create all contacts
        for (const scan of scannedData) {
          await createContact(scan.data)
        }
        router.push(`/${workspaceSlug}/contacts`)
        router.refresh()
      } else if (type === 'receipt') {
        // Create all transactions
        for (const scan of scannedData) {
          await createTransaction(scan.data)
        }
        router.push(`/${workspaceSlug}/financial`)
        router.refresh()
      }

      onClose()
    } catch (error: any) {
      console.error('Error creating records:', error)
      setError(error.message || 'Error al crear registros')
    } finally {
      setIsCreating(false)
    }
  }

  const createContact = async (data: any) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    // Create or find company
    let companyId = null
    if (data.company) {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('workspace_id', workspaceId)
        .ilike('name', data.company)
        .single()

      if (existingCompany) {
        companyId = existingCompany.id
      } else {
        const { data: newCompany } = await supabase
          .from('companies')
          .insert({
            workspace_id: workspaceId,
            name: data.company,
            website: data.website,
            address: data.address,
          })
          .select('id')
          .single()

        companyId = newCompany?.id
      }
    }

    // Create contact
    const { error } = await supabase.from('contacts').insert({
      workspace_id: workspaceId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      position: data.title,
      company_id: companyId,
    })

    if (error) throw error
  }

  const createTransaction = async (data: any) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { error } = await supabase.from('transactions').insert({
      workspace_id: workspaceId,
      type: 'expense', // Receipts are typically expenses
      amount: data.total_amount || 0,
      description: `${data.vendor_name || 'Gasto'} - ${data.category || 'General'}`,
      transaction_date: data.date || new Date().toISOString().split('T')[0],
      category: data.category,
      notes: data.items ? JSON.stringify(data.items) : null,
    })

    if (error) throw error
  }

  const currentScan = scannedData[currentIndex]
  const hasMultiple = scannedData.length > 1

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {type === 'business-card' ? '📇 Escanear Tarjetas' : '🧾 Escanear Recibos'}
            </h2>
            {scannedData.length > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                {hasMultiple ? `Escaneado ${currentIndex + 1} de ${scannedData.length}` : 'Revisar datos extraídos'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Upload Section */}
          {scannedData.length === 0 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center cursor-pointer hover:border-slate-200 hover:bg-slate-100 transition-colors"
              >
                {isScanning ? (
                  <div className="space-y-4">
                    <Loader2 className="h-12 w-12 text-slate-600 animate-spin mx-auto" />
                    <p className="text-slate-700 font-medium">Escaneando imágenes...</p>
                    <p className="text-sm text-slate-500">Esto puede tomar unos segundos</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <Upload className="h-12 w-12 text-slate-400" />
                      <Camera className="h-12 w-12 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-900 mb-2">
                        Subir {type === 'business-card' ? 'Tarjetas' : 'Recibos'}
                      </p>
                      <p className="text-sm text-slate-600">
                        Haz clic o arrastra imágenes aquí
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Puedes subir múltiples imágenes a la vez
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-slate-100 border border-slate-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-600">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Review Section */}
          {currentScan && (
            <div className="space-y-6">
              {/* Navigation for multiple scans */}
              {hasMultiple && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </button>

                  <span className="text-sm text-slate-600">
                    {currentIndex + 1} / {scannedData.length}
                  </span>

                  <button
                    onClick={() => setCurrentIndex(Math.min(scannedData.length - 1, currentIndex + 1))}
                    disabled={currentIndex === scannedData.length - 1}
                    className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Preview */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Imagen Original
                  </label>
                  <img
                    src={currentScan.imageUrl}
                    alt="Scanned"
                    className="w-full rounded-lg border border-slate-200"
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                      Confianza: {currentScan.confidence}%
                    </span>
                    {currentScan.edited && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Check className="h-4 w-4" />
                        Editado
                      </span>
                    )}
                  </div>
                </div>

                {/* Extracted Data Form */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Datos Extraídos (Editables)
                  </label>
                  <div className="space-y-3">
                    {type === 'business-card' ? (
                      <BusinessCardForm
                        data={currentScan.data}
                        onChange={updateField}
                      />
                    ) : (
                      <ReceiptForm
                        data={currentScan.data}
                        onChange={updateField}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                <button
                  onClick={() => {
                    setScannedData([])
                    setImages([])
                    setCurrentIndex(0)
                  }}
                  className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Escanear Más
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateAll}
                    disabled={isCreating}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-slate-100 text-white rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                    {hasMultiple
                      ? `Crear ${scannedData.length} ${type === 'business-card' ? 'Contactos' : 'Transacciones'}`
                      : `Crear ${type === 'business-card' ? 'Contacto' : 'Transacción'}`
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Business Card Form
function BusinessCardForm({ data, onChange }: { data: any; onChange: (field: string, value: any) => void }) {
  const getConfidence = (field: string) => data.confidence?.[field] || 0

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-slate-600'
    if (confidence >= 70) return 'text-slate-600'
    return 'text-slate-600'
  }

  const fields = [
    { key: 'name', label: 'Nombre' },
    { key: 'title', label: 'Título/Puesto' },
    { key: 'company', label: 'Empresa' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'website', label: 'Sitio Web' },
    { key: 'address', label: 'Dirección' },
  ]

  return (
    <>
      {fields.map(({ key, label }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">{label}</label>
            {data.confidence && (
              <span className={`text-xs ${getConfidenceColor(getConfidence(key))}`}>
                {getConfidence(key)}%
              </span>
            )}
          </div>
          <input
            type="text"
            value={data[key] || ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder={label}
          />
        </div>
      ))}
    </>
  )
}

// Receipt Form
function ReceiptForm({ data, onChange }: { data: any; onChange: (field: string, value: any) => void }) {
  const getConfidence = (field: string) => data.confidence?.[field] || 0

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-slate-600'
    if (confidence >= 70) return 'text-slate-600'
    return 'text-slate-600'
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Establecimiento</label>
          {data.confidence && (
            <span className={`text-xs ${getConfidenceColor(getConfidence('vendor_name'))}`}>
              {getConfidence('vendor_name')}%
            </span>
          )}
        </div>
        <input
          type="text"
          value={data.vendor_name || ''}
          onChange={(e) => onChange('vendor_name', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Monto Total</label>
          {data.confidence && (
            <span className={`text-xs ${getConfidenceColor(getConfidence('total_amount'))}`}>
              {getConfidence('total_amount')}%
            </span>
          )}
        </div>
        <input
          type="number"
          step="0.01"
          value={data.total_amount || ''}
          onChange={(e) => onChange('total_amount', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Impuesto</label>
          {data.confidence && (
            <span className={`text-xs ${getConfidenceColor(getConfidence('tax_amount'))}`}>
              {getConfidence('tax_amount')}%
            </span>
          )}
        </div>
        <input
          type="number"
          step="0.01"
          value={data.tax_amount || ''}
          onChange={(e) => onChange('tax_amount', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Fecha</label>
          {data.confidence && (
            <span className={`text-xs ${getConfidenceColor(getConfidence('date'))}`}>
              {getConfidence('date')}%
            </span>
          )}
        </div>
        <input
          type="date"
          value={data.date || ''}
          onChange={(e) => onChange('date', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-1 block">Categoría</label>
        <select
          value={data.category || ''}
          onChange={(e) => onChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">Seleccionar categoría</option>
          <option value="food">Alimentos</option>
          <option value="office">Oficina</option>
          <option value="travel">Viajes</option>
          <option value="utilities">Servicios</option>
          <option value="supplies">Suministros</option>
          <option value="other">Otro</option>
        </select>
      </div>
    </>
  )
}
