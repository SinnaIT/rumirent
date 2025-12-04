'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trophy, Medal, Award, TrendingUp, Users, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface BrokerRanking {
  brokerId: string
  nombre: string
  email: string
  totalReservas: number
  montoTotalComisiones: number
  posicion: number
  leads: Array<{
    id: string
    totalLead: number
    comision: number
    estado: string
    fechaPagoReserva: Date | null
  }>
}

interface RumiRaceData {
  mes: number
  anio: number
  mesNombre: string
  ranking: BrokerRanking[]
  totales: {
    totalBrokers: number
    totalReservas: number
    montoTotalComisiones: number
  }
}

const MESES = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
]

export default function RumiRacePage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RumiRaceData | null>(null)

  // Default to current month/year
  const now = new Date()
  const [selectedMes, setSelectedMes] = useState<number>(now.getMonth() + 1)
  const [selectedAnio, setSelectedAnio] = useState<number>(now.getFullYear())

  // Generate years array (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  useEffect(() => {
    fetchRanking()
  }, [selectedMes, selectedAnio])

  const fetchRanking = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/reportes/rumi-race?mes=${selectedMes}&anio=${selectedAnio}`
      )
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar el ranking')
      }

      setData(result)
    } catch (error) {
      console.error('Error al cargar RumiRace:', error)
      toast.error('Error al cargar el ranking')
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

  const getPodiumIcon = (posicion: number) => {
    switch (posicion) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />
      default:
        return null
    }
  }

  const getPodiumBadge = (posicion: number) => {
    switch (posicion) {
      case 1:
        return (
          <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">
            🥇 1er Lugar
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-gray-400 text-white hover:bg-gray-500">
            🥈 2do Lugar
          </Badge>
        )
      case 3:
        return (
          <Badge className="bg-amber-600 text-white hover:bg-amber-700">
            🥉 3er Lugar
          </Badge>
        )
      default:
        return <Badge variant="outline">#{posicion}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Cargando ranking...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            RumiRace - Ranking de Brokers
          </h1>
          <p className="text-muted-foreground mt-1">
            Competencia mensual basada en comisiones generadas
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Mes</label>
            <Select
              value={selectedMes.toString()}
              onValueChange={(value) => setSelectedMes(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value.toString()}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Año</label>
            <Select
              value={selectedAnio.toString()}
              onValueChange={(value) => setSelectedAnio(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Brokers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totales.totalBrokers}
              </div>
              <p className="text-xs text-muted-foreground">
                Participantes activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Reservas
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.totales.totalReservas}
              </div>
              <p className="text-xs text-muted-foreground">
                Reservas válidas del mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Comisiones
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totales.montoTotalComisiones)}
              </div>
              <p className="text-xs text-muted-foreground">
                Suma total generada
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ranking Table */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>
              Ranking de {data.mesNombre} {data.anio}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ranking.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay datos disponibles para este período
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Posición</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead className="text-center">Reservas</TableHead>
                    <TableHead className="text-right">Comisiones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.ranking.map((broker) => (
                    <TableRow
                      key={broker.brokerId}
                      className={
                        broker.posicion <= 3
                          ? 'bg-muted/50 font-medium'
                          : ''
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPodiumIcon(broker.posicion)}
                          {getPodiumBadge(broker.posicion)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{broker.nombre}</div>
                          <div className="text-sm text-muted-foreground">
                            {broker.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {broker.totalReservas} reservas
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(broker.montoTotalComisiones)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
