'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  Calculator,
  RefreshCw,
  Plus,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
}

interface Unidad {
  id: string
  numero: string
  descripcion?: string
  metros2?: number
  edificio: {
    id: string
    nombre: string
    direccion: string
  }
  tipoUnidad: {
    id: string
    nombre: string
    codigo: string
    comision: Comision
  }
}

interface Contrato {
  id: string
  numero: number
  prioridad: 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE'
  rutCliente: string
  nombreCliente: string
  precioPesos: number
  precioUF: number
  comisionAsesor: number
  estado: 'POSTULACION' | 'RESERVADO' | 'CONTRATADO' | 'CHECKIN_REALIZADO' | 'CANCELADO'
  fechaPagoReserva?: string
  fechaPagoContrato?: string
  fechaCheckin?: string
  unidadManual?: string
  observaciones?: string
  unidad: Unidad | null
  createdAt: string
  updatedAt: string
}

interface Estadisticas {
  totalContratos: number
  postulaciones: number
  reservados: number
  contratados: number
  checkinRealizados: number
  cancelados: number
  totalComisionesEsperadas: number
  totalComisionesRealizadas: number
}

const ESTADOS_CONTRATO = [
  { value: 'POSTULACION', label: 'Postulación', color: 'bg-blue-100 text-blue-800', icon: Clock },
  { value: 'RESERVADO', label: 'Reservado', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
  { value: 'CONTRATADO', label: 'Contratado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'CHECKIN_REALIZADO', label: 'Check-in Realizado', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
]

const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja', color: 'bg-gray-100 text-gray-800' },
  { value: 'MEDIA', label: 'Media', color: 'bg-blue-100 text-blue-800' },
  { value: 'ALTA', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-100 text-red-800' }
]

export default function ContratistaVentasPage() {
  const router = useRouter()
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  useEffect(() => {
    fetchVentas()
  }, [])

  const fetchVentas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contratista/ventas')
      const data = await response.json()

      if (data.success) {
        setContratos(data.contratos)
        setEstadisticas(data.estadisticas)
      } else {
        toast.error('Error al cargar ventas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const formatearEstado = (estado: string) => {
    const estadoObj = ESTADOS_CONTRATO.find(e => e.value === estado)
    return estadoObj || { label: estado, color: 'bg-gray-100 text-gray-800', icon: Clock }
  }

  const formatearPrioridad = (prioridad: string) => {
    const prioridadObj = PRIORIDADES.find(p => p.value === prioridad)
    return prioridadObj || { label: prioridad, color: 'bg-gray-100 text-gray-800' }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  const contratosFiltrados = filtroEstado === 'todos'
    ? contratos
    : contratos.filter(c => c.estado === filtroEstado)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando ventas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Ventas</h1>
          <p className="text-muted-foreground">
            Seguimiento de todos tus contratos y comisiones
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchVentas}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={() => router.push('/contratista/generar-contrato')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generar Contrato
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contratos</p>
                  <p className="text-2xl font-bold">{estadisticas.totalContratos}</p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Finalizados</p>
                  <p className="text-2xl font-bold">{estadisticas.checkinRealizados}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comisiones Realizadas</p>
                  <p className="text-2xl font-bold">{formatCurrency(estadisticas.totalComisionesRealizadas)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comisiones Esperadas</p>
                  <p className="text-2xl font-bold">{formatCurrency(estadisticas.totalComisionesEsperadas)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y Tabla */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mis Contratos</CardTitle>
              <CardDescription>
                Lista de todos tus contratos generados y su estado actual
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS_CONTRATO.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {contratosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filtroEstado === 'todos' ? 'No tienes contratos' : 'No hay contratos con este estado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filtroEstado === 'todos'
                  ? 'Comienza generando tu primer contrato'
                  : 'Cambia el filtro para ver otros contratos'
                }
              </p>
              {filtroEstado === 'todos' && (
                <Button onClick={() => router.push('/contratista/generar-contrato')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generar Primer Contrato
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratosFiltrados.map((contrato) => {
                    const estado = formatearEstado(contrato.estado)
                    const prioridad = formatearPrioridad(contrato.prioridad)
                    const IconoEstado = estado.icon

                    return (
                      <TableRow key={contrato.id}>
                        <TableCell>
                          <div className="font-medium">#{contrato.numero}</div>
                          <div className="text-sm text-muted-foreground">ID: {contrato.id.slice(-8)}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contrato.nombreCliente}</div>
                            <div className="text-sm text-muted-foreground">{contrato.rutCliente}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {contrato.unidad ? (
                              <>
                                <div className="font-medium">
                                  {contrato.unidad.edificio.nombre} - {contrato.unidad.numero}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {contrato.unidad.edificio.direccion}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {contrato.unidad.tipoUnidad.nombre}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium">Unidad Manual</div>
                                <div className="text-sm text-muted-foreground">
                                  {contrato.unidadManual}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Sin comisión automática
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={estado.color}>
                            <IconoEstado className="w-3 h-3 mr-1" />
                            {estado.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={prioridad.color}>
                            {prioridad.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-mono font-medium">{formatCurrency(contrato.precioPesos)}</div>
                            <div className="text-sm text-muted-foreground">{contrato.precioUF} UF</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-medium text-green-600">
                            {formatCurrency(contrato.comisionAsesor)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contrato.unidad ? contrato.unidad.tipoUnidad.comision.nombre : 'Manual'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contrato.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}