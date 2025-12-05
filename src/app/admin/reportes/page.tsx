'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  DollarSign,
  BarChart3,
  Calendar,
  Target,
  Trophy,
  Clock
} from 'lucide-react'

interface BrokerPerformance {
  id: string
  nombre: string
  email: string
  totalVentas: number
  totalComisiones: number
  ventasEsteMes: number
  comisionesEsteMes: number
  promedioVentaMes: number
  rankingVentas: number
  rankingComisiones: number
  ventasPorMes: { mes: string; ventas: number; comisiones: number }[]
  ultimaVenta: string | null
  tiempoPromedioVenta: number // en días
  tasaConversion: number // porcentaje
}

interface PerformanceStats {
  totalBrokers: number
  totalVentasDelMes: number
  totalComisionesDelMes: number
  mejorVendedor: { nombre: string; ventas: number }
  promedioVentasPorBroker: number
}

export default function AdminReportesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('mes')
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const [brokersPerformance, setBrokersPerformance] = useState<BrokerPerformance[]>([])
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
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

  const fetchPerformanceData = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/reportes/performance-contratistas?period=${selectedPeriod}`

      if (selectedPeriod === 'mes') {
        url += `&mes=${selectedMonth}&year=${selectedYear}`
      } else if (selectedPeriod === 'año') {
        url += `&year=${selectedYear}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setBrokersPerformance(data.brokers)
        setPerformanceStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformanceData()
  }, [selectedPeriod, selectedMonth, selectedYear])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount)
  }

  const getRankingBadge = (ranking: number) => {
    if (ranking === 1) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">🏆 #1</Badge>
    if (ranking === 2) return <Badge className="bg-gray-100 text-gray-800 border-gray-300">🥈 #2</Badge>
    if (ranking === 3) return <Badge className="bg-orange-100 text-orange-800 border-orange-300">🥉 #3</Badge>
    return <Badge variant="outline">#{ranking}</Badge>
  }

  const getPerformanceColor = (value: number, average: number) => {
    if (value > average * 1.2) return 'text-green-600'
    if (value < average * 0.8) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reportes de Performance</h1>
        <p className="text-muted-foreground">
          Análisis detallado del rendimiento de brokers
        </p>
      </div>

      <Tabs defaultValue="ranking" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranking">Ranking de Brokers</TabsTrigger>
          <TabsTrigger value="analisis">Análisis Comparativo</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Período de Análisis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Período</label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Este Mes</SelectItem>
                    <SelectItem value="año">Este Año</SelectItem>
                    <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPeriod === 'mes' && (
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
              )}

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

        {/* Estadísticas Generales */}
        {performanceStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Brokers Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceStats.totalBrokers}</div>
                <p className="text-xs text-muted-foreground">
                  Con arriendos en el período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Arriendos</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{performanceStats.totalVentasDelMes}</div>
                <p className="text-xs text-muted-foreground">
                  Prospectos cerrados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Comisiones</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(performanceStats.totalComisionesDelMes)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Generadas en el período
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mejor Broker</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">{performanceStats.mejorVendedor.nombre}</div>
                <p className="text-xs text-muted-foreground">
                  {performanceStats.mejorVendedor.ventas} arriendos
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <TabsContent value="ranking" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Ranking de Brokers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : brokersPerformance.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ranking</TableHead>
                      <TableHead>Broker</TableHead>
                      <TableHead>Arriendos</TableHead>
                      <TableHead>Comisiones</TableHead>
                      <TableHead>Promedio/Mes</TableHead>
                      <TableHead>Último Arriendo</TableHead>
                      <TableHead>Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brokersPerformance.map((broker, index) => (
                      <TableRow key={broker.id}>
                        <TableCell>
                          {getRankingBadge(index + 1)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{broker.nombre}</div>
                            <div className="text-sm text-muted-foreground">{broker.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">{broker.totalVentas}</div>
                          <div className="text-sm text-muted-foreground">
                            {broker.ventasEsteMes} este período
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {formatCurrency(broker.totalComisiones)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(broker.comisionesEsteMes)} este período
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${getPerformanceColor(broker.promedioVentaMes, performanceStats?.promedioVentasPorBroker || 0)}`}>
                            {broker.promedioVentaMes.toFixed(1)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {broker.ultimaVenta ? (
                            <div className="text-sm">
                              {new Date(broker.ultimaVenta).toLocaleDateString('es-CL')}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin arriendos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {broker.tasaConversion > 0 ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-sm">{broker.tasaConversion}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos disponibles para este período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analisis" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Arriendos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {brokersPerformance.slice(0, 5).map((broker) => {
                  const percentage = performanceStats ? (broker.totalVentas / performanceStats.totalVentasDelMes) * 100 : 0
                  return (
                    <div key={broker.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{broker.nombre}</span>
                        <span>{broker.totalVentas} arriendos ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Comisiones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {brokersPerformance.slice(0, 5).map((broker) => {
                  const percentage = performanceStats ? (broker.totalComisiones / performanceStats.totalComisionesDelMes) * 100 : 0
                  return (
                    <div key={broker.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{broker.nombre}</span>
                        <span>{formatCurrency(broker.totalComisiones)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Métricas de Eficiencia</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead>Tiempo Promedio Arriendo</TableHead>
                    <TableHead>Tasa de Conversión</TableHead>
                    <TableHead>Trend Mensual</TableHead>
                    <TableHead>Eficiencia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokersPerformance.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">{broker.nombre}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{broker.tiempoPromedioVenta} días</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={broker.tasaConversion > 30 ? "default" : "secondary"}>
                          {broker.tasaConversion}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {broker.ventasEsteMes > broker.promedioVentaMes ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {((broker.ventasEsteMes / broker.promedioVentaMes - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <Progress
                            value={Math.min((broker.ventasEsteMes / (broker.promedioVentaMes * 1.2)) * 100, 100)}
                            className="w-16 h-2"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}