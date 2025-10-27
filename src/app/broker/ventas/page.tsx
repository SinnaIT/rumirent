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

interface ReglaComision {
  id: string
  cantidadMinima: number
  cantidadMaxima: number | null
  porcentaje: number
  comision: {
    id: string
    nombre: string
    codigo: string
  }
}

interface ComisionBase {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
}

interface Lead {
  id: string
  codigoUnidad?: string
  totalLead: number
  montoUf: number
  comision: number
  estado: 'ENTREGADO' | 'RESERVA_PAGADA' | 'APROBADO' | 'RECHAZADO'
  fechaPagoReserva?: string
  fechaPagoLead?: string
  fechaCheckin?: string
  observaciones?: string
  cliente: Cliente | null
  unidad: Unidad | null
  edificio: {
    id: string
    nombre: string
    direccion: string
  } | null
  reglaComision?: ReglaComision
  comisionBase?: ComisionBase
  createdAt: string
  updatedAt: string
}

interface Estadisticas {
  totalLeads: number
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

export default function BrokerVentasPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
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

  // Estados para edición de leads
  const [leadEditando, setLeadEditando] = useState<Lead | null>(null)
  const [editandoLead, setEditandoLead] = useState(false)
  const [datosEdicion, setDatosEdicion] = useState({
    estado: '',
    fechaPagoReserva: '',
    fechaPagoLead: '',
    fechaCheckin: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchVentas()
  }, [])

  const fetchVentas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/broker/ventas')
      const data = await response.json()

      if (data.success) {
        setLeads(data.leads)
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

  const abrirEdicionLead = (lead: Lead) => {
    setLeadEditando(lead)
    setDatosEdicion({
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva ? lead.fechaPagoReserva.split('T')[0] : '',
      fechaPagoLead: lead.fechaPagoLead ? lead.fechaPagoLead.split('T')[0] : '',
      fechaCheckin: lead.fechaCheckin ? lead.fechaCheckin.split('T')[0] : '',
      observaciones: lead.observaciones || ''
    })
    setEditandoLead(true)
  }

  const guardarEdicionLead = async () => {
    if (!leadEditando) return

    try {
      const response = await fetch(`/api/broker/leads/${leadEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: datosEdicion.estado,
          fechaPagoReserva: datosEdicion.fechaPagoReserva || undefined,
          fechaPagoLead: datosEdicion.fechaPagoLead || undefined,
          fechaCheckin: datosEdicion.fechaCheckin || undefined,
          observaciones: datosEdicion.observaciones || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Lead actualizado exitosamente')
        setEditandoLead(false)
        setLeadEditando(null)
        fetchVentas() // Recargar la lista
      } else {
        toast.error(data.error || 'Error al actualizar lead')
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

  const leadsFiltrados = leads.filter(lead => {
    // Filtro por estado
    if (filtroEstado !== 'todos' && lead.estado !== filtroEstado) {
      return false
    }

    // Filtro por búsqueda (cliente, ID, código unidad)
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      const coincideBusqueda =
        lead.cliente?.nombre.toLowerCase().includes(busqueda) ||
        lead.cliente?.rut.toLowerCase().includes(busqueda) ||
        lead.id.toLowerCase().includes(busqueda) ||
        lead.codigoUnidad?.toLowerCase().includes(busqueda) ||
        (lead.unidad?.numero.toLowerCase().includes(busqueda)) ||
        (lead.unidad?.edificio.nombre.toLowerCase().includes(busqueda)) ||
        (lead.edificio?.nombre.toLowerCase().includes(busqueda))

      if (!coincideBusqueda) return false
    }

    // Filtro por edificio
    if (filtros.edificio !== 'todos') {
      const edificioId = lead.unidad?.edificio.id || lead.edificio?.id
      if (edificioId !== filtros.edificio) {
        return false
      }
    }

    // Filtro por fecha de creación
    if (filtros.fechaDesde) {
      const fechaLead = new Date(lead.createdAt)
      const fechaDesde = new Date(filtros.fechaDesde)
      if (fechaLead < fechaDesde) return false
    }

    if (filtros.fechaHasta) {
      const fechaLead = new Date(lead.createdAt)
      const fechaHasta = new Date(filtros.fechaHasta)
      fechaHasta.setHours(23, 59, 59, 999) // Incluir todo el día
      if (fechaLead > fechaHasta) return false
    }

    // Filtro por monto
    if (filtros.montoMin) {
      const montoMin = parseFloat(filtros.montoMin)
      if (lead.totalLead < montoMin) return false
    }

    if (filtros.montoMax) {
      const montoMax = parseFloat(filtros.montoMax)
      if (lead.totalLead > montoMax) return false
    }

    return true
  })

  // Obtener lista única de edificios para el filtro
  const edificiosUnicos = leads
    .map(c => c.unidad?.edificio || c.edificio)
    .filter(Boolean)
    .reduce((acc: Array<{ id: string; nombre: string }>, edificio: { id: string; nombre: string }) => {
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
          <p className="mt-2 text-muted-foreground">Cargando Prospectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Prospectos</h1>
          <p className="text-muted-foreground">
            Seguimiento de todos tus leads y comisiones
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
            onClick={() => router.push('/broker/generar-lead')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generar Lead
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
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{estadisticas.totalLeads}</p>
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
              <CardTitle>Mis Leads</CardTitle>
              <CardDescription>
                Lista de todos tus leads generados y su estado actual
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
                    {edificiosUnicos.map((edificio) => (
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
          {leadsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filtroEstado === 'todos' ? 'No tienes leads' : 'No hay leads con este estado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filtroEstado === 'todos'
                  ? 'Comienza generando tu primer lead'
                  : 'Cambia el filtro para ver otros leads'
                }
              </p>
              {filtroEstado === 'todos' && (
                <Button onClick={() => router.push('/broker/generar-lead')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generar Primer Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Acciones</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Unidad / Edificio</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsFiltrados.map((lead) => {
                    const estado = formatearEstado(lead.estado)
                    const IconoEstado = estado.icon

                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirEdicionLead(lead)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.cliente?.nombre || 'Cliente no disponible'}</div>
                            <div className="text-sm text-muted-foreground">{lead.cliente?.rut || 'Sin RUT'}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {lead.unidad ? (
                              <>
                                <div className="font-medium">
                                  {lead.unidad.edificio.nombre} - Unidad {lead.unidad.numero}
                                </div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {lead.unidad.edificio.direccion}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lead.unidad.tipoUnidad.nombre}
                                </div>
                              </>
                            ) : lead.edificio ? (
                              <>
                                <div className="font-medium">{lead.edificio.nombre}</div>
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {lead.edificio.direccion}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lead.codigoUnidad ? `Código manual: ${lead.codigoUnidad}` : 'Lead general'}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="font-medium">Sin edificio especificado</div>
                                <div className="text-sm text-muted-foreground">
                                  {lead.codigoUnidad || 'Lead manual'}
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
                            <div className="font-mono font-medium">{formatCurrency(lead.totalLead)}</div>
                            <div className="text-sm text-muted-foreground">{lead.montoUf} UF</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-medium text-green-600">
                            {formatCurrency(lead.comision)}
                          </div>
                          {lead.reglaComision ? (
                            <div className="text-xs space-y-1 mt-1 p-2 bg-green-50 rounded border">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-green-800">Regla Aplicada:</span>
                                <span className="text-green-700 font-medium">{(lead.reglaComision.porcentaje * 100).toFixed(1)}%</span>
                              </div>
                              <div className="text-green-700">
                                {lead.reglaComision.comision.nombre}
                              </div>
                              <div className="text-green-600 text-[10px]">
                                Cálculo: {formatCurrency(lead.totalLead)} × {(lead.reglaComision.porcentaje * 100).toFixed(1)}%
                              </div>
                              <div className="text-green-600 text-[10px]">
                                Rango: {lead.reglaComision.cantidadMinima}+
                                {lead.reglaComision.cantidadMaxima && ` - ${lead.reglaComision.cantidadMaxima}`} leads
                              </div>
                            </div>
                          ) : lead.comisionBase ? (
                            <div className="text-xs mt-1 p-2 bg-blue-50 rounded border">
                              <div className="text-blue-700 font-medium">
                                {lead.comisionBase.nombre}
                              </div>
                              <div className="text-blue-600 text-[10px]">
                                Base: {(lead.comisionBase.porcentaje * 100).toFixed(1)}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs mt-1 p-2 bg-gray-50 rounded border">
                              <div className="text-gray-600 font-medium">
                                {lead.unidad?.tipoUnidad.comision ? lead.unidad.tipoUnidad.comision.nombre : 'Comisión Base'}
                              </div>
                              <div className="text-gray-500 text-[10px]">
                                Sin reglas aplicadas
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString('es-ES')}
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

      {/* Modal de Edición de Lead */}
      <Dialog open={editandoLead} onOpenChange={setEditandoLead}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Modifica el estado y fechas del lead #{leadEditando?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="estadoEdicion">Estado del Lead</Label>
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
                <Label htmlFor="fechaPagoReservaEdicion">
                  Fecha Pago de Reserva
                  {leadEditando?.fechaPagoReserva && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (No se puede modificar después de guardada)
                    </span>
                  )}
                </Label>
                <Input
                  id="fechaPagoReservaEdicion"
                  type="date"
                  value={datosEdicion.fechaPagoReserva}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, fechaPagoReserva: e.target.value })}
                  disabled={leadEditando?.fechaPagoReserva !== null && leadEditando?.fechaPagoReserva !== undefined}
                  className={leadEditando?.fechaPagoReserva ? "bg-muted cursor-not-allowed opacity-60" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaPagoLeadEdicion">
                  Fecha Pago de Lead
                  {leadEditando?.fechaPagoLead && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (No se puede modificar después de guardada)
                    </span>
                  )}
                </Label>
                <Input
                  id="fechaPagoLeadEdicion"
                  type="date"
                  value={datosEdicion.fechaPagoLead}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, fechaPagoLead: e.target.value })}
                  disabled={leadEditando?.fechaPagoLead !== null && leadEditando?.fechaPagoLead !== undefined}
                  className={leadEditando?.fechaPagoLead ? "bg-muted cursor-not-allowed opacity-60" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaCheckinEdicion">
                  Fecha Check-in
                  {leadEditando?.fechaCheckin && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (No se puede modificar después de guardada)
                    </span>
                  )}
                </Label>
                <Input
                  id="fechaCheckinEdicion"
                  type="date"
                  value={datosEdicion.fechaCheckin}
                  onChange={(e) => setDatosEdicion({ ...datosEdicion, fechaCheckin: e.target.value })}
                  disabled={leadEditando?.fechaCheckin !== null && leadEditando?.fechaCheckin !== undefined}
                  className={leadEditando?.fechaCheckin ? "bg-muted cursor-not-allowed opacity-60" : ""}
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
            <Button variant="outline" onClick={() => setEditandoLead(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarEdicionLead}>
              Guardar Cambios
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}