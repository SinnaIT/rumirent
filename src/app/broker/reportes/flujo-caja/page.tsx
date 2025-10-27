'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DollarSign, Calendar, TrendingUp, FileText } from 'lucide-react'

interface MonthlyData {
  month: string
  reservas: number
  checkins: number
  bruto: number
  liquido: number
}

interface CashFlowTotals {
  reservas: number
  checkins: number
  bruto: number
  liquido: number
}

interface CashFlowSummary {
  totalComisiones: number
  totalLeads: number
  promedioComision: number
}

interface CashFlowResponse {
  summary: CashFlowSummary
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
  const [summary, setSummary] = useState<CashFlowSummary | null>(null)
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyData[]>([])
  const [totals, setTotals] = useState<CashFlowTotals | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCashFlow = async () => {
    setLoading(true)
    try {
      const url = `/api/broker/reportes/cash-flow?startDate=${startDate}&endDate=${endDate}`
      console.log('Fetching cash flow:', url)

      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (response.ok) {
        const data: CashFlowResponse = await response.json()
        console.log('Cash flow data received:', data)
        setSummary(data.summary)
        setMonthlyBreakdown(data.monthlyBreakdown || [])
        setTotals(data.totals || null)
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
        setSummary(null)
        setMonthlyBreakdown([])
        setTotals(null)
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
      setSummary(null)
      setMonthlyBreakdown([])
      setTotals(null)
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
      year: 'numeric'
    })
  }

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

      {/* Resumen del periodo - Cards por mes */}
      {totals && monthlyBreakdown.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <h2 className="text-xl font-semibold">
              Resumen del Periodo
            </h2>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {monthlyBreakdown.map((month, index) => (
              <Card key={index} className="overflow-hidden">
                {/* Header con nombre del mes */}
                <div className="bg-primary text-primary-foreground px-4 py-3 text-center">
                  <h3 className="text-lg font-semibold capitalize">{month.month}</h3>
                  <p className="text-xs mt-1 opacity-90">
                    {formatDate(startDate)}
                  </p>
                  <p className="text-xs opacity-90">
                    {formatDate(endDate)}
                  </p>
                </div>

                {/* Contenido de la card */}
                <CardContent className="p-4 space-y-3">
                  {/* Reservas y Checkin en dos columnas */}
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

                  {/* Cobro */}
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-primary">Cobro:</p>
                    <p className="text-2xl font-bold text-right">{month.reservas + month.checkins}</p>
                  </div>

                  {/* Bruto */}
                  <div className="pb-3 border-b border-border">
                    <p className="text-sm font-medium text-primary">Bruto</p>
                    <p className="text-xl font-bold text-right">{formatCurrency(month.bruto)}</p>
                  </div>

                  {/* Liquido */}
                  <div>
                    <p className="text-sm font-medium text-primary">Liquido</p>
                    <p className="text-xl font-bold text-right text-green-600">{formatCurrency(month.liquido)}</p>
                  </div>

                  {/* vs mes anterior */}
                  <div className="pt-2 text-xs text-muted-foreground">
                    vs mes anterior:
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reservas</p>
                  <p className="text-2xl font-bold">{totals.reservas}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Checkins</p>
                  <p className="text-2xl font-bold">{totals.checkins}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Bruto</p>
                  <p className="text-2xl font-bold">{formatCurrency(totals.bruto)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Liquido</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.liquido)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mensaje inicial */}
      {!summary && !loading && (
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
