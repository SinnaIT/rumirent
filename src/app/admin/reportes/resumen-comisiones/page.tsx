'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Users, FileText, Eye, Loader2, Receipt, ArrowDownCircle, ArrowUpCircle, Edit } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,

} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const MESES = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
]

const ANIOS = Array.from({ length: 10 }, (_, i) => {
  const year = new Date().getFullYear() - 5 + i
  return { value: year.toString(), label: year.toString() }
})

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

interface TipoUnidadEdificio {
  id: string
  nombre: string
  codigo: string
  bedrooms?: number
  bathrooms?: number
}

interface UnidadOption {
  id: string
  numero: string
  estado: string
  descripcion?: string
  metros2?: number
  tipoUnidadEdificio?: {
    id: string
    nombre: string
    codigo: string
  }
}

interface Broker {
  id: string
  nombre: string
  email: string
  rut?: string
}

interface Cliente {
  id: string
  nombre: string
  rut: string
}

interface Edificio {
  id: string
  nombre: string
  direccion?: string
}

interface Lead {
  id: string
  unidadId: string | null
  codigoUnidad: string | null
  totalLead: number
  montoUf: number | null
  comision: number
  estado: string
  conciliado: boolean
  fechaPagoReserva: string
  fechaPagoLead: string | null
  fechaConciliacion: string | null
  fechaCheckin: string | null
  postulacion: string | null
  observaciones: string | null
  isValid: boolean
  broker: {
    id: string
    nombre: string
    email: string
  }
  cliente: {
    id: string
    nombre: string
    rut: string
  }
  edificio: {
    id: string
    nombre: string
  }
  tipoUnidad: string
  tipoUnidadEdificio: TipoUnidadEdificio | null
  reglaComision: ReglaComision | null
  comisionBase: ComisionBase | null
  unidad: {
    id: string
    numero: string
    estado: string
    descripcion?: string
    metros2?: number
  } | null
}

const ESTADOS_LEAD = [
  { value: 'INGRESADO', label: 'Ingresado' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'EN_EVALUACION', label: 'En Evaluación' },
  { value: 'OBSERVADO', label: 'Observado' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada' },
  { value: 'CONTRATO_FIRMADO', label: 'Contrato Firmado' },
  { value: 'CONTRATO_PAGADO', label: 'Contrato Pagado' },
  { value: 'DEPARTAMENTO_ENTREGADO', label: 'Departamento Entregado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'CANCELADO', label: 'Cancelado' }
]

interface BrokerSummary {
  brokerId: string
  brokerNombre: string
  brokerEmail: string
  totalLeads: number
  totalMontoBruto: number
  totalComision: number
  totalComisionValida: number
  totalConciliado: number
  totalPendiente: number
  leadsConciliados: number
  leadsPendientes: number
  leadsValidos: number
  checkin: number
  anticipos: number
  despAnticipo: number
  taxInfo: {
    taxTypeId: string
    taxTypeName: string
    taxNature: string
    rate: number
    validFrom: string
  } | null
  taxAmount: number
  liquidAmount: number
  leads: Lead[]
}

interface ReportData {
  success: boolean
  mes: number
  anio: number
  mesNombre: string
  conciliadoFilter: string
  brokerIdFilter: string
  brokers: BrokerSummary[]
  totales: {
    totalBrokers: number
    totalLeads: number
    totalMontoBruto: number
    totalComision: number
    totalComisionValida: number
    totalConciliado: number
    totalPendiente: number
    leadsConciliados: number
    leadsPendientes: number
    leadsValidos: number
    checkin: number
    anticipos: number
    despAnticipo: number
    totalTaxAmount: number
    totalLiquidAmount: number
  }
}

export default function ResumenComisionesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get initial values from URL or defaults
  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const [mes, setMes] = useState(searchParams.get('mes') || currentMonth.toString())
  const [anio, setAnio] = useState(searchParams.get('anio') || currentYear.toString())
  const [conciliado, setConciliado] = useState(searchParams.get('conciliado') || 'todos')
  const [selectedBroker, setSelectedBroker] = useState(searchParams.get('brokerId') || 'todos')
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'resumen')

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ReportData | null>(null)
  const [brokersList, setBrokersList] = useState<{ id: string; nombre: string }[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [manualComisionModified, setManualComisionModified] = useState(false)

  // Dropdown data for edit form
  const [allBrokers, setAllBrokers] = useState<Broker[]>([])
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [allEdificios, setAllEdificios] = useState<Edificio[]>([])
  const [allTiposUnidad, setAllTiposUnidad] = useState<TipoUnidadEdificio[]>([])
  const [allComisiones, setAllComisiones] = useState<ComisionBase[]>([])
  const [allReglasComision, setAllReglasComision] = useState<ReglaComision[]>([])
  const [allUnidades, setAllUnidades] = useState<UnidadOption[]>([])
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
  const [savingUnit, setSavingUnit] = useState(false)

  // Edit form state
  const [formData, setFormData] = useState({
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
    edificioId: 'none',
    tipoUnidadEdificioId: 'none',
    unidadId: 'none',
    unitNumero: '',
    unitDescripcion: '',
    reglaComisionId: 'none',
    comisionId: 'none',
  })

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        mes,
        anio,
        conciliado,
        brokerId: activeTab === 'detalle' ? selectedBroker : 'todos'
      })

      const response = await fetch(`/api/admin/reportes/resumen-comisiones?${params}`)
      if (!response.ok) {
        throw new Error('Error al cargar datos')
      }

      const result: ReportData = await response.json()
      setData(result)

      // Build brokers list for dropdown
      if (result.brokers.length > 0) {
        const uniqueBrokers = result.brokers.map(b => ({
          id: b.brokerId,
          nombre: b.brokerNombre
        }))
        setBrokersList(uniqueBrokers)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar el resumen de comisiones')
    } finally {
      setLoading(false)
    }
  }

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('mes', mes)
    params.set('anio', anio)
    params.set('conciliado', conciliado)
    params.set('tab', activeTab)
    if (activeTab === 'detalle' && selectedBroker !== 'todos') {
      params.set('brokerId', selectedBroker)
    }

    router.replace(`?${params.toString()}`)
  }, [mes, anio, conciliado, activeTab, selectedBroker, router])

  // Fetch data when filters change
  useEffect(() => {
    fetchData()
  }, [mes, anio, conciliado, activeTab, selectedBroker])

  // Handle "Ver Detalle" button click
  const handleViewDetail = (brokerId: string) => {
    setSelectedBroker(brokerId)
    setActiveTab('detalle')
  }

  // Fetch dropdown data for edit form
  const fetchEditDropdownData = async () => {
    try {
      const [brokersRes, clientesRes, edificiosRes, comisionesRes, reglasRes] = await Promise.all([
        fetch('/api/admin/brokers'),
        fetch('/api/admin/clientes'),
        fetch('/api/admin/edificios'),
        fetch('/api/admin/comisiones'),
        fetch('/api/admin/comisiones/reglas'),
      ])

      const [brokersData, clientesData, edificiosData, comisionesData, reglasData] = await Promise.all([
        brokersRes.json(),
        clientesRes.json(),
        edificiosRes.json(),
        comisionesRes.json(),
        reglasRes.json(),
      ])

      if (brokersData.success) setAllBrokers(brokersData.brokers)
      if (clientesData.success) setAllClientes(clientesData.clientes)
      if (edificiosData.success) setAllEdificios(edificiosData.edificios)
      if (comisionesData.success) setAllComisiones(comisionesData.comisiones)
      if (reglasData.success) setAllReglasComision(reglasData.reglas)
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const fetchTiposUnidad = async (edificioId: string) => {
    try {
      const response = await fetch(`/api/admin/edificios/${edificioId}/tipos-unidad`)
      const result = await response.json()
      if (result.success) {
        setAllTiposUnidad(result.tiposUnidad)
      } else {
        setAllTiposUnidad([])
      }
    } catch (error) {
      console.error('Error fetching tipos de unidad:', error)
      setAllTiposUnidad([])
    }
  }

  const fetchUnidades = async (edificioId: string) => {
    try {
      const response = await fetch(`/api/admin/edificios/${edificioId}/unidades`)
      const data = await response.json()

      if (data.success) {
        setAllUnidades(data.unidades)
      } else {
        console.error('Error al cargar unidades:', data.error)
        setAllUnidades([])
      }
    } catch (error) {
      console.error('Error:', error)
      setAllUnidades([])
    }
  }

  const handleSaveUnit = async () => {
    const unitId = formData.unidadId
    if (!unitId || unitId === 'none' || !formData.unitNumero) return

    const originalUnit = allUnidades.find(u => u.id === unitId)
    if (!originalUnit) return

    try {
      setSavingUnit(true)
      const response = await fetch(`/api/admin/unidades/${unitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: formData.unitNumero,
          descripcion: formData.unitDescripcion || null,
          tipoUnidadEdificioId: originalUnit.tipoUnidadEdificio?.id || formData.tipoUnidadEdificioId,
          estado: originalUnit.estado,
          metros2: originalUnit.metros2 || null,
          edificioId: formData.edificioId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Unidad actualizada exitosamente')
        setFormData(prev => ({ ...prev, codigoUnidad: formData.unitNumero }))
        if (formData.edificioId && formData.edificioId !== 'none') {
          await fetchUnidades(formData.edificioId)
        }
        setIsUnitDialogOpen(false)
      } else {
        toast.error(data.error || 'Error al actualizar la unidad')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSavingUnit(false)
    }
  }

  // When edificioId changes in form, fetch tipos de unidad and unidades
  useEffect(() => {
    if (isEditMode && formData.edificioId && formData.edificioId !== 'none') {
      fetchTiposUnidad(formData.edificioId)
      fetchUnidades(formData.edificioId)
    } else if (isEditMode) {
      setAllTiposUnidad([])
      setAllUnidades([])
    }
  }, [formData.edificioId, isEditMode])

  // Handle "Ver Detalle" lead modal
  const handleViewLeadDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setIsEditMode(false)
    setIsDetailDialogOpen(true)
  }

  const handleOpenEditMode = (lead: Lead) => {
    setSelectedLead(lead)

    const edificioId = lead.edificio?.id || 'none'

    setFormData({
      codigoUnidad: lead.codigoUnidad || '',
      totalLead: lead.totalLead.toString(),
      montoUf: lead.montoUf?.toString() || '',
      comision: lead.comision.toString(),
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva ? lead.fechaPagoReserva.substring(0, 10) : '',
      fechaPagoLead: lead.fechaPagoLead ? lead.fechaPagoLead.substring(0, 10) : '',
      fechaCheckin: lead.fechaCheckin ? lead.fechaCheckin.substring(0, 10) : '',
      postulacion: lead.postulacion || '',
      observaciones: lead.observaciones || '',
      conciliado: lead.conciliado,
      brokerId: lead.broker?.id || 'none',
      clienteId: lead.cliente?.id || 'none',
      edificioId: edificioId,
      tipoUnidadEdificioId: lead.tipoUnidadEdificio?.id || 'none',
      unidadId: lead.unidadId || 'none',
      unitNumero: lead.unidad?.numero || '',
      unitDescripcion: lead.unidad?.descripcion || '',
      reglaComisionId: lead.reglaComision?.id || 'none',
      comisionId: lead.comisionBase?.id || 'none',
    })

    if (edificioId !== 'none') {
      fetchTiposUnidad(edificioId)
      fetchUnidades(edificioId)
    }

    setManualComisionModified(false)
    setIsEditMode(true)
    setIsDetailDialogOpen(true)

    // Fetch dropdown data if not already loaded
    if (allBrokers.length === 0) {
      fetchEditDropdownData()
    }
  }

  const resetEditForm = () => {
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
      edificioId: 'none',
      tipoUnidadEdificioId: 'none',
      unidadId: 'none',
      unitNumero: '',
      unitDescripcion: '',
      reglaComisionId: 'none',
      comisionId: 'none',
    })
    setManualComisionModified(false)
    setIsEditMode(false)
    setSelectedLead(null)
    setAllTiposUnidad([])
    setAllUnidades([])
  }

  const handleEditSubmit = async () => {
    if (!selectedLead) return

    if (!formData.totalLead || !formData.montoUf || !formData.brokerId || formData.brokerId === 'none' || !formData.clienteId || formData.clienteId === 'none') {
      toast.error('Total lead, monto UF, broker y cliente son requeridos')
      return
    }

    if (!formData.edificioId || formData.edificioId === 'none') {
      toast.error('Proyecto (edificio) es requerido')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          brokerId: formData.brokerId === 'none' ? null : formData.brokerId,
          clienteId: formData.clienteId === 'none' ? null : formData.clienteId,
          edificioId: formData.edificioId === 'none' ? null : formData.edificioId,
          tipoUnidadEdificioId: formData.tipoUnidadEdificioId === 'none' ? null : formData.tipoUnidadEdificioId,
          unidadId: formData.unidadId === 'none' ? null : formData.unidadId,
          reglaComisionId: formData.reglaComisionId === 'none' ? null : formData.reglaComisionId,
          comisionId: formData.comisionId === 'none' ? null : formData.comisionId,
          manualComision: manualComisionModified,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || 'Lead actualizado correctamente')
        setIsDetailDialogOpen(false)
        resetEditForm()
        // Refresh report data
        fetchData()
      } else {
        toast.error(result.error || 'Error al actualizar el lead')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL')
  }

  // Get estado badge variant
  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      INGRESADO: 'secondary',
      ENTREGADO: 'default',
      EN_EVALUACION: 'outline',
      OBSERVADO: 'outline',
      APROBADO: 'default',
      RESERVA_PAGADA: 'default',
      CONTRATO_FIRMADO: 'default',
      CONTRATO_PAGADO: 'default',
      DEPARTAMENTO_ENTREGADO: 'default',
      RECHAZADO: 'destructive',
      CANCELADO: 'destructive',
    }
    return variants[estado] || 'default'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Resumen de Comisiones</h1>
        <p className="text-muted-foreground">
          Resumen y detalle de comisiones por broker y periodo
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Año</label>
              <Select value={anio} onValueChange={setAnio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año" />
                </SelectTrigger>
                <SelectContent>
                  {ANIOS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Month Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mes</label>
              <Select value={mes} onValueChange={setMes}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar mes" />
                </SelectTrigger>
                <SelectContent>
                  {MESES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Conciliado Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado Conciliación</label>
              <Select value={conciliado} onValueChange={setConciliado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="si">Conciliado</SelectItem>
                  <SelectItem value="no">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Broker Filter (only visible in Detalle tab) */}
            {activeTab === 'detalle' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Broker</label>
                <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar broker" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {brokersList.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        {broker.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {data && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totales.totalBrokers}</div>
              <p className="text-xs text-muted-foreground">
                {data.mesNombre} {data.anio}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totales.totalLeads}</div>
              <p className="text-xs text-muted-foreground">
                {data.totales.leadsConciliados} conciliados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comisión Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totales.totalComision)}
              </div>
              <p className="text-xs text-muted-foreground">
                Monto bruto: {formatCurrency(data.totales.totalMontoBruto)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendiente Conciliar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.totales.totalPendiente)}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.totales.leadsPendientes} leads
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Líquido</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(data.totales.totalLiquidAmount)}
              </div>
              <p className="text-xs text-muted-foreground">
                Impuestos: {formatCurrency(data.totales.totalTaxAmount)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="resumen">Resumen por Broker</TabsTrigger>
          <TabsTrigger value="detalle">Detalle de Transacciones</TabsTrigger>
        </TabsList>

        {/* Tab 1: Summary */}
        <TabsContent value="resumen" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Comisiones por Broker</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : data && data.brokers.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Broker</TableHead>
                        <TableHead className="text-right">Reservas</TableHead>
                        <TableHead className="text-right">Check-in</TableHead>
                        <TableHead className="text-right">Total Arriendo</TableHead>
                        <TableHead className="text-right">Bruto (Comisión)</TableHead>
                        <TableHead className="text-right">Anticipos</TableHead>
                        <TableHead className="text-right">Impuesto</TableHead>
                        <TableHead className="text-right">Monto Líquido</TableHead>
                        <TableHead className="text-right">Conciliado</TableHead>
                        <TableHead className="text-center">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.brokers.map((broker) => (
                        <TableRow key={broker.brokerId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{broker.brokerNombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {broker.brokerEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <div>{broker.totalLeads}</div>
                              <div className="text-xs text-muted-foreground">
                                {broker.leadsValidos} válidos
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{broker.checkin}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(broker.totalMontoBruto)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <div>
                              <div>{formatCurrency(broker.totalComisionValida)}</div>
                              <div className="text-xs text-muted-foreground">
                                De {formatCurrency(broker.totalComision)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(broker.anticipos)}
                          </TableCell>
                          <TableCell className="text-right">
                            {broker.taxInfo ? (
                              <div>
                                <div className="flex items-center justify-end gap-1">
                                  {broker.taxInfo.taxNature === 'DEDUCTIVE'
                                    ? <ArrowDownCircle className="w-3 h-3 text-red-500" />
                                    : <ArrowUpCircle className="w-3 h-3 text-green-500" />}
                                  <span className="font-mono">
                                    {(broker.taxInfo.rate * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  {formatCurrency(broker.taxAmount)}
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                  {broker.taxInfo.taxTypeName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(broker.liquidAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div>
                              <div className="font-medium">
                                {formatCurrency(broker.totalConciliado)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {broker.leadsConciliados} de {broker.totalLeads}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(broker.brokerId)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Ver Detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {/* Totals Row */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div>{data.totales.totalLeads}</div>
                            <div className="text-xs text-muted-foreground">
                              {data.totales.leadsValidos} válidos
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{data.totales.checkin}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.totales.totalMontoBruto)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div>{formatCurrency(data.totales.totalComisionValida)}</div>
                            <div className="text-xs text-muted-foreground">
                              De {formatCurrency(data.totales.totalComision)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.totales.anticipos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.totales.totalTaxAmount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(data.totales.totalLiquidAmount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div>{formatCurrency(data.totales.totalConciliado)}</div>
                            <div className="text-xs text-muted-foreground">
                              {data.totales.leadsConciliados} de {data.totales.totalLeads}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos disponibles para el periodo seleccionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Detail */}
        <TabsContent value="detalle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : data ? (
                (() => {
                  // Si es "todos", mostrar todos los brokers
                  if (selectedBroker === 'todos') {
                    if (data.brokers.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay transacciones en este periodo
                        </div>
                      )
                    }

                    // Obtener todos los leads de todos los brokers
                    const allLeads = data.brokers.flatMap(broker =>
                      broker.leads.map(lead => ({
                        ...lead,
                        brokerNombre: broker.brokerNombre,
                        brokerId: broker.brokerId
                      }))
                    )

                    if (allLeads.length === 0) {
                      return (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay transacciones en este periodo
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-4">
                        {/* Summary for all brokers */}
                        <div className="bg-muted p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Total Brokers</div>
                            <div className="font-medium">{data.totales.totalBrokers}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Total Leads</div>
                            <div className="font-medium">{data.totales.totalLeads}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Monto Bruto</div>
                            <div className="font-medium">
                              {formatCurrency(data.totales.totalMontoBruto)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Comisión Total</div>
                            <div className="font-medium">
                              {formatCurrency(data.totales.totalComision)}
                            </div>
                          </div>
                        </div>

                        {/* All Leads Table */}
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-center">Acciones</TableHead>
                                <TableHead>Broker</TableHead>
                                <TableHead>Cliente</TableHead>
                                <TableHead>Edificio</TableHead>
                                <TableHead>Unidad</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Monto Lead</TableHead>
                                <TableHead className="text-right">Comisión</TableHead>
                                <TableHead className="text-center">Conciliado</TableHead>
                                <TableHead className="text-center">Check-in</TableHead>
                                <TableHead className="text-center">Válido</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allLeads.map((lead) => (
                                <TableRow key={lead.id}>
                                  <TableCell className="text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleViewLeadDetail(lead)}
                                        title="Ver detalle"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEditMode(lead)}
                                        title="Editar lead"
                                      >
                                        <Edit className="h-4 w-4 text-orange-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {lead.brokerNombre}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <div className="font-medium">{lead.cliente.nombre}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {lead.cliente.rut}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>{lead.edificio.nombre}</TableCell>
                                  <TableCell>
                                    <div>
                                      <div>{lead.codigoUnidad || 'N/A'}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {lead.tipoUnidad}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={getEstadoBadge(lead.estado)}>
                                      {lead.estado.replace(/_/g, ' ')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div>
                                      <div>{formatCurrency(lead.totalLead)}</div>
                                      {lead.montoUf && (
                                        <div className="text-xs text-muted-foreground">
                                          {lead.montoUf.toFixed(2)} UF
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(lead.comision)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {lead.conciliado ? (
                                      <Badge variant="default">Sí</Badge>
                                    ) : (
                                      <Badge variant="secondary">No</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {lead.fechaCheckin ? '✓' : '-'}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {lead.isValid ? (
                                      <Badge variant="default" className="bg-green-600">Sí</Badge>
                                    ) : (
                                      <Badge variant="destructive">No</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )
                  }

                  // Si es un broker específico
                  const brokerData = data.brokers.find(b => b.brokerId === selectedBroker)
                  if (!brokerData || brokerData.leads.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        No hay transacciones para el broker seleccionado en este periodo
                      </div>
                    )
                  }

                  return (
                    <div className="space-y-4">
                      {/* Broker Summary */}
                      <div className="bg-muted p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Broker</div>
                          <div className="font-medium">{brokerData.brokerNombre}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Leads</div>
                          <div className="font-medium">{brokerData.totalLeads}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Comisión Válida</div>
                          <div className="font-medium">
                            {formatCurrency(brokerData.totalComisionValida)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Pendiente</div>
                          <div className="font-medium">
                            {formatCurrency(brokerData.totalPendiente)}
                          </div>
                        </div>
                      </div>
                      {/* Tax Summary for specific broker */}
                      {brokerData.taxInfo && (
                        <div className="border rounded-lg p-3 flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 font-medium">
                            <Receipt className="w-4 h-4 text-muted-foreground" />
                            <span>Impuesto aplicado:</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {brokerData.taxInfo.taxNature === 'DEDUCTIVE'
                              ? <ArrowDownCircle className="w-4 h-4 text-red-500" />
                              : <ArrowUpCircle className="w-4 h-4 text-green-500" />}
                            <span className="font-semibold">{brokerData.taxInfo.taxTypeName}</span>
                            <span className="text-muted-foreground ml-1">
                              ({(brokerData.taxInfo.rate * 100).toFixed(2)}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Monto impuesto: </span>
                            <span className="font-semibold">{formatCurrency(brokerData.taxAmount)}</span>
                          </div>
                          <div className="ml-auto">
                            <span className="text-muted-foreground">Monto líquido: </span>
                            <span className="font-bold text-primary text-base">
                              {formatCurrency(brokerData.liquidAmount)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Leads Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-center">Acciones</TableHead>
                              <TableHead>Cliente</TableHead>
                              <TableHead>Edificio</TableHead>
                              <TableHead>Unidad</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Monto Lead</TableHead>
                              <TableHead className="text-right">Comisión</TableHead>
                              <TableHead className="text-center">Conciliado</TableHead>
                              <TableHead className="text-center">Check-in</TableHead>
                              <TableHead className="text-center">Válido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {brokerData.leads.map((lead) => (
                              <TableRow key={lead.id}>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleViewLeadDetail(lead)}
                                      title="Ver detalle"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenEditMode(lead)}
                                      title="Editar lead"
                                    >
                                      <Edit className="h-4 w-4 text-orange-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">{lead.cliente.nombre}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {lead.cliente.rut}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{lead.edificio.nombre}</TableCell>
                                <TableCell>
                                  <div>
                                    <div>{lead.codigoUnidad || 'N/A'}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {lead.tipoUnidad}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getEstadoBadge(lead.estado)}>
                                    {lead.estado.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div>
                                    <div>{formatCurrency(lead.totalLead)}</div>
                                    {lead.montoUf && (
                                      <div className="text-xs text-muted-foreground">
                                        {lead.montoUf.toFixed(2)} UF
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(lead.comision)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {lead.conciliado ? (
                                    <Badge variant="default">Sí</Badge>
                                  ) : (
                                    <Badge variant="secondary">No</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {lead.fechaCheckin ? '✓' : '-'}
                                </TableCell>
                                <TableCell className="text-center">
                                  {lead.isValid ? (
                                    <Badge variant="default" className="bg-green-600">Sí</Badge>
                                  ) : (
                                    <Badge variant="destructive">No</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )
                })()
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Lead Detail/Edit Modal */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDetailDialogOpen(false)
          if (isEditMode) resetEditForm()
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {isEditMode ? (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Editar Lead
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" />
                  Detalle del Lead
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Modifica los datos del lead. Todos los campos son editables.'
                : 'Información completa del lead. Haz clic en "Editar" para modificar.'}
            </DialogDescription>
          </DialogHeader>

          {selectedLead && !isEditMode && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>Broker</Label>
                  <Input
                    value={selectedLead.broker?.nombre || 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Cliente</Label>
                  <Input
                    value={selectedLead.cliente.nombre}
                    disabled
                    className="bg-muted"
                  />
                  <Input
                    value={selectedLead.cliente.rut}
                    disabled
                    className="bg-muted text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>Proyecto (Edificio)</Label>
                  <Input
                    value={selectedLead.edificio.nombre}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Tipo de Unidad</Label>
                  <Input
                    value={selectedLead.tipoUnidad}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>Código Unidad</Label>
                  <Input
                    value={selectedLead.codigoUnidad || 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Estado</Label>
                  <div className="p-2 bg-muted rounded-md">
                    <Badge variant={getEstadoBadge(selectedLead.estado)}>
                      {selectedLead.estado.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>Total Lead (CLP)</Label>
                  <Input
                    value={formatCurrency(selectedLead.totalLead)}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Monto UF</Label>
                  <Input
                    value={selectedLead.montoUf ? selectedLead.montoUf.toFixed(2) : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Comisión (CLP)</Label>
                  <Input
                    value={formatCurrency(selectedLead.comision)}
                    disabled
                    className="bg-muted font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>Comisión Base</Label>
                  <Input
                    value={selectedLead.comisionBase ? `${selectedLead.comisionBase.nombre} (${selectedLead.comisionBase.codigo}) - ${(selectedLead.comisionBase.porcentaje * 100).toFixed(1)}%` : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Regla de Comisión</Label>
                  <Input
                    value={selectedLead.reglaComision ? `${selectedLead.reglaComision.comision.nombre} - ${(selectedLead.reglaComision.porcentaje * 100).toFixed(1)}%` : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label>Fecha Pago Reserva</Label>
                  <Input
                    value={selectedLead.fechaPagoReserva ? formatDate(selectedLead.fechaPagoReserva) : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Fecha Pago Lead</Label>
                  <Input
                    value={selectedLead.fechaPagoLead ? formatDate(selectedLead.fechaPagoLead) : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label>Fecha Check-in</Label>
                  <Input
                    value={selectedLead.fechaCheckin ? formatDate(selectedLead.fechaCheckin) : 'N/A'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Postulación</Label>
                <Input
                  value={selectedLead.postulacion || 'N/A'}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={selectedLead.observaciones || 'N/A'}
                  disabled
                  className="bg-muted"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                  <Checkbox
                    checked={selectedLead.conciliado}
                    disabled
                  />
                  <Label>Lead conciliado</Label>
                </div>

                <div className="flex items-center space-x-2 p-3 bg-muted rounded-md">
                  <Checkbox
                    checked={selectedLead.isValid}
                    disabled
                  />
                  <Label>Lead válido para comisión</Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDetailDialogOpen(false)}
                >
                  Cerrar
                </Button>
                <Button onClick={() => handleOpenEditMode(selectedLead)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
          )}

          {selectedLead && isEditMode && (
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
                      {allBrokers
                        .filter(b => b.id && b.id.trim() !== '')
                        .map((broker) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.nombre} {broker.rut ? `- ${broker.rut}` : ''}
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
                      {allClientes
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
                  <Label htmlFor="edificio">Proyecto (Edificio) *</Label>
                  <Select value={formData.edificioId} onValueChange={(value: string) => setFormData({ ...formData, edificioId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar proyecto...</SelectItem>
                      {allEdificios
                        .filter(e => e.id && e.id.trim() !== '')
                        .map((edificio) => (
                          <SelectItem key={edificio.id} value={edificio.id}>
                            {edificio.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="tipoUnidad">Tipo de Unidad</Label>
                  <Select
                    value={formData.tipoUnidadEdificioId}
                    onValueChange={(value: string) => setFormData({ ...formData, tipoUnidadEdificioId: value })}
                    disabled={!formData.edificioId || formData.edificioId === 'none' || allTiposUnidad.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        !formData.edificioId || formData.edificioId === 'none'
                          ? "Primero selecciona un proyecto"
                          : allTiposUnidad.length === 0
                            ? "No hay tipos disponibles"
                            : "Seleccionar tipo de unidad"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin tipo específico</SelectItem>
                      {allTiposUnidad
                        .filter(t => t.id && t.id.trim() !== '')
                        .map((tipo) => (
                          <SelectItem key={tipo.id} value={tipo.id}>
                            {tipo.nombre} ({tipo.codigo})
                            {tipo.bedrooms && tipo.bathrooms && ` - ${tipo.bedrooms}D/${tipo.bathrooms}B`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Unidad del proyecto */}
              <div className="space-y-3 border rounded-lg p-3">
                <Label className="text-sm font-semibold">Unidad del Proyecto</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="unidad" className="text-xs text-muted-foreground">Seleccionar unidad existente</Label>
                    <Select
                      value={formData.unidadId}
                      onValueChange={(value: string) => {
                        const selectedUnit = allUnidades.find(u => u.id === value)
                        setFormData({
                          ...formData,
                          unidadId: value,
                          codigoUnidad: selectedUnit?.numero || '',
                          unitNumero: selectedUnit?.numero || '',
                          unitDescripcion: selectedUnit?.descripcion || ''
                        })
                      }}
                      disabled={!formData.edificioId || formData.edificioId === 'none' || allUnidades.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !formData.edificioId || formData.edificioId === 'none'
                            ? "Primero selecciona un proyecto"
                            : allUnidades.length === 0
                              ? "No hay unidades disponibles"
                              : "Seleccionar unidad"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin unidad específica</SelectItem>
                        {allUnidades
                          .filter(u => u.id && u.id.trim() !== '')
                          .map((unidad) => (
                            <SelectItem key={unidad.id} value={unidad.id}>
                              {unidad.numero}{unidad.tipoUnidadEdificio ? ` - ${unidad.tipoUnidadEdificio.nombre}` : ''} ({unidad.estado})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="codigoUnidad" className="text-xs text-muted-foreground">Código unidad (manual)</Label>
                    <Input
                      id="codigoUnidad"
                      value={formData.codigoUnidad}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                      placeholder="Se actualiza automáticamente"
                    />
                  </div>
                </div>

                {formData.unidadId && formData.unidadId !== 'none' && (
                  <div className="border-t pt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsUnitDialogOpen(true)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar datos de la unidad ({formData.unitNumero || 'Sin número'})
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="estado">Estado del Lead</Label>
                <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
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
                    onChange={(e) => {
                      setFormData({ ...formData, comision: e.target.value })
                      setManualComisionModified(true)
                    }}
                    placeholder="7500000"
                  />
                  {manualComisionModified && (
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      Comisión modificada manualmente - no se recalculará automáticamente
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="comisionBase">Comisión Base (Opcional)</Label>
                <Select
                  value={formData.comisionId}
                  onValueChange={(value: string) => {
                    setFormData({ ...formData, comisionId: value })
                    if (selectedLead && value !== (selectedLead.comisionBase?.id || 'none')) {
                      setManualComisionModified(true)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar comisión base" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin comisión base específica</SelectItem>
                    {allComisiones
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
                  onValueChange={(value: string) => {
                    setFormData({ ...formData, reglaComisionId: value })
                    if (selectedLead && value !== (selectedLead.reglaComision?.id || 'none')) {
                      setManualComisionModified(true)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar regla de comisión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin regla específica</SelectItem>
                    {allReglasComision
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
                {formData.reglaComisionId && formData.reglaComisionId !== 'none' && !manualComisionModified && (
                  <div className="text-xs text-muted-foreground">
                    Esta regla puede recalcular automáticamente la comisión según el monto del lead
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

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    resetEditForm()
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleEditSubmit} disabled={saving}>
                  {saving ? 'Guardando...' : 'Actualizar Lead'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unit Edit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Editar Unidad
            </DialogTitle>
            <DialogDescription>
              Modifica los datos de la unidad asociada al lead.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="unitNumero">Número/Nombre de la Unidad *</Label>
              <Input
                id="unitNumero"
                value={formData.unitNumero}
                onChange={(e) => setFormData({ ...formData, unitNumero: e.target.value })}
                placeholder="Ej: A-101"
              />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="unitDescripcion">Descripción</Label>
              <Textarea
                id="unitDescripcion"
                value={formData.unitDescripcion}
                onChange={(e) => setFormData({ ...formData, unitDescripcion: e.target.value })}
                placeholder="Descripción de la unidad..."
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsUnitDialogOpen(false)}
                disabled={savingUnit}
              >
                Cancelar
              </Button>
              <Button onClick={handleSaveUnit} disabled={savingUnit || !formData.unitNumero}>
                {savingUnit ? 'Guardando...' : 'Guardar Unidad'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
