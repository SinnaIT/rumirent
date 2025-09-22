'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CalendarDays, TrendingUp, DollarSign, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ComisionMensual {
  id: string
  contratoId: string
  clienteNombre: string
  edificioNombre: string
  unidadCodigo: string
  montoComision: number
  porcentajeComision: number
  fechaContrato: string
  estadoContrato: string
}

interface ResumenAnual {
  mes: string
  totalComisiones: number
  cantidadVentas: number
  promedioComision: number
}

export default function ReportesPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [comisionesMensuales, setComisionesMensuales] = useState<ComisionMensual[]>([])
  const [resumenAnual, setResumenAnual] = useState<ResumenAnual[]>([])
  const [loading, setLoading] = useState(false)

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
      const url = `/api/contratista/reportes/comisiones-mensuales?mes=${selectedMonth}&year=${selectedYear}`
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
      const url = `/api/contratista/reportes/resumen-anual?year=${selectedYear}`
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mensual">Detalle Mensual</TabsTrigger>
          <TabsTrigger value="anual">Resumen Anual</TabsTrigger>
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
                  Contratos registrados
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
                          <Badge className={getEstadoBadgeColor(comision.estadoContrato)}>
                            {comision.estadoContrato.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(comision.fechaContrato).toLocaleDateString('es-CL')}
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
                  Contratos en {selectedYear}
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
      </Tabs>
    </div>
  )
}