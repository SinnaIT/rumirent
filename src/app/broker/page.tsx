'use client'

import { useState, useEffect } from 'react'
import {
  Home,
  DollarSign,
  TrendingUp,
  Target,
  Calendar,
  CheckCircle,
  Users,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DashboardMetrics {
  cantidadReservas: number
  numeroCheckins: number
  comisionesProyectadas: number
  comisionesConcretadas: number
  porcentajeCierre: number
  metaColocacion: {
    montoActual: number
    montoMeta: number
    porcentaje: number
  }
}

interface BrokerRanking {
  brokerId: string
  posicion: number
  totalReservas: number
  montoTotalComisiones: number
}

interface RumiRacePosition {
  posicion: number
  totalBrokers: number
  totalReservas: number
  montoTotalComisiones: number
}

const meses = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export default function BrokerDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rumiRacePosition, setRumiRacePosition] = useState<RumiRacePosition | null>(null)

  // Obtener mes y año actual
  const today = new Date()
  const [selectedMes, setSelectedMes] = useState<number>(today.getMonth() + 1)
  const [selectedAnio, setSelectedAnio] = useState<number>(today.getFullYear())

  useEffect(() => {
    fetchMetrics()
    fetchRumiRacePosition()
  }, [selectedMes, selectedAnio])

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(
        `/api/broker/dashboard?mes=${selectedMes}&anio=${selectedAnio}`
      )

      if (!response.ok) {
        throw new Error('Error al cargar las métricas')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Error fetching metrics:', error)
      setError('Error al cargar las métricas del dashboard')
    } finally {
      setLoading(false)
    }
  }

  const fetchRumiRacePosition = async () => {
    try {
      // Fetch the full ranking
      const response = await fetch(
        `/api/admin/reportes/rumi-race?mes=${selectedMes}&anio=${selectedAnio}`
      )

      if (!response.ok) {
        console.error('Error fetching RumiRace ranking')
        return
      }

      const data = await response.json()

      // Find current user's position in the ranking
      const userResponse = await fetch('/api/auth/me')
      if (!userResponse.ok) return

      const userData = await userResponse.json()
      const userId = userData.user.id

      const myPosition = data.ranking.find((r: BrokerRanking) => r.brokerId === userId)

      if (myPosition) {
        setRumiRacePosition({
          posicion: myPosition.posicion,
          totalBrokers: data.totales.totalBrokers,
          totalReservas: myPosition.totalReservas,
          montoTotalComisiones: myPosition.montoTotalComisiones,
        })
      } else {
        // Not in ranking this month
        setRumiRacePosition({
          posicion: 0,
          totalBrokers: data.totales.totalBrokers,
          totalReservas: 0,
          montoTotalComisiones: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching RumiRace position:', error)
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
          <Button onClick={fetchMetrics} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Month/Year Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Mi Dashboard
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Resumen de tu actividad de ventas
          </p>
        </div>

        {/* Month/Year Selector */}
        <div className="flex items-center space-x-3 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-primary" />
            <Select
              value={selectedMes.toString()}
              onValueChange={(value) => setSelectedMes(parseInt(value))}
            >
              <SelectTrigger className="w-[140px] border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedAnio.toString()}
              onValueChange={(value) => setSelectedAnio(parseInt(value))}
            >
              <SelectTrigger className="w-[100px] border-0 bg-transparent focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => selectedAnio - 5 + i).map(
                  (year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions - Moved to top */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-card-foreground mb-2">
            Acciones Rápidas
          </h3>
          <p className="text-sm text-muted-foreground">
            Gestiona tus ventas y comisiones
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            onClick={() => (window.location.href = '/broker/proyectos')}
            className="group p-6 text-left bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <Home className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
              <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
            </div>
            <p className="text-base font-bold text-foreground mb-2">
              Ver Proyectos
            </p>
            <p className="text-sm text-muted-foreground">
              Explorar proyectos disponibles
            </p>
          </button>
          <button
            onClick={() => (window.location.href = '/broker/generar-lead')}
            className="group p-6 text-left bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 rounded-xl transition-all duration-300 border border-success/10 hover:border-success/30 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-7 w-7 text-success group-hover:scale-110 transition-transform" />
              <div className="w-2 h-2 bg-success/30 rounded-full"></div>
            </div>
            <p className="text-base font-bold text-foreground mb-2">
              Generar Lead
            </p>
            <p className="text-sm text-muted-foreground">
              Agregar nueva oportunidad
            </p>
          </button>
          <button
            onClick={() => (window.location.href = '/broker/reportes')}
            className="group p-6 text-left bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 rounded-xl transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-7 w-7 text-secondary group-hover:scale-110 transition-transform" />
              <div className="w-2 h-2 bg-secondary/30 rounded-full"></div>
            </div>
            <p className="text-base font-bold text-foreground mb-2">
              Ver Reportes
            </p>
            <p className="text-sm text-muted-foreground">
              Revisar rendimiento
            </p>
          </button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* 1. Cantidad de Reservas */}
        <div className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Cantidad de Reservas
              </p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-card-foreground tracking-tight">
                  {metrics.cantidadReservas}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Leads generados este mes
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform duration-300">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* 2. Número de Check-ins */}
        <div className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-success/5 transition-all duration-300 hover:border-success/20 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Número de Check-ins
              </p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-card-foreground tracking-tight">
                  {metrics.numeroCheckins}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Arriendos concretados
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-success/10 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        {/* 3. Meta de Colocación */}
        <div className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-warning/5 transition-all duration-300 hover:border-warning/20 cursor-pointer">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Meta de Colocación
              </p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-card-foreground tracking-tight">
                  {formatCurrency(metrics.metaColocacion.montoActual)}
                </p>
                <span className="text-sm text-muted-foreground">/</span>
                <p className="text-lg font-semibold text-muted-foreground">
                  {formatCurrency(metrics.metaColocacion.montoMeta)}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-warning/10 group-hover:scale-110 transition-transform duration-300">
              <Target className="h-6 w-6 text-warning" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-bold text-warning">
                {metrics.metaColocacion.porcentaje.toFixed(1)}%
              </span>
            </div>
            <div className={`w-full rounded-full h-2 overflow-hidden transition-all ${
              metrics.metaColocacion.porcentaje >= 100 ? 'bg-gradient-to-r from-warning to-warning/70' : 'bg-muted'
            }`}>
              {metrics.metaColocacion.porcentaje < 100 && (
                <div
                  className="bg-gradient-to-r from-warning to-warning/70 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${metrics.metaColocacion.porcentaje}%`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* 4. % de Cierre del Mes */}
        <div className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 hover:border-accent/20 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                % de Cierre del Mes
              </p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-card-foreground tracking-tight">
                  {metrics.porcentajeCierre.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Tasa de conversión
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-accent/10 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
          </div>
        </div>

        {/* 5. Comisiones Proyectadas */}
        <div className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 hover:border-secondary/20 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Comisiones Proyectadas
              </p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-secondary tracking-tight">
                  {formatCurrency(metrics.comisionesProyectadas)}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Potencial de ingresos
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-secondary/10 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </div>

        {/* 6. Comisiones Concretadas */}
        <div className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-success/5 transition-all duration-300 hover:border-success/20 cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Comisiones Concretadas
              </p>
              <div className="space-y-1">
                <p className="text-3xl font-bold text-success tracking-tight">
                  {formatCurrency(metrics.comisionesConcretadas)}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  Ingresos confirmados
                </p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-success/10 group-hover:scale-110 transition-transform duration-300">
              <CheckSquare className="h-6 w-6 text-success" />
            </div>
          </div>
        </div>

        {/* RumiRace Widget */}
        {rumiRacePosition && (
          <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-400/50 dark:border-yellow-600/50 rounded-xl p-6 shadow-sm hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400 uppercase tracking-wider">
                    RumiRace - Ranking Mensual
                  </p>
                </div>
                {rumiRacePosition.posicion > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-yellow-600 dark:text-yellow-500 tracking-tight">
                        #{rumiRacePosition.posicion}
                      </p>
                      <span className="text-sm text-muted-foreground">de {rumiRacePosition.totalBrokers}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                      Tu posición en el ranking
                    </p>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-muted-foreground">Sin ranking</p>
                    <p className="text-xs text-muted-foreground">
                      Genera leads este mes para participar
                    </p>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/20 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="h-7 w-7 text-yellow-600 dark:text-yellow-500" />
              </div>
            </div>

            {rumiRacePosition.posicion > 0 && (
              <div className="space-y-3 pt-3 border-t border-yellow-400/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Reservas:</span>
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">
                    {rumiRacePosition.totalReservas}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Comisiones:</span>
                  <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">
                    {formatCurrency(rumiRacePosition.montoTotalComisiones)}
                  </span>
                </div>

                {/* Medals for top 3 */}
                {rumiRacePosition.posicion <= 3 && (
                  <div className="pt-2 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                      {rumiRacePosition.posicion === 1 && '🥇 1er Lugar'}
                      {rumiRacePosition.posicion === 2 && '🥈 2do Lugar'}
                      {rumiRacePosition.posicion === 3 && '🥉 3er Lugar'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
