'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarDays, TrendingUp, DollarSign, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ComisionMensual {
  id: string
  leadId: string
  clienteNombre: string
  edificioNombre: string
  unidadCodigo: string
  montoComision: number
  porcentajeComision: number
  fechaLead: string
  estadoLead: string
}

interface ResumenAnual {
  mes: string
  totalComisiones: number
  cantidadVentas: number
  promedioComision: number
}

interface CashFlowDay {
  fecha: string
  totalComisiones: number
  cantidadLeads: number
  leads: Array<{
    id: string
    clienteNombre: string
    edificioNombre: string
    unidadCodigo: string
    montoComision: number
    estado: string
  }>
}

interface CashFlowResponse {
  data: CashFlowDay[]
  summary: {
    totalComisiones: number
    totalLeads: number
    promedioComision: number
  }
}

export default function ReportesPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [comisionesMensuales, setComisionesMensuales] = useState<ComisionMensual[]>([])
  const [resumenAnual, setResumenAnual] = useState<ResumenAnual[]>([])
  const [loading, setLoading] = useState(false)

  // Cash Flow state
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [cashFlowData, setCashFlowData] = useState<CashFlowResponse | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())

  const meses = [
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
  ]

  const años = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year.toString(), label: year.toString() }
  })

  const fetchComisionesMensuales = async () => {
    setLoading(true)
    try {
      const url = `/api/broker/reportes/comisiones-mensuales?mes=${selectedMonth}&year=${selectedYear}`
      console.log('Fetching URL:', url)

      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Data received:', data)
        setComisionesMensuales(data)
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error fetching comisiones mensuales:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResumenAnual = async () => {
    setLoading(true)
    try {
      const url = `/api/broker/reportes/resumen-anual?year=${selectedYear}`
      console.log('Fetching URL:', url)

      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Data received:', data)
        setResumenAnual(data)
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error fetching resumen anual:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCashFlow = async () => {
    setLoading(true)
    try {
      const url = `/api/broker/reportes/cash-flow?startDate=${startDate}&endDate=${endDate}`
      console.log('Fetching URL:', url)

      const response = await fetch(url)
      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Cash flow data received:', data)
        setCashFlowData(data)
      } else {
        const errorData = await response.text()
        console.error('Error response:', errorData)
      }
    } catch (error) {
      console.error('Error fetching cash flow:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleDateExpansion = (fecha: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fecha)) {
        newSet.delete(fecha)
      } else {
        newSet.add(fecha)
      }
      return newSet
    })
  }

  useEffect(() => {
    fetchComisionesMensuales()
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchResumenAnual()
  }, [selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount)
  }

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'ENTREGADO':
        return 'bg-green-100 text-green-800'
      case 'RESERVA_PAGADA':
        return 'bg-blue-100 text-blue-800'
      case 'APROBADO':
        return 'bg-purple-100 text-purple-800'
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const totalComisionesMes = comisionesMensuales.reduce((sum, comision) => sum + comision.montoComision, 0)
  const totalComisionesAño = resumenAnual.reduce((sum, mes) => sum + mes.totalComisiones, 0)
  const totalVentasAño = resumenAnual.reduce((sum, mes) => sum + mes.cantidadVentas, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reportes de Comisiones</h1>
        <p className="text-muted-foreground">
          Analiza tus comisiones y rendimiento de ventas
        </p>
      </div>

      <Tabs defaultValue="mensual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mensual">Detalle Mensual</TabsTrigger>
          <TabsTrigger value="anual">Resumen Anual</TabsTrigger>
          <TabsTrigger value="cashflow">Flujo de Caja</TabsTrigger>
        </TabsList>

        <TabsContent value="mensual" className="space-y-6">
          {/* Filtros para reporte mensual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5" />
                <span>Filtros</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Mes</label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar mes" />
                    </SelectTrigger>
                    <SelectContent>
                      {meses.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Año</label>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen mensual */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalComisionesMes)}</div>
                <p className="text-xs text-muted-foreground">
                  {meses[parseInt(selectedMonth)]?.label} {selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas del Mes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{comisionesMensuales.length}</div>
                <p className="text-xs text-muted-foreground">
                  Leads registrados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Comisión Promedio</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {comisionesMensuales.length > 0
                    ? formatCurrency(totalComisionesMes / comisionesMensuales.length)
                    : formatCurrency(0)
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Por venta
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de detalle mensual */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Comisiones</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : comisionesMensuales.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Edificio</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead>Comisión %</TableHead>
                      <TableHead>Monto Comisión</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comisionesMensuales.map((comision) => (
                      <TableRow key={comision.id}>
                        <TableCell className="font-medium">{comision.clienteNombre}</TableCell>
                        <TableCell>{comision.edificioNombre}</TableCell>
                        <TableCell>{comision.unidadCodigo}</TableCell>
                        <TableCell>{comision.porcentajeComision}%</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(comision.montoComision)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getEstadoBadgeColor(comision.estadoLead)}>
                            {comision.estadoLead.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(comision.fechaLead).toLocaleDateString('es-CL')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay comisiones registradas para este período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anual" className="space-y-6">
          {/* Filtros para reporte anual */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5" />
                <span>Año</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full sm:w-48">
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
              </div>
            </CardContent>
          </Card>

          {/* Resumen anual */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Anual</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalComisionesAño)}</div>
                <p className="text-xs text-muted-foreground">
                  Año {selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVentasAño}</div>
                <p className="text-xs text-muted-foreground">
                  Leads en {selectedYear}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Promedio Mensual</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalComisionesAño / 12)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por mes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de resumen anual */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : resumenAnual.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mes</TableHead>
                      <TableHead>Cantidad Ventas</TableHead>
                      <TableHead>Total Comisiones</TableHead>
                      <TableHead>Promedio por Venta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumenAnual.map((mes) => (
                      <TableRow key={mes.mes}>
                        <TableCell className="font-medium">{mes.mes}</TableCell>
                        <TableCell>{mes.cantidadVentas}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(mes.totalComisiones)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(mes.promedioComision)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos disponibles para este año
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-6">
          {/* Filtros para flujo de caja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5" />
                <span>Rango de Fechas</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Fecha Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={fetchCashFlow} className="w-full sm:w-auto">
                    Aplicar Filtro
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resumen de flujo de caja */}
          {cashFlowData && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Periodo</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(cashFlowData.summary.totalComisiones)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Del {new Date(startDate).toLocaleDateString('es-CL')} al{' '}
                    {new Date(endDate).toLocaleDateString('es-CL')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{cashFlowData.summary.totalLeads}</div>
                  <p className="text-xs text-muted-foreground">En el periodo seleccionado</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comisión Promedio</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(cashFlowData.summary.promedioComision)}
                  </div>
                  <p className="text-xs text-muted-foreground">Por lead</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabla de flujo de caja por día */}
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Caja por Fecha</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : cashFlowData && cashFlowData.data.length > 0 ? (
                <div className="space-y-2">
                  {cashFlowData.data.map((day) => (
                    <div key={day.fecha} className="border rounded-lg overflow-hidden">
                      <div
                        className="flex items-center justify-between p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                        onClick={() => toggleDateExpansion(day.fecha)}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="font-medium">
                            {new Date(day.fecha).toLocaleDateString('es-CL', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {day.cantidadLeads} lead{day.cantidadLeads !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="font-bold text-lg">
                            {formatCurrency(day.totalComisiones)}
                          </div>
                          {expandedDates.has(day.fecha) ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {expandedDates.has(day.fecha) && (
                        <div className="p-4 bg-background">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Edificio</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Comisión</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {day.leads.map((lead) => (
                                <TableRow key={lead.id}>
                                  <TableCell className="font-medium">
                                    {lead.clienteNombre}
                                  </TableCell>
                                  <TableCell>{lead.edificioNombre}</TableCell>
                                  <TableCell>{lead.unidadCodigo}</TableCell>
                                  <TableCell>
                                    <Badge className={getEstadoBadgeColor(lead.estado)}>
                                      {lead.estado.replace('_', ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right font-semibold">
                                    {formatCurrency(lead.montoComision)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {cashFlowData
                    ? 'No hay datos disponibles para el rango de fechas seleccionado'
                    : 'Selecciona un rango de fechas y haz clic en "Aplicar Filtro"'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}