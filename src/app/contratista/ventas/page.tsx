'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  XCircle,
  Filter,
  Edit,
  Search
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

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
}

interface Contrato {
  id: string
  codigoUnidad?: string
  totalContrato: number
  montoUf: number
  comision: number
  estado: 'ENTREGADO' | 'RESERVA_PAGADA' | 'APROBADO' | 'RECHAZADO'
  fechaPagoReserva?: string
  fechaPagoContrato?: string
  fechaCheckin?: string
  observaciones?: string
  cliente: Cliente | null
  unidad: Unidad | null
  edificio: {
    id: string
    nombre: string
    direccion: string
  } | null
  createdAt: string
  updatedAt: string
}

interface Estadisticas {
  totalContratos: number
  entregados: number
  reservaPagada: number
  aprobados: number
  rechazados: number
  totalComisionesEsperadas: number
  totalComisionesAprobadas: number
}

const ESTADOS_CONTRATO = [
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-blue-100 text-blue-800', icon: Clock },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada', color: 'bg-yellow-100 text-yellow-800', icon: Calendar },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800', icon: XCircle }
]

export default function ContratistaVentasPage() {
  const router = useRouter()
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  // Estados para filtros avanzados
  const [filtros, setFiltros] = useState({
    busqueda: '',
    edificio: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    montoMin: '',
    montoMax: ''
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // Estados para edición de contratos
  const [contratoEditando, setContratoEditando] = useState<Contrato | null>(null)
  const [editandoContrato, setEditandoContrato] = useState(false)
  const [datosEdicion, setDatosEdicion] = useState({
    estado: '',
    fechaPagoReserva: '',
    fechaPagoContrato: '',
    fechaCheckin: '',
    observaciones: ''
  })

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

  const abrirEdicionContrato = (contrato: Contrato) => {
    setContratoEditando(contrato)
    setDatosEdicion({
      estado: contrato.estado,
      fechaPagoReserva: contrato.fechaPagoReserva ? contrato.fechaPagoReserva.split('T')[0] : '',
      fechaPagoContrato: contrato.fechaPagoContrato ? contrato.fechaPagoContrato.split('T')[0] : '',
      fechaCheckin: contrato.fechaCheckin ? contrato.fechaCheckin.split('T')[0] : '',
      observaciones: contrato.observaciones || ''
    })
    setEditandoContrato(true)
  }

  const guardarEdicionContrato = async () => {
    if (!contratoEditando) return

    try {
      const response = await fetch(`/api/contratista/contratos/${contratoEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: datosEdicion.estado,
          fechaPagoReserva: datosEdicion.fechaPagoReserva || undefined,
          fechaPagoContrato: datosEdicion.fechaPagoContrato || undefined,
          fechaCheckin: datosEdicion.fechaCheckin || undefined,
          observaciones: datosEdicion.observaciones || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Contrato actualizado exitosamente')
        setEditandoContrato(false)
        setContratoEditando(null)
        fetchVentas() // Recargar la lista
      } else {
        toast.error(data.error || 'Error al actualizar contrato')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      edificio: 'todos',
      fechaDesde: '',
      fechaHasta: '',
      montoMin: '',
      montoMax: ''
    })
    setFiltroEstado('todos')
  }

  const contratosFiltrados = contratos.filter(contrato => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && contrato.estado !== filtroEstado) {
      return false
    }

    // Filtro por búsqueda (cliente, ID, código unidad)
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      const coincideBusqueda =
        contrato.cliente?.nombre.toLowerCase().includes(busqueda) ||
        contrato.cliente?.rut.toLowerCase().includes(busqueda) ||
        contrato.id.toLowerCase().includes(busqueda) ||
        contrato.codigoUnidad?.toLowerCase().includes(busqueda) ||
        (contrato.unidad?.numero.toLowerCase().includes(busqueda)) ||
        (contrato.unidad?.edificio.nombre.toLowerCase().includes(busqueda)) ||
        (contrato.edificio?.nombre.toLowerCase().includes(busqueda))

      if (!coincideBusqueda) return false
    }

    // Filtro por edificio
    if (filtros.edificio !== 'todos') {
      const edificioId = contrato.unidad?.edificio.id || contrato.edificio?.id
      if (edificioId !== filtros.edificio) {
        return false
      }
    }

    // Filtro por fecha de creación
    if (filtros.fechaDesde) {
      const fechaContrato = new Date(contrato.createdAt)
      const fechaDesde = new Date(filtros.fechaDesde)
      if (fechaContrato < fechaDesde) return false
    }

    if (filtros.fechaHasta) {
      const fechaContrato = new Date(contrato.createdAt)
      const fechaHasta = new Date(filtros.fechaHasta)
      fechaHasta.setHours(23, 59, 59, 999) // Incluir todo el día
      if (fechaContrato > fechaHasta) return false
    }

    // Filtro por monto
    if (filtros.montoMin) {
      const montoMin = parseFloat(filtros.montoMin)
      if (contrato.totalContrato < montoMin) return false
    }

    if (filtros.montoMax) {
      const montoMax = parseFloat(filtros.montoMax)
      if (contrato.totalContrato > montoMax) return false
    }

    return true
  })

  // Obtener lista única de edificios para el filtro
  const edificiosUnicos = contratos
    .map(c => c.unidad?.edificio || c.edificio)
    .filter(Boolean)
    .reduce((acc: any[], edificio: any) => {
      // Solo agregar si no existe un edificio con el mismo ID
      if (!acc.find(e => e.id === edificio.id)) {
        acc.push(edificio)
      }
      return acc
    }, [])

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
                  <p className="text-sm font-medium text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-bold">{estadisticas.aprobados}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comisiones Aprobadas</p>
                  <p className="text-2xl font-bold">{formatCurrency(estadisticas.totalComisionesAprobadas)}</p>
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
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, ID, unidad..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                  className="pl-9 w-[250px]"
                />
              </div>
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
              <Button
                variant="outline"
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              {(filtros.busqueda || filtroEstado !== 'todos' || filtros.edificio !== 'todos' ||
                filtros.fechaDesde || filtros.fechaHasta || filtros.montoMin || filtros.montoMax) && (
                <Button variant="ghost" onClick={limpiarFiltros}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Panel de Filtros Avanzados */}
        {mostrarFiltros && (
          <div className="px-6 pb-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edificio">Edificio</Label>
                <Select value={filtros.edificio} onValueChange={(value) => setFiltros({ ...filtros, edificio: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los edificios" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los edificios</SelectItem>
                    {edificiosUnicos.map((edificio: any) => (
                      <SelectItem key={edificio.id} value={edificio.id}>
                        {edificio.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaDesde">Fecha desde</Label>
                <Input
                  id="fechaDesde"
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => setFiltros({ ...filtros, fechaDesde: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaHasta">Fecha hasta</Label>
                <Input
                  id="fechaHasta"
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => setFiltros({ ...filtros, fechaHasta: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montoMin">Monto mínimo</Label>
                <Input
                  id="montoMin"
                  type="number"
                  placeholder="0"
                  value={filtros.montoMin}
                  onChange={(e) => setFiltros({ ...filtros, montoMin: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="montoMax">Monto máximo</Label>
                <Input
                  id="montoMax"
                  type="number"
                  placeholder="Sin límite"
                  value={filtros.montoMax}
                  onChange={(e) => setFiltros({ ...filtros, montoMax: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}

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
                    <TableHead>Unidad / Edificio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contratosFiltrados.map((contrato) => {
                    const estado = formatearEstado(contrato.estado)
                    const IconoEstado = estado.icon

                    return (
                      <TableRow key={contrato.id}>
                        <TableCell>
                          <div className="font-medium">#{contrato.id.slice(-8)}</div>
                          <div className="text-sm text-muted-foreground">
                            {contrato.codigoUnidad ? `Código: ${contrato.codigoUnidad}` : 'Sistema'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{contrato.cliente?.nombre || 'Cliente no disponible'}</div>
                            <div className="text-sm text-muted-foreground">{contrato.cliente?.rut || 'Sin RUT'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {contrato.unidad ? (
                              <>
                                <div className="font-medium">
                                  {contrato.unidad.edificio.nombre} - Unidad {contrato.unidad.numero}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {contrato.unidad.edificio.direccion}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {contrato.unidad.tipoUnidad.nombre}
                                </div>
                              </>
                            ) : contrato.edificio ? (
                              <>
                                <div className="font-medium">{contrato.edificio.nombre}</div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {contrato.edificio.direccion}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {contrato.codigoUnidad ? `Código manual: ${contrato.codigoUnidad}` : 'Contrato general'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium">Sin edificio especificado</div>
                                <div className="text-sm text-muted-foreground">
                                  {contrato.codigoUnidad || 'Contrato manual'}
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
                          <div>
                            <div className="font-mono font-medium">{formatCurrency(contrato.totalContrato)}</div>
                            <div className="text-sm text-muted-foreground">{contrato.montoUf} UF</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-medium text-green-600">
                            {formatCurrency(contrato.comision)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {contrato.unidad?.tipoUnidad.comision ? contrato.unidad.tipoUnidad.comision.nombre : 'Base'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(contrato.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEdicionContrato(contrato)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
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

      {/* Modal de Edición de Contrato */}
      <Dialog open={editandoContrato} onOpenChange={setEditandoContrato}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
            <DialogDescription>
              Modifica el estado y fechas del contrato #{contratoEditando?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="estadoEdicion">Estado del Contrato</Label>
              <Select value={datosEdicion.estado} onValueChange={(value) => setDatosEdicion({ ...datosEdicion, estado: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_CONTRATO.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaPagoReservaEdicion">Fecha Pago de Reserva</Label>
                <Input
                  id="fechaPagoReservaEdicion"
                  type="date"
                  value={datosEdicion.fechaPagoReserva}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, fechaPagoReserva: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaPagoContratoEdicion">Fecha Pago de Contrato</Label>
                <Input
                  id="fechaPagoContratoEdicion"
                  type="date"
                  value={datosEdicion.fechaPagoContrato}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, fechaPagoContrato: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaCheckinEdicion">Fecha Check-in</Label>
                <Input
                  id="fechaCheckinEdicion"
                  type="date"
                  value={datosEdicion.fechaCheckin}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, fechaCheckin: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacionesEdicion">Observaciones</Label>
              <Input
                id="observacionesEdicion"
                value={datosEdicion.observaciones}
                onChange={(e) => setDatosEdicion({ ...datosEdicion, observaciones: e.target.value })}
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setEditandoContrato(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicionContrato}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}