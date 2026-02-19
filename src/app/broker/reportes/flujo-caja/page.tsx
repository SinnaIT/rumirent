'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DollarSign, Calendar, FileText, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface MonthlyData {
  month: string
  reservas: number
  checkins: number
  brutoReservas: number
  bruto: number
  taxAmount: number
  taxTypeName: string | null
  taxNature: string | null
  liquido: number
}

interface CashFlowTotals {
  reservas: number
  checkins: number
  brutoReservas: number
  bruto: number
  taxAmount: number
  liquido: number
}

interface TaxInfo {
  taxTypeId: string
  taxTypeName: string
  taxNature: 'ADDITIVE' | 'DEDUCTIVE'
  rate: number
  validFrom: string
}

interface CashFlowResponse {
  summary: {
    totalComisiones: number
    totalReservas: number
    totalCheckins: number
    promedioComision: number
  }
  taxInfo: TaxInfo | null
  monthlyBreakdown: MonthlyData[]
  totals: CashFlowTotals
}

export default function FlujoCajaPage() {
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [taxInfo, setTaxInfo] = useState<TaxInfo | null>(null)
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyData[]>([])
  const [totals, setTotals] = useState<CashFlowTotals | null>(null)
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchCashFlow = async () => {
    setLoading(true)
    try {
      const url = `/api/broker/reportes/cash-flow?startDate=${startDate}&endDate=${endDate}`
      const response = await fetch(url)

      if (response.ok) {
        const data: CashFlowResponse = await response.json()
        setTaxInfo(data.taxInfo || null)
        setMonthlyBreakdown(data.monthlyBreakdown || [])
        setTotals(data.totals || null)
        setHasData(true)
      } else {
        setTaxInfo(null)
        setMonthlyBreakdown([])
        setTotals(null)
        setHasData(false)
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
      setTaxInfo(null)
      setMonthlyBreakdown([])
      setTotals(null)
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatPercent = (rate: number) => `${(rate * 100).toFixed(1)}%`

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Flujo de Caja</h1>
        <p className="text-muted-foreground">
          Resumen de tus comisiones por periodo
        </p>
      </div>

      {/* Filtros de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Rango de Fechas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md bg-background mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchCashFlow} className="w-full sm:w-auto" disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generar Reporte
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Banner de impuesto aplicado */}
      {hasData && taxInfo && (
        <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
          taxInfo.taxNature === 'ADDITIVE'
            ? 'border-blue-200 bg-blue-50 text-blue-800'
            : 'border-orange-200 bg-orange-50 text-orange-800'
        }`}>
          {taxInfo.taxNature === 'ADDITIVE' ? (
            <ArrowUpCircle className="h-5 w-5 shrink-0 text-blue-500" />
          ) : (
            <ArrowDownCircle className="h-5 w-5 shrink-0 text-orange-500" />
          )}
          <span>
            Se aplica <strong>{taxInfo.taxTypeName}</strong> ({formatPercent(taxInfo.rate)}{' '}
            {taxInfo.taxNature === 'ADDITIVE' ? 'adicional' : 'de descuento'}) sobre tus comisiones.
            El monto líquido refleja la comisión{' '}
            {taxInfo.taxNature === 'ADDITIVE' ? 'con el incremento' : 'con la retención'} aplicada.
          </span>
        </div>
      )}

      {/* Sin impuesto asignado */}
      {hasData && !taxInfo && (
        <div className="flex items-center gap-3 rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
          <DollarSign className="h-5 w-5 shrink-0" />
          <span>No tienes un tipo de impuesto asignado. El monto líquido es igual al bruto.</span>
        </div>
      )}

      {/* Resumen del periodo - Cards por mes */}
      {totals && monthlyBreakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Resumen del Periodo</h2>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {monthlyBreakdown.map((month, index) => (
              <Card key={index} className="overflow-hidden">
                {/* Header con nombre del mes */}
                <div className="bg-primary text-primary-foreground px-4 py-3 text-center">
                  <h3 className="text-lg font-semibold capitalize">{month.month}</h3>
                  <p className="text-xs mt-1 opacity-90">{formatDate(startDate)}</p>
                  <p className="text-xs opacity-90">{formatDate(endDate)}</p>
                </div>

                <CardContent className="p-4 space-y-3">
                  {/* Reservas y Checkin */}
                  <div className="grid grid-cols-2 gap-4 pb-3 border-b border-border">
                    <div>
                      <p className="text-sm font-medium text-primary">Reservas</p>
                      <p className="text-2xl font-bold text-center mt-1">{month.reservas}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">Checkin</p>
                      <p className="text-2xl font-bold text-center mt-1">{month.checkins}</p>
                    </div>
                  </div>

                  {/* Bruto de Reservas */}
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-primary">Bruto de Reservas</p>
                    <p className="text-xl font-bold text-right">{formatCurrency(month.brutoReservas)}</p>
                  </div>

                  {/* Bruto (Comisiones) */}
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-primary">Bruto</p>
                    <p className="text-xl font-bold text-right">{formatCurrency(month.bruto)}</p>
                  </div>

                  {/* Impuesto (solo si aplica en este mes específico) */}
                  {month.taxTypeName && month.taxAmount > 0 && (
                    <div className="pb-3 border-b border-border">
                      <p className={`text-sm font-medium ${
                        month.taxNature === 'ADDITIVE' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {month.taxNature === 'ADDITIVE' ? (
                          <span className="flex items-center gap-1">
                            <ArrowUpCircle className="h-3.5 w-3.5" />
                            {month.taxTypeName}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <ArrowDownCircle className="h-3.5 w-3.5" />
                            {month.taxTypeName}
                          </span>
                        )}
                      </p>
                      <p className={`text-xl font-bold text-right ${
                        month.taxNature === 'ADDITIVE' ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {month.taxNature === 'ADDITIVE' ? '+' : '-'}{formatCurrency(month.taxAmount)}
                      </p>
                    </div>
                  )}

                  {/* Liquido */}
                  <div>
                    <p className="text-sm font-medium text-primary">Líquido</p>
                    <p className="text-xl font-bold text-right text-green-600">
                      {formatCurrency(month.liquido)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Card de totales */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Totales del Periodo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`grid gap-4 grid-cols-2 ${taxInfo ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reservas</p>
                  <p className="text-2xl font-bold">{totals.reservas}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Checkins</p>
                  <p className="text-2xl font-bold">{totals.checkins}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bruto de Reservas</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.brutoReservas)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bruto</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.bruto)}</p>
                </div>
                {taxInfo && (
                  <div>
                    <p className={`text-sm font-medium ${
                      taxInfo.taxNature === 'ADDITIVE' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {taxInfo.taxTypeName} ({formatPercent(taxInfo.rate)})
                    </p>
                    <p className={`text-2xl font-bold ${
                      taxInfo.taxNature === 'ADDITIVE' ? 'text-blue-600' : 'text-orange-600'
                    }`}>
                      {taxInfo.taxNature === 'ADDITIVE' ? '+' : '-'}{formatCurrency(totals.taxAmount)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Líquido</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.liquido)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mensaje inicial */}
      {!hasData && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Selecciona un rango de fechas</p>
              <p className="text-sm">
                Haz clic en &quot;Generar Reporte&quot; para ver el resumen de tus comisiones
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
