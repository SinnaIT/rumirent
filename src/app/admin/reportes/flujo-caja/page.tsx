'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Filter
} from 'lucide-react'

interface FlujoCajaData {
  mes: string
  fechaInicio: string
  fechaFin: string
  reservas: number
  checkin: number
  cobro: number
  bruto: number
  liquido: number
}

interface FlujoCajaStats {
  totalReservas: number
  totalCheckin: number
  totalCobro: number
  totalBruto: number
  totalLiquido: number
  mejorMes: string
  crecimientoMensual: number
}

export default function FlujoCajaPage() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [flujoCajaData, setFlujoCajaData] = useState<FlujoCajaData[]>([])
  const [stats, setStats] = useState<FlujoCajaStats | null>(null)
  const [loading, setLoading] = useState(false)

  const años = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year.toString(), label: year.toString() }
  })

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const fetchFlujoCajaData = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reportes/flujo-caja?year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setFlujoCajaData(data.flujoCaja)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching flujo caja data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlujoCajaData()
  }, [selectedYear])

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

  const exportToCSV = () => {
    const headers = ['Mes', 'Fecha Inicio', 'Fecha Fin', 'Reservas', 'Checkin', 'Cobro', 'Bruto', 'Líquido']
    const csvContent = [
      headers.join(','),
      ...flujoCajaData.map(row => [
        row.mes,
        formatDate(row.fechaInicio),
        formatDate(row.fechaFin),
        row.reservas,
        row.checkin,
        row.cobro,
        row.bruto,
        row.liquido
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flujo-caja-${selectedYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
    return <div className="h-4 w-4" />
  }

  const getVariationBadge = (current: number, previous: number) => {
    if (previous === 0) return null

    const variation = ((current - previous) / previous) * 100
    const isPositive = variation > 0

    return (
      <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
        {isPositive ? '+' : ''}{variation.toFixed(1)}%
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reporte de Flujo de Caja</h1>
        <p className="text-muted-foreground">
          Análisis mensual de ingresos por reservas, check-ins y pagos
        </p>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Card className="flex-1 max-w-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Año</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar año" />
              </SelectTrigger>
              <SelectContent>
                {años.map((año) => (
                  <SelectItem key={año.value} value={año.value}>
                    {año.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Button onClick={exportToCSV} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Exportar CSV</span>
        </Button>
      </div>

      {/* Estadísticas resumen */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalReservas)}</div>
              <p className="text-xs text-muted-foreground">
                Año {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Check-in</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCheckin)}</div>
              <p className="text-xs text-muted-foreground">
                Ingresos por check-in
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cobrado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalCobro)}</div>
              <p className="text-xs text-muted-foreground">
                Cobros efectivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Brutos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalBruto)}</div>
              <p className="text-xs text-muted-foreground">
                Antes de descuentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Líquidos</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalLiquido)}</div>
              <p className="text-xs text-muted-foreground">
                Ganancia neta
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Flujo de caja mensual en formato de cards */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 mb-6">
          <DollarSign className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Flujo de Caja Mensual - {selectedYear}</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : flujoCajaData.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {flujoCajaData.map((mes, index) => {
              const previousMes = index > 0 ? flujoCajaData[index - 1] : null

              return (
                <Card key={mes.mes} className="border border-gray-200 shadow-sm">
                  {/* Header del mes - azul como en la imagen */}
                  <div className="bg-blue-500 text-white px-4 py-3 rounded-t-lg">
                    <h3 className="font-semibold text-lg text-center">{mes.mes}</h3>
                    <div className="text-center text-sm mt-1">
                      <div>{formatDate(mes.fechaInicio)}</div>
                      <div>{formatDate(mes.fechaFin)}</div>
                    </div>
                  </div>

                  {/* Contenido del mes */}
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {/* Reservas y Checkin */}
                      <div className="grid grid-cols-2 divide-x">
                        <div className="p-3">
                          <div className="text-xs font-medium text-blue-600 mb-1">Reservas</div>
                          <div className="text-right font-mono text-sm">
                            {mes.reservas.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="text-xs font-medium text-blue-600 mb-1">Checkin</div>
                          <div className="text-right font-mono text-sm">
                            {mes.checkin.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Cobro */}
                      <div className="p-3">
                        <div className="text-xs font-medium text-blue-600 mb-1">Cobro:</div>
                        <div className="text-right font-mono text-sm">
                          {mes.cobro.toLocaleString()}
                        </div>
                      </div>

                      {/* Bruto */}
                      <div className="p-3">
                        <div className="text-xs font-medium text-blue-600 mb-1">Bruto</div>
                        <div className="text-right font-mono text-sm font-semibold">
                          {mes.bruto.toLocaleString()}
                        </div>
                      </div>

                      {/* Líquido */}
                      <div className="p-3">
                        <div className="text-xs font-medium text-blue-600 mb-1">Líquido</div>
                        <div className="text-right font-mono text-sm font-bold text-green-600">
                          {mes.liquido.toLocaleString()}
                        </div>
                      </div>

                      {/* Indicador de tendencia */}
                      {previousMes && (
                        <div className="p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">vs mes anterior:</span>
                            <div className="flex items-center space-x-2">
                              {getTrendIcon(mes.liquido, previousMes.liquido)}
                              {getVariationBadge(mes.liquido, previousMes.liquido)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos disponibles para este año
          </div>
        )}
      </div>

      {/* Insights adicionales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mejor Mes del Año</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.mejorMes}</div>
              <p className="text-muted-foreground">
                Mes con mayores ingresos líquidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Crecimiento Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">
                  {stats.crecimientoMensual > 0 ? '+' : ''}{stats.crecimientoMensual.toFixed(1)}%
                </div>
                {stats.crecimientoMensual > 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-600" />
                )}
              </div>
              <p className="text-muted-foreground">
                Crecimiento mensual promedio
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}