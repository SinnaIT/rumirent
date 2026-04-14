'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface BrokerMetric {
  id: string
  nombre: string
  email: string
  cantidadReservas: number
  numeroCheckins: number
  comisionesProyectadas: number
  comisionesConfirmadas: number
}

interface DashboardData {
  brokerIds: string[]
  metrics: {
    cantidadReservas: number
    numeroCheckins: number
    comisionesProyectadas: number
    comisionesConfirmadas: number
    porcentajeCierre: number
  }
  brokerMetrics: BrokerMetric[]
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export default function TeamLeaderDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const today = new Date()
  const [selectedMes, setSelectedMes] = useState<number>(today.getMonth() + 1)
  const [selectedAnio, setSelectedAnio] = useState<number>(today.getFullYear())

  useEffect(() => {
    fetchDashboard()
  }, [selectedMes, selectedAnio])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(
        `/api/team-leader/dashboard?mes=${selectedMes}&anio=${selectedAnio}`
      )
      if (!response.ok) throw new Error('Error al cargar el dashboard')
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)

  const handlePreviousMonth = () => {
    if (selectedMes === 1) {
      setSelectedMes(12)
      setSelectedAnio(selectedAnio - 1)
    } else {
      setSelectedMes(selectedMes - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedMes === 12) {
      setSelectedMes(1)
      setSelectedAnio(selectedAnio + 1)
    } else {
      setSelectedMes(selectedMes + 1)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando métricas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchDashboard} className="mt-4">Reintentar</Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { metrics, brokerMetrics } = data

  return (
    <div className="space-y-6">
      {/* Header with Month/Year Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Dashboard del Equipo
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Resumen de actividad de tu equipo de brokers
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/20">
          <Button variant="ghost" size="sm" onClick={handlePreviousMonth} className="h-8 w-8 p-0">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-primary" />
            <Select
              value={selectedMes.toString()}
              onValueChange={(v) => setSelectedMes(parseInt(v))}
            >
              <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{mes}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedAnio.toString()}
              onValueChange={(v) => setSelectedAnio(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => selectedAnio - 5 + i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Brokers en Equipo
                </p>
                <p className="text-3xl font-bold">{data.brokerIds.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Reservas
                </p>
                <p className="text-3xl font-bold">{metrics.cantidadReservas}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Check-ins
                </p>
                <p className="text-3xl font-bold">{metrics.numeroCheckins}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Com. Proyectadas
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(metrics.comisionesProyectadas)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <DollarSign className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Com. Confirmadas
                </p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(metrics.comisionesConfirmadas)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* % Cierre */}
      <Card>
        <CardHeader>
          <CardTitle>Tasa de Cierre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {metrics.porcentajeCierre.toFixed(1)}%
            </div>
            <div className="flex-1">
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(metrics.porcentajeCierre, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broker Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle>Desglose por Broker</CardTitle>
        </CardHeader>
        <CardContent>
          {brokerMetrics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay brokers asignados a tu equipo
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Broker</TableHead>
                    <TableHead className="text-center">Reservas</TableHead>
                    <TableHead className="text-center">Check-ins</TableHead>
                    <TableHead className="text-right">Com. Proyectadas</TableHead>
                    <TableHead className="text-right">Com. Confirmadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brokerMetrics.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{broker.nombre}</p>
                          <p className="text-xs text-muted-foreground">{broker.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{broker.cantidadReservas}</TableCell>
                      <TableCell className="text-center">{broker.numeroCheckins}</TableCell>
                      <TableCell className="text-right text-blue-600 dark:text-blue-400 font-medium">
                        {formatCurrency(broker.comisionesProyectadas)}
                      </TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                        {formatCurrency(broker.comisionesConfirmadas)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
