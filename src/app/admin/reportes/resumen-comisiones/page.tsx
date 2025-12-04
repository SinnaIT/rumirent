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
import { Calendar, DollarSign, Users, FileText, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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

interface Lead {
  id: string
  codigoUnidad: string | null
  totalLead: number
  montoUf: number | null
  comision: number
  estado: string
  conciliado: boolean
  fechaPagoReserva: string
  fechaConciliacion: string | null
  fechaCheckin: string | null
  isValid: boolean
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
}

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
        <div className="grid gap-4 md:grid-cols-4">
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
                        <TableHead className="text-right">Monto Bruto</TableHead>
                        <TableHead className="text-right">Anticipos</TableHead>
                        <TableHead className="text-right">Desp. Anticipos</TableHead>
                        <TableHead className="text-right">Líquido</TableHead>
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
                          <TableCell className="text-right">
                            {formatCurrency(broker.anticipos)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(broker.despAnticipo)}
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
                          {formatCurrency(data.totales.anticipos)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.totales.despAnticipo)}
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
                      <div className="bg-muted p-4 rounded-lg grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Broker</div>
                          <div className="font-medium">{brokerData.brokerNombre}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total Leads</div>
                          <div className="font-medium">{brokerData.totalLeads}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Monto Bruto</div>
                          <div className="font-medium">
                            {formatCurrency(brokerData.totalMontoBruto)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Comisión Total</div>
                          <div className="font-medium">
                            {formatCurrency(brokerData.totalComision)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Pendiente</div>
                          <div className="font-medium">
                            {formatCurrency(brokerData.totalPendiente)}
                          </div>
                        </div>
                      </div>

                      {/* Leads Table */}
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
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
    </div>
  )
}
