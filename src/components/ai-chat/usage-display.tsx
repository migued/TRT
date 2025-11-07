'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Zap, DollarSign, FileText, AlertTriangle, TrendingUp } from 'lucide-react'

interface UsageStats {
  totalMessages: number
  totalTokens: number
  totalCost: number
  filesProcessed: number
  messageLimit: number
  tokenLimit: number
  warningShown: boolean
  percentUsed: number
  isOverLimit: boolean
}

interface UsageDisplayProps {
  initialData: {
    current: UsageStats | null
    history: UsageStats[]
  } | null
}

export default function AIUsageDisplay({ initialData }: UsageDisplayProps) {
  const [usage, setUsage] = useState<UsageStats | null>(initialData?.current || null)
  const [isLoading, setIsLoading] = useState(!initialData)

  useEffect(() => {
    if (!initialData) {
      fetchUsage()
    }
  }, [initialData])

  const fetchUsage = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-chat/usage')
      if (response.ok) {
        const data = await response.json()
        setUsage(data.current)
      }
    } catch (error) {
      console.error('Error fetching usage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Cargando estadísticas...</div>
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <p className="text-slate-600">No hay datos de uso disponibles</p>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) {
      return `$${(cost * 100).toFixed(4)}¢`
    }
    return `$${cost.toFixed(4)}`
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 80) return 'text-slate-900 bg-slate-200'
    return 'text-slate-700 bg-slate-100'
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-slate-900'
    return 'bg-slate-600'
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      {usage.percentUsed >= 80 && (
        <div className="rounded-lg p-4 flex items-start gap-3 bg-slate-100 border border-slate-200">
          <AlertTriangle className="h-5 w-5 mt-0.5 text-slate-700" />
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">
              {usage.isOverLimit ? '¡Límite alcanzado!' : '¡Acercándote al límite!'}
            </h3>
            <p className="text-sm mt-1 text-slate-700">
              {usage.isOverLimit
                ? `Has alcanzado tu límite mensual de ${usage.messageLimit} mensajes. Puedes continuar usando el servicio, pero considera los costos adicionales.`
                : `Has usado ${Math.round(usage.percentUsed)}% de tu límite mensual. Quedan ${usage.messageLimit - usage.totalMessages} mensajes.`
              }
            </p>
          </div>
        </div>
      )}

      {/* Usage Progress */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Uso del Mes Actual</h2>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getUsageColor(usage.percentUsed)}`}>
            {Math.round(usage.percentUsed)}% usado
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>{usage.totalMessages} mensajes</span>
            <span>{usage.messageLimit} límite</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all ${getProgressColor(usage.percentUsed)}`}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{usage.totalMessages}</div>
              <div className="text-sm text-slate-600">Mensajes enviados</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Zap className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatNumber(usage.totalTokens)}</div>
              <div className="text-sm text-slate-600">Tokens usados</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatCost(usage.totalCost)}</div>
              <div className="text-sm text-slate-600">Costo total</div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FileText className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{usage.filesProcessed}</div>
              <div className="text-sm text-slate-600">Archivos procesados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-slate-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-slate-900 mb-1">Límites suaves mensuales</h3>
            <p className="text-sm text-slate-700">
              Los límites son soft limits - recibirás advertencias cuando te acerques al límite,
              pero puedes continuar usando el servicio. El contador se reinicia cada mes.
            </p>
            <div className="mt-3 text-sm text-slate-700">
              <strong>Límite de mensajes:</strong> {usage.messageLimit} mensajes/mes<br />
              <strong>Límite de tokens:</strong> {formatNumber(usage.tokenLimit)} tokens/mes
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
