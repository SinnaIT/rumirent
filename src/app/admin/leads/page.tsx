'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  FileText,
  Search,
  RefreshCw,
  Edit,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle
} from 'lucide-react'

interface Broker {
  id: string
  nombre: string
  email: string
  rut: string
}

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
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
  tipoUnidadEdificio?: {
    id: string
    nombre: string
    codigo: string
  }
}

interface Edificio {
  id: string
  nombre: string
  direccion: string
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
  postulacion?: string
  observaciones?: string
  conciliado: boolean
  fechaConciliacion?: string
  broker: Broker
  cliente: Cliente
  unidad?: Unidad
  edificio: Edificio
  reglaComision?: ReglaComision
  createdAt: string
  updatedAt: string
}

const ESTADOS_LEAD = [
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-blue-100 text-blue-800' },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800' }
]

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [reglasComision, setReglasComision] = useState<ReglaComision[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBroker, setSelectedBroker] = useState('todos')
  const [selectedCliente, setSelectedCliente] = useState('todos')
  const [selectedEstado, setSelectedEstado] = useState('todos')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    codigoUnidad: '',
    totalLead: '',
    montoUf: '',
    comision: '',
    estado: 'ENTREGADO' as const,
    fechaPagoReserva: '',
    fechaPagoLead: '',
    fechaCheckin: '',
    postulacion: '',
    observaciones: '',
    conciliado: false,
    brokerId: '',
    clienteId: '',
    reglaComisionId: ''
  })

  useEffect(() => {
    fetchLeads()
    fetchBrokers()
    fetchClientes()
    fetchReglasComision()
  }, [])

  useEffect(() => {
    // Aplicar filtros
    let filtered = leads

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(lead =>
        lead.broker.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cliente.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.codigoUnidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.edificio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.unidad?.numero.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por broker
    if (selectedBroker !== 'todos') {
      filtered = filtered.filter(lead => lead.broker.id === selectedBroker)
    }

    // Filtro por cliente
    if (selectedCliente !== 'todos') {
      filtered = filtered.filter(lead => lead.cliente.id === selectedCliente)
    }

    // Filtro por estado
    if (selectedEstado !== 'todos') {
      filtered = filtered.filter(lead => lead.estado === selectedEstado)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, selectedBroker, selectedCliente, selectedEstado])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedBroker !== 'todos') params.append('brokerId', selectedBroker)
      if (selectedCliente !== 'todos') params.append('clienteId', selectedCliente)
      if (selectedEstado !== 'todos') params.append('estado', selectedEstado)

      const response = await fetch(`/api/admin/leads?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setLeads(data.leads)
      } else {
        toast.error('Error al cargar leads')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrokers = async () => {
    try {
      const response = await fetch('/api/admin/brokers')
      const data = await response.json()

      if (data.success) {
        setBrokers(data.brokers)
      } else {
        console.error('Error al cargar brokers:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch('/api/admin/clientes')
      const data = await response.json()

      if (data.success) {
        setClientes(data.clientes)
      } else {
        console.error('Error al cargar clientes:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchReglasComision = async () => {
    try {
      const response = await fetch('/api/admin/comisiones/reglas')
      const data = await response.json()

      if (data.success) {
        setReglasComision(data.reglas)
      } else {
        console.error('Error al cargar reglas de comisión:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      codigoUnidad: '',
      totalLead: '',
      montoUf: '',
      comision: '',
      estado: 'ENTREGADO',
      fechaPagoReserva: '',
      fechaPagoLead: '',
      fechaCheckin: '',
      postulacion: '',
      observaciones: '',
      conciliado: false,
      brokerId: '',
      clienteId: '',
      reglaComisionId: 'none'
    })
    setEditingLead(null)
  }

  const handleOpenEditDialog = (lead: Lead) => {
    setFormData({
      codigoUnidad: lead.codigoUnidad || '',
      totalLead: lead.totalLead.toString(),
      montoUf: lead.montoUf.toString(),
      comision: lead.comision.toString(),
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva ? lead.fechaPagoReserva.substring(0, 10) : '',
      fechaPagoLead: lead.fechaPagoLead ? lead.fechaPagoLead.substring(0, 10) : '',
      fechaCheckin: lead.fechaCheckin ? lead.fechaCheckin.substring(0, 10) : '',
      postulacion: lead.postulacion || '',
      observaciones: lead.observaciones || '',
      conciliado: lead.conciliado,
      brokerId: lead.broker.id,
      clienteId: lead.cliente.id,
      reglaComisionId: lead.reglaComision?.id || 'none'
    })
    setEditingLead(lead)
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.totalLead || !formData.montoUf || !formData.brokerId || !formData.clienteId) {
      toast.error('Total lead, monto UF, broker y cliente son requeridos')
      return
    }

    if (!editingLead) {
      toast.error('Error: no hay lead seleccionado para editar')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          reglaComisionId: formData.reglaComisionId === 'none' ? null : formData.reglaComisionId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsEditDialogOpen(false)
        resetForm()
        fetchLeads()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const formatearEstado = (estado: string) => {
    const estadoObj = ESTADOS_LEAD.find(e => e.value === estado)
    return estadoObj || { label: estado, color: 'bg-gray-100 text-gray-800' }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value)
  }

  const formatUF = (value: number) => {
    return `${value.toFixed(2)} UF`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Leads</h1>
          <p className="text-muted-foreground">
            Administra todos los leads del sistema con filtros avanzados
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchLeads}
          disabled={loading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      {leads.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{leads.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Aprobados</p>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.estado === 'APROBADO').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(leads.reduce((sum, l) => sum + l.totalLead, 0))}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Conciliados</p>
                  <p className="text-2xl font-bold">
                    {leads.filter(l => l.conciliado).length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <div>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los brokers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los brokers</SelectItem>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los clientes</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {ESTADOS_LEAD.map((estado) => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedBroker('todos')
                setSelectedCliente('todos')
                setSelectedEstado('todos')
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Registrados</CardTitle>
          <CardDescription>
            Lista de todos los leads con filtros aplicados
            {(searchTerm || selectedBroker !== 'todos' || selectedCliente !== 'todos' || selectedEstado !== 'todos') &&
              ` (${filteredLeads.length} de ${leads.length} leads)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {leads.length === 0 ? 'No hay leads registrados' : 'No se encontraron leads'}
              </h3>
              <p className="text-muted-foreground">
                {leads.length === 0
                  ? 'Los leads serán creados por los brokers al generar ventas'
                  : 'Intenta con otros filtros de búsqueda'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Proyecto/Unidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const estado = formatearEstado(lead.estado)
                    return (
                      <TableRow key={lead.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lead.cliente.nombre}</div>
                            <div className="text-sm text-muted-foreground">{lead.cliente.rut}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{lead.broker.nombre}</div>
                            <div className="text-xs text-muted-foreground">{lead.broker.rut}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">{lead.edificio.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {lead.unidad ? `Unidad ${lead.unidad.numero}` : lead.codigoUnidad}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={estado.color}>
                            {estado.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{formatCurrency(lead.totalLead)}</div>
                            <div className="text-sm text-muted-foreground">{formatUF(lead.montoUf)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {formatCurrency(lead.comision)}
                            </div>
                            {lead.reglaComision && (
                              <div className="text-xs text-muted-foreground">
                                Regla: {lead.reglaComision.comision.codigo} ({(lead.reglaComision.porcentaje * 100).toFixed(1)}%)
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(lead.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isEditDialogOpen && editingLead?.id === lead.id} onOpenChange={(open) => {
                            if (!open) {
                              setIsEditDialogOpen(false)
                              resetForm()
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditDialog(lead)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <FileText className="w-5 h-5 mr-2" />
                                  Editar Lead
                                </DialogTitle>
                                <DialogDescription>
                                  Modifica los datos del lead. Todos los campos son editables.
                                </DialogDescription>
                              </DialogHeader>

                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="broker">Broker *</Label>
                                    <Select value={formData.brokerId} onValueChange={(value: string) => setFormData({ ...formData, brokerId: value })}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar broker" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {brokers.map((broker) => (
                                          <SelectItem key={broker.id} value={broker.id}>
                                            {broker.nombre} - {broker.rut}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="cliente">Cliente *</Label>
                                    <Select value={formData.clienteId} onValueChange={(value: string) => setFormData({ ...formData, clienteId: value })}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar cliente" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {clientes.map((cliente) => (
                                          <SelectItem key={cliente.id} value={cliente.id}>
                                            {cliente.nombre} - {cliente.rut}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="codigoUnidad">Código Unidad</Label>
                                    <Input
                                      id="codigoUnidad"
                                      value={formData.codigoUnidad}
                                      onChange={(e) => setFormData({ ...formData, codigoUnidad: e.target.value })}
                                      placeholder="Ej: A-101"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="estado">Estado</Label>
                                    <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {ESTADOS_LEAD.map((estado) => (
                                          <SelectItem key={estado.value} value={estado.value}>
                                            {estado.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="totalLead">Total Lead (CLP) *</Label>
                                    <Input
                                      id="totalLead"
                                      type="number"
                                      value={formData.totalLead}
                                      onChange={(e) => setFormData({ ...formData, totalLead: e.target.value })}
                                      placeholder="150000000"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="montoUf">Monto UF *</Label>
                                    <Input
                                      id="montoUf"
                                      type="number"
                                      step="0.01"
                                      value={formData.montoUf}
                                      onChange={(e) => setFormData({ ...formData, montoUf: e.target.value })}
                                      placeholder="4500.50"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="comision">Comisión (CLP)</Label>
                                    <Input
                                      id="comision"
                                      type="number"
                                      value={formData.comision}
                                      onChange={(e) => setFormData({ ...formData, comision: e.target.value })}
                                      placeholder="7500000"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  <Label htmlFor="reglaComision">Regla de Comisión (Opcional)</Label>
                                  <Select
                                    value={formData.reglaComisionId}
                                    onValueChange={(value: string) => setFormData({ ...formData, reglaComisionId: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccionar regla de comisión" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Sin regla específica</SelectItem>
                                      {reglasComision
                                        .sort((a, b) => a.comision.nombre.localeCompare(b.comision.nombre) || a.cantidadMinima - b.cantidadMinima)
                                        .map((regla) => (
                                          <SelectItem key={regla.id} value={regla.id}>
                                            {regla.comision.nombre} ({regla.comision.codigo}) - {(regla.porcentaje * 100).toFixed(1)}%
                                            (${regla.cantidadMinima.toLocaleString()}{regla.cantidadMaxima ? ` - $${regla.cantidadMaxima.toLocaleString()}` : '+'})
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  {formData.reglaComisionId && formData.reglaComisionId !== 'none' && (
                                    <div className="text-xs text-muted-foreground">
                                      💡 Esta regla puede recalcular automáticamente la comisión según el monto del lead
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="fechaPagoReserva">Fecha Pago Reserva</Label>
                                    <Input
                                      id="fechaPagoReserva"
                                      type="date"
                                      value={formData.fechaPagoReserva}
                                      onChange={(e) => setFormData({ ...formData, fechaPagoReserva: e.target.value })}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="fechaPagoLead">Fecha Pago Lead</Label>
                                    <Input
                                      id="fechaPagoLead"
                                      type="date"
                                      value={formData.fechaPagoLead}
                                      onChange={(e) => setFormData({ ...formData, fechaPagoLead: e.target.value })}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="fechaCheckin">Fecha Check-in</Label>
                                    <Input
                                      id="fechaCheckin"
                                      type="date"
                                      value={formData.fechaCheckin}
                                      onChange={(e) => setFormData({ ...formData, fechaCheckin: e.target.value })}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  <Label htmlFor="postulacion">Postulación</Label>
                                  <Input
                                    id="postulacion"
                                    value={formData.postulacion}
                                    onChange={(e) => setFormData({ ...formData, postulacion: e.target.value })}
                                    placeholder="Información sobre postulación..."
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  <Label htmlFor="observaciones">Observaciones</Label>
                                  <Textarea
                                    id="observaciones"
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    placeholder="Observaciones adicionales..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="conciliado"
                                    checked={formData.conciliado}
                                    onCheckedChange={(checked) => setFormData({ ...formData, conciliado: checked as boolean })}
                                  />
                                  <Label htmlFor="conciliado">Lead conciliado</Label>
                                </div>
                              </div>

                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setIsEditDialogOpen(false)
                                    resetForm()
                                  }}
                                  disabled={saving}
                                >
                                  Cancelar
                                </Button>
                                <Button onClick={handleSubmit} disabled={saving}>
                                  {saving ? 'Guardando...' : 'Actualizar Lead'}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
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