'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableHead } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  FileText,
  Search,
  RefreshCw,
  Edit,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  Calculator,
  MessageCircle,
  Mail,
  Eye
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
  estado: 'INGRESADO' | 'ENTREGADO' | 'EN_EVALUACION' | 'OBSERVADO' | 'APROBADO' | 'RESERVA_PAGADA' | 'CONTRATO_FIRMADO' | 'CONTRATO_PAGADO' | 'DEPARTAMENTO_ENTREGADO' | 'RECHAZADO' | 'CANCELADO'
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
  comisionBase?: ComisionBase
  createdAt: string
  updatedAt: string
}

const ESTADOS_LEAD = [
  { value: 'INGRESADO', label: 'Ingresado', color: 'bg-slate-100 text-slate-800' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-blue-100 text-blue-800' },
  { value: 'EN_EVALUACION', label: 'En Evaluación', color: 'bg-purple-100 text-purple-800' },
  { value: 'OBSERVADO', label: 'Observado', color: 'bg-orange-100 text-orange-800' },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONTRATO_FIRMADO', label: 'Contrato Firmado', color: 'bg-teal-100 text-teal-800' },
  { value: 'CONTRATO_PAGADO', label: 'Contrato Pagado', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'DEPARTAMENTO_ENTREGADO', label: 'Departamento Entregado', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
]

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [reglasComision, setReglasComision] = useState<ReglaComision[]>([])
  const [comisiones, setComisiones] = useState<ComisionBase[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [recalculando, setRecalculando] = useState(false)
  const [showRecalculationDialog, setShowRecalculationDialog] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => (new Date().getMonth() + 1).toString())
  const [selectedYear, setSelectedYear] = useState<string>(() => new Date().getFullYear().toString())
  const [searchField, setSearchField] = useState('cliente')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBroker, setSelectedBroker] = useState('todos')
  const [selectedCliente, setSelectedCliente] = useState('todos')
  const [selectedEstado, setSelectedEstado] = useState('todos')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    codigoUnidad: string
    totalLead: string
    montoUf: string
    comision: string
    estado: 'INGRESADO' | 'ENTREGADO' | 'EN_EVALUACION' | 'OBSERVADO' | 'APROBADO' | 'RESERVA_PAGADA' | 'CONTRATO_FIRMADO' | 'CONTRATO_PAGADO' | 'DEPARTAMENTO_ENTREGADO' | 'RECHAZADO' | 'CANCELADO'
    fechaPagoReserva: string
    fechaPagoLead: string
    fechaCheckin: string
    postulacion: string
    observaciones: string
    conciliado: boolean
    brokerId: string
    clienteId: string
    reglaComisionId: string
    comisionId: string
  }>({
    codigoUnidad: '',
    totalLead: '',
    montoUf: '',
    comision: '',
    estado: 'INGRESADO',
    fechaPagoReserva: '',
    fechaPagoLead: '',
    fechaCheckin: '',
    postulacion: '',
    observaciones: '',
    conciliado: false,
    brokerId: 'none',
    clienteId: 'none',
    reglaComisionId: 'none',
    comisionId: 'none'
  })

  useEffect(() => {
    fetchLeads()
    fetchBrokers()
    fetchClientes()
    fetchReglasComision()
    fetchComisiones()
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

  const recalcularComisiones = async () => {
    try {
      setRecalculando(true)
      setShowRecalculationDialog(false)

      const response = await fetch('/api/admin/leads/recalcular-comisiones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mes: selectedMonth,
          año: selectedYear
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        // Recargar los leads para mostrar las comisiones actualizadas
        await fetchLeads()

        // Mostrar estadísticas del proceso
        const stats = data.estadisticas
        toast.success(`Proceso completado: ${stats.leadsActualizados} de ${stats.leadsEncontrados} leads procesados`)
      } else {
        toast.error(data.error || 'Error al recalcular comisiones')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al recalcular comisiones')
    } finally {
      setRecalculando(false)
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

  const fetchComisiones = async () => {
    try {
      const response = await fetch('/api/admin/comisiones')
      const data = await response.json()

      if (data.success) {
        setComisiones(data.comisiones)
      } else {
        console.error('Error al cargar comisiones:', data.error)
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
      estado: 'INGRESADO',
      fechaPagoReserva: '',
      fechaPagoLead: '',
      fechaCheckin: '',
      postulacion: '',
      observaciones: '',
      conciliado: false,
      brokerId: 'none',
      clienteId: 'none',
      reglaComisionId: 'none',
      comisionId: 'none'
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
      brokerId: (lead.broker?.id && lead.broker.id.trim() !== '') ? lead.broker.id : 'none',
      clienteId: (lead.cliente?.id && lead.cliente.id.trim() !== '') ? lead.cliente.id : 'none',
      reglaComisionId: (lead.reglaComision?.id && lead.reglaComision.id.trim() !== '') ? lead.reglaComision.id : 'none',
      comisionId: (lead.comisionBase?.id && lead.comisionBase.id.trim() !== '') ? lead.comisionBase.id : 'none'
    })
    setEditingLead(lead)
    setIsEditDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.totalLead || !formData.montoUf || !formData.brokerId || formData.brokerId === 'none' || !formData.clienteId || formData.clienteId === 'none') {
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
          brokerId: formData.brokerId === 'none' ? null : formData.brokerId,
          clienteId: formData.clienteId === 'none' ? null : formData.clienteId,
          reglaComisionId: formData.reglaComisionId === 'none' ? null : formData.reglaComisionId,
          comisionId: formData.comisionId === 'none' ? null : formData.comisionId
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

  const handleWhatsApp = (cliente: Cliente) => {
    if (!cliente.telefono) {
      toast.error('El cliente no tiene teléfono registrado')
      return
    }
    // Formato chileno: eliminar caracteres no numéricos y agregar código de país
    const phone = cliente.telefono.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/56${phone}`
    window.open(whatsappUrl, '_blank')
  }

  const handleEmail = (cliente: Cliente) => {
    if (!cliente.email) {
      toast.error('El cliente no tiene email registrado')
      return
    }
    const mailtoUrl = `mailto:${cliente.email}`
    window.location.href = mailtoUrl
  }

  const handleViewClient = (clienteId: string) => {
    window.open(`/admin/clientes/${clienteId}`, '_blank')
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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchLeads}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            variant="default"
            onClick={() => setShowRecalculationDialog(true)}
            disabled={loading || recalculando}
          >
            <Calculator className="w-4 h-4 mr-2" />
            {recalculando ? 'Recalculando...' : 'Recalcular Comisiones'}
          </Button>
        </div>
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
            <div className="relative overflow-auto max-h-[calc(100vh-100px)] border rounded-md">
              <table className="w-full caption-bottom text-sm">
                <thead className="sticky top-0 bg-background z-10 border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <TableHead className="w-[180px]">Acciones</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Proyecto/Unidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha</TableHead>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredLeads.map((lead) => {
                    const estado = formatearEstado(lead.estado)
                    return (
                      <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-2 align-middle">
                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleWhatsApp(lead.cliente)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <MessageCircle className="w-4 h-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enviar WhatsApp</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEmail(lead.cliente)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Mail className="w-4 h-4 text-blue-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Enviar Email</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewClient(lead.cliente.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Eye className="w-4 h-4 text-purple-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Ver detalle del cliente</p>
                                </TooltipContent>
                              </Tooltip>

                              <Dialog open={isEditDialogOpen && editingLead?.id === lead.id} onOpenChange={(open) => {
                                if (!open) {
                                  setIsEditDialogOpen(false)
                                  resetForm()
                                }
                              }}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEditDialog(lead)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Edit className="w-4 h-4 text-orange-600" />
                                      </Button>
                                    </DialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar lead</p>
                                  </TooltipContent>
                                </Tooltip>
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
                                          <SelectItem value="none">Seleccionar broker...</SelectItem>
                                          {brokers
                                            .filter(b => b.id && b.id.trim() !== '')
                                            .map((broker) => (
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
                                          <SelectItem value="none">Seleccionar cliente...</SelectItem>
                                          {clientes
                                            .filter(c => c.id && c.id.trim() !== '')
                                            .map((cliente) => (
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
                                      <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as Lead['estado'] })}>
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
                                    <Label htmlFor="comisionBase">Comisión Base (Opcional)</Label>
                                    <Select
                                      value={formData.comisionId}
                                      onValueChange={(value: string) => setFormData({ ...formData, comisionId: value })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar comisión base" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Sin comisión base específica</SelectItem>
                                        {comisiones
                                          .filter(c => c.id && c.id.trim() !== '')
                                          .sort((a, b) => a.nombre.localeCompare(b.nombre))
                                          .map((comision) => (
                                            <SelectItem key={comision.id} value={comision.id}>
                                              {comision.nombre} ({comision.codigo}) - {(comision.porcentaje * 100).toFixed(1)}%
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
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
                                          .filter(r => r.id && r.id.trim() !== '')
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
                            </div>
                          </TooltipProvider>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div>
                            <div className="font-medium">{lead.cliente.nombre}</div>
                            <div className="text-sm text-muted-foreground">{lead.cliente.rut}</div>
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div>
                            <div className="font-medium text-sm">{lead.broker.nombre}</div>
                            <div className="text-xs text-muted-foreground">{lead.broker.rut}</div>
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div>
                            <div className="font-medium text-sm">{lead.edificio.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {lead.unidad ? `Unidad ${lead.unidad.numero}` : lead.codigoUnidad}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <Badge className={estado.color}>
                            {estado.label}
                          </Badge>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div>
                            <div className="font-medium">{formatCurrency(lead.totalLead)}</div>
                            <div className="text-sm text-muted-foreground">{formatUF(lead.montoUf)}</div>
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div>
                            <div className="font-medium text-green-600">
                              {formatCurrency(lead.comision)}
                            </div>
                            {lead.reglaComision ? (
                              <div className="text-xs space-y-1 mt-1 p-2 bg-blue-50 rounded border">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-blue-800">Regla Aplicada:</span>
                                  <span className="text-blue-700 font-medium">{(lead.reglaComision.porcentaje * 100).toFixed(1)}%</span>
                                </div>
                                <div className="text-blue-700">
                                  {lead.reglaComision.comision.nombre}
                                </div>
                                <div className="text-blue-600 text-[10px]">
                                  Cálculo: {formatCurrency(lead.totalLead)} × {(lead.reglaComision.porcentaje * 100).toFixed(1)}%
                                </div>
                                <div className="text-blue-600 text-[10px]">
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
                                <div className="text-gray-600 font-medium">Comisión Base</div>
                                <div className="text-gray-500 text-[10px]">
                                  Sin reglas aplicadas
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 align-middle whitespace-nowrap">
                          <div className="text-sm">
                            {new Date(lead.createdAt).toLocaleDateString('es-ES')}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para recalculo de comisiones */}
      <Dialog open={showRecalculationDialog} onOpenChange={setShowRecalculationDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Recalcular Comisiones</DialogTitle>
            <DialogDescription>
              Selecciona el mes y año para recalcular las comisiones basadas en las reglas configuradas.
              Solo se procesarán leads con fecha de pago de reserva en el período seleccionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Mes</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Enero</SelectItem>
                    <SelectItem value="2">Febrero</SelectItem>
                    <SelectItem value="3">Marzo</SelectItem>
                    <SelectItem value="4">Abril</SelectItem>
                    <SelectItem value="5">Mayo</SelectItem>
                    <SelectItem value="6">Junio</SelectItem>
                    <SelectItem value="7">Julio</SelectItem>
                    <SelectItem value="8">Agosto</SelectItem>
                    <SelectItem value="9">Septiembre</SelectItem>
                    <SelectItem value="10">Octubre</SelectItem>
                    <SelectItem value="11">Noviembre</SelectItem>
                    <SelectItem value="12">Diciembre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                    <SelectItem value="2028">2028</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Período seleccionado:</strong> {selectedMonth && selectedYear ?
                  new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) :
                  'Selecciona mes y año'
                }
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRecalculationDialog(false)}
                disabled={recalculando}
              >
                Cancelar
              </Button>
              <Button
                onClick={recalcularComisiones}
                disabled={recalculando || !selectedMonth || !selectedYear}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {recalculando ? 'Recalculando...' : 'Recalcular'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}