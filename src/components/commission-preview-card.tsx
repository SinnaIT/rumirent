'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Target, Award } from 'lucide-react'

interface CommissionRule {
  id: string
  porcentaje: number
  cantidadMinima: number
  cantidadMaxima: number | null
}

interface CommissionInfo {
  comisionId: string
  comisionNombre: string
  comisionCodigo: string
  porcentajeBase: number
  totalLeads: number
  currentRule: CommissionRule | null
  nextRule: CommissionRule | null
  untilNextLevel: number | null
}

interface CommissionPreviewCardProps {
  commissionData: Record<string, CommissionInfo>
  activeComisionId?: string | null
  isLoading?: boolean
  selectedDate?: Date
}

export function CommissionPreviewCard({
  commissionData,
  activeComisionId,
  isLoading = false,
  selectedDate
}: CommissionPreviewCardProps) {
  const commissionEntries = Object.entries(commissionData)

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Informacion de Comisiones
          </CardTitle>
          <CardDescription>
            Cargando reglas de comision...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (commissionEntries.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Informacion de Comisiones
          </CardTitle>
          <CardDescription>
            No hay reglas adicionales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Debe llenar la informacion del proyecto para mostrar esta informacion
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatPercentage = (decimal: number): string => {
    return `${(decimal * 100).toFixed(2)}%`
  }

  const formatMonth = (date: Date): string => {
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
  }

  const calculateProgress = (current: number, min: number, max: number | null): number => {
    if (max === null) return 100
    const range = max - min
    const progress = current - min
    return Math.min(100, Math.max(0, (progress / range) * 100))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Informacion de Comisiones
        </CardTitle>
        <CardDescription>
          Prospectos de {selectedDate ? formatMonth(selectedDate) : 'mes actual'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {commissionEntries.map(([comisionId, info]) => {
          const isActive = activeComisionId === comisionId
          const effectiveRate = info.currentRule?.porcentaje ?? info.porcentajeBase

          return (
            <div
              key={comisionId}
              className={`rounded-lg border-2 p-4 transition-all ${
                isActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{info.comisionNombre}</h3>
                    {isActive && (
                      <Badge variant="default" className="text-xs">
                        Comision activa
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Codigo: {info.comisionCodigo}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {formatPercentage(effectiveRate)}
                  </div>
                  <p className="text-xs text-muted-foreground">Portentaje de Comision</p>
                </div>
              </div>

              {/* Lead count */}
              <div className="flex items-center gap-2 mb-3 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{info.totalLeads}</span>
                <span className="text-muted-foreground">
                  {info.totalLeads === 1 ? 'lead' : 'leads'} este mes
                </span>
              </div>

              {/* Current rule info */}
              {info.currentRule && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nivel actual:</span>
                    <span className="font-medium">
                      {info.currentRule.cantidadMinima} - {info.currentRule.cantidadMaxima ?? '∞'} prospectos
                    </span>
                  </div>

                  {info.currentRule.cantidadMaxima !== null && (
                    <Progress
                      value={calculateProgress(
                        info.totalLeads,
                        info.currentRule.cantidadMinima,
                        info.currentRule.cantidadMaxima
                      )}
                      className="h-2"
                    />
                  )}
                </div>
              )}

              {/* Next rule info */}
              {info.nextRule && info.untilNextLevel !== null && (
                <div className="bg-muted/50 rounded-md p-3 mt-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Nuevo nivel disponible
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Necesita <span className="font-semibold">{info.nextRule.cantidadMinima} prospeciones </span> para desbloquear{' '}
                        <span className="font-semibold">{formatPercentage(info.nextRule.porcentaje)}</span> porcentaje
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className="font-mono">
                          {info.untilNextLevel} faltantes
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* No rules configured */}
              {!info.currentRule && !info.nextRule && (
                <div className="text-sm text-muted-foreground italic">
                  No hay reglas de comisión configuradas para esta comsision.
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
