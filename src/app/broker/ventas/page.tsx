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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Calculator,
  RefreshCw,
  Plus,
  MapPin,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Edit,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  CreditCard,
  Building2,
  MessageCircle
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
  estado: 'INGRESADO' | 'EN_EVALUACION' | 'OBSERVADO' | 'APROBADO' | 'RESERVA_PAGADA' | 'CONTRATO_FIRMADO' | 'CONTRATO_PAGADO' | 'DEPARTAMENTO_ENTREGADO' | 'RECHAZADO' | 'ENTREGADO' // Include ENTREGADO for backward compatibility
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

interface ClienteAgrupado {
  cliente: Cliente
  leads: Lead[]
  totalReservas: number
  totalMonto: number
  totalComisiones: number
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
  { value: 'INGRESADO', label: 'Ingresado', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock },
  { value: 'EN_EVALUACION', label: 'En Evaluación', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  { value: 'OBSERVADO', label: 'Observado', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  { value: 'CONTRATO_FIRMADO', label: 'Contrato Firmado', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: CheckCircle },
  { value: 'CONTRATO_PAGADO', label: 'Contrato Pagado', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle },
  { value: 'DEPARTAMENTO_ENTREGADO', label: 'Departamento Entregado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle },
  { value: 'ENTREGADO', label: 'Entregado (Legacy)', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle }, // Backward compatibility
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
]

export default function BrokerVentasPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null)
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

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
    return estadoObj || { label: estado, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
        toast.success('Prospecto actualizado exitosamente')
        setEditandoLead(false)
        setLeadEditando(null)
        fetchVentas() // Recargar la lista
      } else {
        toast.error(data.error || 'Error al actualizar prospecto')
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

  const toggleClient = (clienteId: string) => {
    const newExpandedClients = new Set(expandedClients)
    if (newExpandedClients.has(clienteId)) {
      newExpandedClients.delete(clienteId)
    } else {
      newExpandedClients.add(clienteId)
    }
    setExpandedClients(newExpandedClients)
  }

  const handleSendWhatsApp = (telefono: string) => {
    const phoneNumber = telefono.replace(/\D/g, '')
    window.open(`https://wa.me/${phoneNumber}`, '_blank')
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

  // Agrupar leads por cliente
  const clientesAgrupados = leadsFiltrados.reduce((acc: ClienteAgrupado[], lead) => {
    if (!lead.cliente) return acc

    const existingCliente = acc.find(c => c.cliente.id === lead.cliente!.id)

    if (existingCliente) {
      existingCliente.leads.push(lead)
      existingCliente.totalReservas++
      existingCliente.totalMonto += lead.totalLead
      existingCliente.totalComisiones += lead.comision
    } else {
      acc.push({
        cliente: lead.cliente,
        leads: [lead],
        totalReservas: 1,
        totalMonto: lead.totalLead,
        totalComisiones: lead.comision
      })
    }

    return acc
  }, [])

  // Ordenar por total de comisiones descendente
  clientesAgrupados.sort((a, b) => b.totalComisiones - a.totalComisiones)

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
            Vista agrupada por cliente - Seguimiento de reservas y comisiones
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
                  <p className="text-sm font-medium text-muted-foreground">Total Prospectos</p>
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

      {/* Filtros y Vista Agrupada */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Prospectos por Cliente</CardTitle>
              <CardDescription>
                Vista agrupada mostrando todas las reservas de cada cliente
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
          {clientesAgrupados.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {filtroEstado === 'todos' ? 'No tienes prospectos' : 'No hay prospectos con este estado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {filtroEstado === 'todos'
                  ? 'Comienza generando tu primer lead'
                  : 'Cambia el filtro para ver otros prospectos'
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
            <div className="space-y-2">
              {clientesAgrupados.map((clienteAgrupado) => {
                const isExpanded = expandedClients.has(clienteAgrupado.cliente.id)

                return (
                  <div key={clienteAgrupado.cliente.id} className="border rounded-lg overflow-hidden">
                    {/* Fila de resumen del cliente */}
                    <div
                      className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => toggleClient(clienteAgrupado.cliente.id)}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-base">{clienteAgrupado.cliente.nombre}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <CreditCard className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{clienteAgrupado.cliente.rut}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Reservas</p>
                            <p className="text-lg font-bold">{clienteAgrupado.totalReservas}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Monto Total</p>
                            <p className="text-lg font-bold">{formatCurrency(clienteAgrupado.totalMonto)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Comisiones</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(clienteAgrupado.totalComisiones)}</p>
                          </div>
                        </div>

                        {clienteAgrupado.cliente.telefono && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSendWhatsApp(clienteAgrupado.cliente.telefono!)
                            }}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Lista expandible de reservas */}
                    {isExpanded && (
                      <div className="p-4 bg-background">
                        <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Historial de Reservas ({clienteAgrupado.leads.length})
                        </h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Edificio / Unidad</TableHead>
                              <TableHead className="text-xs">Estado</TableHead>
                              <TableHead className="text-xs text-right">Total</TableHead>
                              <TableHead className="text-xs text-right">Comisión</TableHead>
                              <TableHead className="text-xs text-center">Check-in</TableHead>
                              <TableHead className="text-xs">Fecha Creación</TableHead>
                              <TableHead className="text-xs text-center">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {clienteAgrupado.leads.map((lead) => {
                              const estado = formatearEstado(lead.estado)
                              const IconoEstado = estado.icon

                              return (
                                <TableRow key={lead.id} className="text-xs">
                                  <TableCell>
                                    {lead.unidad ? (
                                      <>
                                        <div className="font-medium">
                                          {lead.unidad.edificio.nombre}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          Unidad {lead.unidad.numero} - {lead.unidad.tipoUnidad.nombre}
                                        </div>
                                      </>
                                    ) : lead.edificio ? (
                                      <>
                                        <div className="font-medium">{lead.edificio.nombre}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {lead.codigoUnidad ? `Código: ${lead.codigoUnidad}` : 'Lead general'}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-muted-foreground">Sin edificio</div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={estado.color}>
                                      <IconoEstado className="w-3 h-3 mr-1" />
                                      {estado.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="font-medium">{formatCurrency(lead.totalLead)}</div>
                                    <div className="text-xs text-muted-foreground">{lead.montoUf} UF</div>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="font-medium text-primary">{formatCurrency(lead.comision)}</div>
                                    {lead.reglaComision && (
                                      <div className="text-xs text-muted-foreground">
                                        {(lead.reglaComision.porcentaje * 100).toFixed(1)}%
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {lead.fechaCheckin ? '✓' : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {formatDate(lead.createdAt)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => abrirEdicionLead(lead)}
                                    >
                                      <Edit className="w-3 h-3 mr-1" />
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
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición de Lead */}
      <Dialog open={editandoLead} onOpenChange={setEditandoLead}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Prospecto</DialogTitle>
            <DialogDescription>
              Modifica el estado y fechas del prospecto #{leadEditando?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="estadoEdicion">Estado del Prospecto</Label>
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
                      (No se puede modificar)
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
                  Fecha Pago de Prospecto
                  {leadEditando?.fechaPagoLead && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (No se puede modificar)
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
                      (No se puede modificar)
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
