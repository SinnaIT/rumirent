'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CommissionPreviewCard } from '@/components/commission-preview-card'
import { toast } from 'sonner'
import {
  Plus,
  Building2,
  Home,
  Calculator,
  ArrowLeft,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Search,
  X
} from 'lucide-react'

interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
}

interface TipoUnidad {
  id: string
  nombre: string
  codigo: string
  comision: Comision | null
}

interface Unidad {
  id: string
  numero: string
  estado: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'
  descripcion?: string
  metros2?: number
  tipoUnidad: TipoUnidad
  createdAt: string
  updatedAt: string
}

interface Proyecto {
  id: string
  nombre: string
  direccion: string
  comision?: Comision | null
  tiposUnidad: TipoUnidad[]
  unidades: Unidad[]
}

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
  isOwnClient?: boolean
  isHandledByAnotherBroker?: boolean
  hasActiveLead?: boolean
  activeLead?: {
    id: string
    createdAt: string
    estado: string
    edificio: string
  } | null
  broker?: {
    id: string
    nombre: string
    email: string
  }
}

interface CommissionRule {
  id: string
  porcentaje: number
  cantidadMinima: number
  cantidadMaxima: number | null
}

interface CommissionInfo {
  comisionId: string
  comisionNombre: string
  comisionCodigo: string
  porcentajeBase: number
  totalLeads: number
  currentRule: CommissionRule | null
  nextRule: CommissionRule | null
  untilNextLevel: number | null
}

interface MultiCommissionResponse {
  success: boolean
  date: string
  commissionData: Record<string, CommissionInfo>
}

const ESTADOS_CONTRATO = [
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

export default function GenerarLeadPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unidadIdFromParams = searchParams.get('unidadId')

  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null)
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null)
  const [searchingClient, setSearchingClient] = useState(false)
  const [clientData, setClientData] = useState({
    rut: '',
    nombre: '',
    email: '',
    telefono: ''
  })
  const [clientExists, setClientExists] = useState<boolean | null>(null)
  const [clientHandledByAnotherBroker, setClientHandledByAnotherBroker] = useState<Cliente | null>(null)
  const [clientHasActiveLead, setClientHasActiveLead] = useState<{ id: string, createdAt: string, estado: string, edificio: string } | null>(null)
  const [clientCreatedInCurrentSession, setClientCreatedInCurrentSession] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [commissionData, setCommissionData] = useState<Record<string, CommissionInfo>>({})
  const [loadingCommissionRules, setLoadingCommissionRules] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    edificioId: '',
    tipoUnidadEdificioId: '',
    unidadId: unidadIdFromParams ?? '',
    codigoUnidad: '',
    clienteId: '',
    totalLead: '',
    montoUf: '',
    comision: '',
    estado: 'ENTREGADO' as const,
    fechaPagoReserva: new Date().toISOString().split('T')[0], // Default to today
    fechaPagoLead: '',
    fechaCheckin: '',
    observaciones: ''
  })

  // Estados para valores formateados visualmente
  const [displayTotalLead, setDisplayTotalLead] = useState('')
  const [displayMontoUf, setDisplayMontoUf] = useState('')

  useEffect(() => {
    fetchProyectos()
    fetchClientes()
    fetchCommissionRules()
  }, [])

  useEffect(() => {
    if (unidadIdFromParams && proyectos.length > 0) {
      // Find the unit from URL params
      for (const proyecto of proyectos) {
        const unidad = proyecto.unidades.find(u => u.id === unidadIdFromParams)
        if (unidad) {
          setSelectedUnidad(unidad)
          setSelectedProyecto(proyecto)
          setFormData(prev => ({
            ...prev,
            edificioId: proyecto.id,
            unidadId: unidad.id
          }))
          break
        }
      }
    }
  }, [unidadIdFromParams, proyectos])

  const fetchProyectos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/broker/proyectos')
      const data = await response.json()

      if (data.success) {
        setProyectos(data.proyectos)
      } else {
        toast.error('Error al cargar proyectos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true)
      const response = await fetch('/api/broker/clientes')
      const data = await response.json()

      if (data.success) {
        setClientes(data.clientes)
      } else {
        toast.error('Error al cargar clientes')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión al cargar clientes')
    } finally {
      setLoadingClientes(false)
    }
  }

  const fetchCommissionRules = async (date?: string) => {
    try {
      setLoadingCommissionRules(true)

      // Use provided date or form's fechaPagoReserva or default to today
      const targetDate = date || formData.fechaPagoReserva || new Date().toISOString().split('T')[0]

      console.log('Fetching commission rules for date:', targetDate)
      const response = await fetch(`/api/broker/commission-rules?date=${targetDate}`)
      const data = await response.json()
      console.log('Commission rules response:', data)

      if (data.success && data.commissionData) {
        setCommissionData(data.commissionData)
        console.log('Commission data set:', data.commissionData)
      } else {
        console.warn('Commission rules fetch unsuccessful:', data)
        setCommissionData({})
      }
    } catch (error) {
      console.error('Error al cargar reglas de comisión:', error)
      setCommissionData({})
    } finally {
      setLoadingCommissionRules(false)
    }
  }

  const searchClientByRut = async (rut: string) => {
    if (!rut.trim()) {
      setClientExists(null)
      setClientHandledByAnotherBroker(null)
      setClientHasActiveLead(null)
      setClientCreatedInCurrentSession(false)
      setClientData({ rut: '', nombre: '', email: '', telefono: '' })
      setFormData({ ...formData, clienteId: '' })
      return
    }

    try {
      setSearchingClient(true)
      const response = await fetch(`/api/broker/clientes/search?rut=${encodeURIComponent(rut)}`)
      const data = await response.json()

      if (data.success && data.cliente) {
        // Cliente encontrado
        if (data.cliente.isHandledByAnotherBroker) {
          // Cliente manejado por otro broker
          setClientExists(false)
          setClientHandledByAnotherBroker(data.cliente)
          setClientHasActiveLead(null)
          setClientCreatedInCurrentSession(false)
          setClientData({
            rut: data.cliente.rut,
            nombre: data.cliente.nombre,
            email: data.cliente.email || '',
            telefono: data.cliente.telefono || ''
          })
          setFormData({ ...formData, clienteId: '' }) // No permitir uso del cliente
        } else {
          // Cliente propio
          setClientExists(true)
          setClientHandledByAnotherBroker(null)
          setClientCreatedInCurrentSession(false)

          // Verificar si tiene lead activo
          if (data.cliente.hasActiveLead && data.cliente.activeLead) {
            setClientHasActiveLead(data.cliente.activeLead)
          } else {
            setClientHasActiveLead(null)
          }

          setClientData({
            rut: data.cliente.rut,
            nombre: data.cliente.nombre,
            email: data.cliente.email || '',
            telefono: data.cliente.telefono || ''
          })
          setFormData({ ...formData, clienteId: data.cliente.id })
        }
      } else {
        // Cliente no encontrado - preservar datos ingresados manualmente
        setClientExists(false)
        setClientHandledByAnotherBroker(null)
        setClientHasActiveLead(null)
        setClientCreatedInCurrentSession(false)
        setClientData(prev => ({ ...prev, rut }))
        setFormData({ ...formData, clienteId: '' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al buscar cliente')
      setClientExists(null)
      setClientHandledByAnotherBroker(null)
      setClientHasActiveLead(null)
      setClientCreatedInCurrentSession(false)
      setClientData(prev => ({ ...prev, rut }))
    } finally {
      setSearchingClient(false)
    }
  }

  const clearClientData = () => {
    setClientExists(null)
    setClientHandledByAnotherBroker(null)
    setClientHasActiveLead(null)
    setClientCreatedInCurrentSession(false)
    setClientData({ rut: '', nombre: '', email: '', telefono: '' })
    setFormData({ ...formData, clienteId: '' })
  }

  const handleRutChange = (rut: string) => {
    setClientData({ ...clientData, rut })

    // Buscar cliente después de una pausa para evitar muchas consultas
    const timeoutId = setTimeout(() => {
      searchClientByRut(rut)
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const selectClientFromModal = (cliente: Cliente) => {
    setClientData({
      rut: cliente.rut,
      nombre: cliente.nombre,
      email: cliente.email || '',
      telefono: cliente.telefono || ''
    })
    setFormData({ ...formData, clienteId: cliente.id })
    setClientExists(true)

    // Verificar si tiene lead activo
    if (cliente.hasActiveLead && cliente.activeLead) {
      setClientHasActiveLead(cliente.activeLead)
    } else {
      setClientHasActiveLead(null)
    }

    setShowClientModal(false)
    setClientSearchTerm('')
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    cliente.rut.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(clientSearchTerm.toLowerCase()))
  )

  const handleProyectoChange = (edificioId: string) => {
    const proyecto = proyectos.find(p => p.id === edificioId)
    setSelectedProyecto(proyecto || null)
    setFormData({ ...formData, edificioId, tipoUnidadEdificioId: '', unidadId: '', codigoUnidad: '' })
    setSelectedUnidad(null)
  }

  const handleTipologiaChange = (tipoUnidadEdificioId: string) => {
    setFormData({ ...formData, tipoUnidadEdificioId, unidadId: '', codigoUnidad: '' })
    setSelectedUnidad(null)
  }

  const handleUnidadChange = (unidadId: string) => {
    const proyecto = proyectos.find(p => p.id === formData.edificioId)
    if (proyecto) {
      const unidad = proyecto.unidades.find(u => u.id === unidadId)
      if (unidad) {
        setSelectedUnidad(unidad)
        // Block manual codigo when unit is selected
        setFormData({ ...formData, unidadId, codigoUnidad: '' })
      }
    }
  }

  // Get filtered units based on selected tipologia
  const getFilteredUnidades = () => {
    if (!formData.edificioId || !selectedProyecto) return []

    const unidades = selectedProyecto.unidades

    if (!formData.tipoUnidadEdificioId) {
      return unidades
    }

    return unidades.filter(u => u.tipoUnidad.id === formData.tipoUnidadEdificioId)
  }

  // Handler para cambio en totalLead
  const handleTotalLeadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatNumberWithThousandsSeparator(value)
    setDisplayTotalLead(formatted)

    // Guardar el valor sin formato para cálculos
    const numericValue = value.replace(/\D/g, '')
    setFormData({ ...formData, totalLead: numericValue })
  }

  // Handler para cambio en montoUf
  const handleMontoUfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatDecimalWithChileanSeparator(value)
    setDisplayMontoUf(formatted)

    // Guardar el valor sin formato para cálculos (reemplazar coma por punto)
    const numericValue = parseChileanNumber(formatted)
    setFormData({ ...formData, montoUf: numericValue })
  }

  const calculateComision = () => {
    // Calculate price (0 if not provided, to still show rate)
    const precio = formData.totalLead ? parseFloat(formData.totalLead) : 0

    // Determinar la comisión base aplicable (tipo de unidad tiene prioridad sobre proyecto)
    let baseComision = null
    let comisionSource = 'none'

    // Prioridad 1: Comisión del tipo de unidad (si está seleccionada una unidad)
    if (selectedUnidad?.tipoUnidad.comision) {
      baseComision = selectedUnidad.tipoUnidad.comision
      comisionSource = 'unit'
    }
    // Prioridad 2: Comisión del tipo de unidad (para código manual)
    else if (formData.tipoUnidadEdificioId && selectedProyecto) {
      const tipoUnidad = selectedProyecto.tiposUnidad.find(t => t.id === formData.tipoUnidadEdificioId)
      if (tipoUnidad?.comision) {
        baseComision = tipoUnidad.comision
        comisionSource = 'unitType'
      }
    }
    // Prioridad 3: Comisión base del proyecto
    if (!baseComision && selectedProyecto?.comision) {
      baseComision = selectedProyecto.comision
      comisionSource = 'project'
    }

    console.log('calculateComision - baseComision:', baseComision)
    console.log('calculateComision - commissionData:', commissionData)

    // Si no hay comisión base, no podemos calcular nada
    if (!baseComision) {
      return { amount: 0, rate: 0, source: 'none' }
    }

    // Verificar si existe una regla de comisión que corresponda a esta comisión base
    // Las reglas solo aplican si pertenecen a la MISMA comisión
    const commissionInfo = commissionData[baseComision.id]
    if (commissionInfo?.currentRule) {
      console.log('Commission rule found:', commissionInfo.currentRule)
      console.log('Applying commission rule for:', commissionInfo.comisionNombre)
      const rate = commissionInfo.currentRule.porcentaje
      console.log('Commission rule applies! Rate:', rate)
      return {
        amount: precio > 0 ? precio * rate : 0,
        rate: rate,
        source: 'rule',
        name: commissionInfo.comisionNombre,
        isRule: true,
        reglaComisionId: commissionInfo.currentRule.id,
        comisionId: baseComision.id
      }
    } else {
      console.log('No commission rules found for this commission')
    }

    // Si no hay regla aplicable, usar la tasa base de la comisión
    const rate = baseComision.porcentaje
    console.log('Using base commission rate:', rate)
    return {
      amount: precio > 0 ? precio * rate : 0,
      rate: rate,
      source: comisionSource,
      name: baseComision.nombre,
      comisionId: baseComision.id
    }
  }

  const handleSubmit = async () => {
    // Validaciones básicas
    if (!clientData.rut.trim()) {
      toast.error('RUT del cliente es requerido')
      return
    }

    if (!clientData.nombre.trim()) {
      toast.error('Nombre del cliente es requerido')
      return
    }

    if (clientHandledByAnotherBroker) {
      toast.error('No puedes crear un lead para un cliente que está siendo manejado por otro vendedor')
      return
    }

    if (clientHasActiveLead) {
      toast.error('Este cliente ya tiene un lead activo. Debe esperar al menos 30 días o que el lead actual termine.')
      return
    }

    if (!formData.edificioId) {
      toast.error('Debe seleccionar un edificio')
      return
    }

    // Validación: si se ingresa código manual, el tipo de unidad es obligatorio
    if (formData.codigoUnidad && !formData.unidadId && !formData.tipoUnidadEdificioId) {
      toast.error('Debe seleccionar una tipología cuando ingresa un código de unidad manual')
      return
    }

    // Validar solo el total del arriendo (obligatorio)
    if (!formData.totalLead) {
      toast.error('Total del arriendo es requerido')
      return
    }

    const totalLead = parseFloat(formData.totalLead)

    if (isNaN(totalLead) || totalLead <= 0) {
      toast.error('El total del arriendo debe ser un número válido mayor a 0')
      return
    }

    // Validar monto UF solo si se proporcionó
    let montoUf = 0
    if (formData.montoUf) {
      montoUf = parseFloat(formData.montoUf)
      if (isNaN(montoUf) || montoUf <= 0) {
        toast.error('El monto UF debe ser un número válido mayor a 0')
        return
      }
    }

    try {
      setSaving(true)

      let clienteId = formData.clienteId

      // Si el cliente no existe y no fue creado en esta sesión, crearlo primero
      if (!clientExists && !clientCreatedInCurrentSession && clientData.rut.trim() && clientData.nombre.trim()) {
        const clientResponse = await fetch('/api/broker/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rut: clientData.rut.trim(),
            nombre: clientData.nombre.trim(),
            email: clientData.email.trim() || undefined,
            telefono: clientData.telefono.trim() || undefined
          })
        })

        const clientData_response = await clientResponse.json()

        if (clientData_response.success) {
          clienteId = clientData_response.cliente.id
          setClientCreatedInCurrentSession(true)
          setClientExists(true)
          setFormData(prev => ({ ...prev, clienteId: clientData_response.cliente.id }))
          toast.success('Cliente creado exitosamente')
        } else {
          toast.error(clientData_response.error || 'Error al crear cliente')
          return
        }
      }

      // Verificar que tenemos un clienteId válido antes de proceder
      if (!clienteId) {
        toast.error('Error: No se pudo obtener el ID del cliente')
        return
      }

      // La creacion automatica de unidad se maneja en el backend (API)
      const unidadIdToUse = formData.unidadId

      const comisionData = calculateComision()
      const comisionCalculada = comisionData.amount

      // Task 12.3: Determinar reglaComisionId y comisionId
      let reglaComisionId = undefined
      const comisionId = comisionData.comisionId || undefined
      if (comisionData.isRule && comisionData.reglaComisionId) {
        reglaComisionId = comisionData.reglaComisionId
      }

      const response = await fetch('/api/broker/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unidadId: unidadIdToUse || undefined,
          codigoUnidad: !unidadIdToUse ? formData.codigoUnidad : undefined,
          tipoUnidadEdificioId: formData.tipoUnidadEdificioId || undefined,
          clienteId: clienteId,
          edificioId: formData.edificioId,
          totalLead,
          montoUf,
          comision: comisionCalculada,
          comisionId: comisionId,
          reglaComisionId: reglaComisionId,
          estado: formData.estado,
          fechaPagoReserva: formData.fechaPagoReserva || undefined,
          fechaPagoLead: formData.fechaPagoLead || undefined,
          fechaCheckin: formData.fechaCheckin || undefined,
          observaciones: formData.observaciones || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Lead generado exitosamente')
        router.push('/broker/ventas')
      } else {
        // Mostrar error detallado
        toast.error(data.error, {
          duration: 6000, // Mostrar por más tiempo si es un error de lead duplicado
        })

        // Si el error es por lead duplicado, limpiar el cliente para que busque otro
        if (data.existingLead) {
          console.log('Lead existente encontrado:', data.existingLead)
          // Opcionalmente podrías actualizar el estado para mostrar el lead existente
          if (data.existingLead.createdAt && data.existingLead.estado) {
            setClientHasActiveLead({
              id: data.existingLead.id,
              createdAt: data.existingLead.createdAt,
              estado: data.existingLead.estado,
              edificio: data.existingLead.edificio || 'Edificio desconocido'
            })
          }
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
  }

  // Función para formatear números con separador de miles chileno (punto)
  const formatNumberWithThousandsSeparator = (value: string): string => {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '')
    if (!numbers) return ''

    // Agregar separador de miles (punto)
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Función para formatear decimales con separador chileno (coma)
  const formatDecimalWithChileanSeparator = (value: string): string => {
    // Remover todo excepto números y coma
    const cleaned = value.replace(/[^\d,]/g, '')

    // Separar parte entera y decimal
    const parts = cleaned.split(',')
    const integerPart = parts[0]
    const decimalPart = parts[1]

    if (!integerPart) return ''

    // Formatear parte entera con puntos
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    // Retornar con parte decimal si existe
    return decimalPart !== undefined ? `${formattedInteger},${decimalPart}` : formattedInteger
  }

  // Función para obtener valor numérico desde formato chileno
  const parseChileanNumber = (value: string): string => {
    // Remover puntos (separador de miles) y reemplazar coma por punto (decimal)
    return value.replace(/\./g, '').replace(',', '.')
  }

  const comisionData = calculateComision()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Generar Nuevo Lead</h1>
            <p className="text-muted-foreground">
              Crea un nuevo lead de venta para una unidad disponible
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Selección de Unidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="w-5 h-5 mr-2" />
                Edificio y Unidad (Opcional)
              </CardTitle>
              <CardDescription>
                Selecciona el edificio (requerido). La unidad es opcional: puedes elegir una del sistema, ingresar un código manual, o dejar sin unidad específica.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proyecto">Proyecto *</Label>
                  <Select value={formData.edificioId} onValueChange={handleProyectoChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {proyectos.map((proyecto) => (
                        <SelectItem key={proyecto.id} value={proyecto.id}>
                          {proyecto.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipologia">
                    Tipología {formData.codigoUnidad && !formData.unidadId ? <span className="text-red-600">*</span> : ''}
                  </Label>
                  <Select
                    value={formData.tipoUnidadEdificioId || 'all'}
                    onValueChange={(value) => handleTipologiaChange(value === 'all' ? '' : value)}
                    disabled={!formData.edificioId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las tipologías" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las tipologías</SelectItem>
                      {selectedProyecto?.tiposUnidad.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.codigoUnidad && !formData.unidadId && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      * Obligatorio cuando se ingresa código de unidad manual
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad (del sistema)</Label>
                  <Select
                    value={formData.unidadId}
                    onValueChange={handleUnidadChange}
                    disabled={!formData.edificioId || !!formData.codigoUnidad}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad del sistema" />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredUnidades().map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.id}>
                          {unidad.numero} - {unidad.tipoUnidad.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigoUnidad">O ingrese código de unidad manualmente</Label>
                <Input
                  id="codigoUnidad"
                  value={formData.codigoUnidad}
                  onChange={(e) => setFormData({ ...formData, codigoUnidad: e.target.value })}
                  placeholder="ej: Torre A - Depto 101"
                  disabled={!!formData.unidadId}
                />
                <p className="text-xs text-muted-foreground">
                  Use este campo si la unidad no está registrada en el sistema.
                  {formData.codigoUnidad && !formData.unidadId && (
                    <span className="text-orange-600 font-medium"> Debe seleccionar una tipología para continuar.</span>
                  )}
                </p>
              </div>

              {selectedUnidad && selectedProyecto && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-blue-900">Unidad Seleccionada</h4>
                      <p className="text-sm text-blue-700">
                        {selectedProyecto.nombre} - Unidad {selectedUnidad.numero}
                      </p>
                      <p className="text-xs text-blue-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {selectedProyecto.direccion}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Comisión</h4>
                      {selectedUnidad.tipoUnidad.comision ? (
                        <>
                          <p className="text-sm text-blue-700">
                            {selectedUnidad.tipoUnidad.comision.nombre}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(selectedUnidad.tipoUnidad.comision.porcentaje * 100).toFixed(1)}% específica
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-blue-700">
                            Comisión del proyecto
                          </p>
                          <p className="text-xs text-blue-600">
                            Se usará la comisión base del edificio
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información del Cliente
              </CardTitle>
              <CardDescription>
                Ingrese el RUT para buscar automáticamente, use el botón de búsqueda para seleccionar de la lista, o complete manualmente para crear uno nuevo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 mb-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT del Cliente *</Label>
                    <div className="relative">
                      <Input
                        id="rut"
                        value={clientData.rut}
                        onChange={(e) => setClientData({ ...clientData, rut: e.target.value })}
                        onBlur={(e) => handleRutChange(e.target.value)}
                        onKeyDown={(e) => {if (e.key === 'Enter') {handleRutChange(clientData.rut)}}}
                        placeholder="ej: 12.345.678-9"
                        disabled={clientHandledByAnotherBroker !== null || clientHasActiveLead !== null}
                        className={`${
                          clientHasActiveLead ? 'border-destructive border-2 bg-destructive/10 dark:bg-destructive/20 font-semibold' :
                          (clientExists === true && !clientHandledByAnotherBroker) || clientCreatedInCurrentSession ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950' :
                          clientHandledByAnotherBroker ? 'border-destructive bg-destructive/10 dark:bg-destructive/20' :
                          clientExists === false ? 'border-yellow-500 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950' :
                          ''
                        } ${clientData.rut ? 'pr-10' : ''}`}
                      />
                      {searchingClient && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
                      )}
                      {clientData.rut && !searchingClient && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearClientData}
                          className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="pt-7">
                  <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Buscar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] w-[95vw] max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle className="text-xl">Buscar Cliente Existente</DialogTitle>
                        <DialogDescription>
                          Busca y selecciona un cliente de tu lista existente. Puedes buscar por nombre, RUT o email.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col space-y-4 flex-1 min-h-0">
                        <div className="relative flex-shrink-0">
                          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="Buscar por nombre, RUT o email..."
                            value={clientSearchTerm}
                            onChange={(e) => setClientSearchTerm(e.target.value)}
                            className="pl-10 text-base h-12"
                          />
                        </div>

                        {filteredClientes.length > 0 && (
                          <div className="flex items-center justify-between text-sm text-muted-foreground flex-shrink-0">
                            <p>
                              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? 's' : ''}
                              {clientSearchTerm && ' encontrado'}
                              {filteredClientes.length !== 1 && clientSearchTerm && 's'}
                            </p>
                            <p className="text-xs">Haz clic en una fila o usa el botón Seleccionar</p>
                          </div>
                        )}

                        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                          <div className="h-full overflow-y-auto max-h-[50vh] pb-8">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead className="min-w-[200px]">Nombre</TableHead>
                                <TableHead className="min-w-[120px]">RUT</TableHead>
                                <TableHead className="min-w-[180px]">Email</TableHead>
                                <TableHead className="min-w-[130px]">Teléfono</TableHead>
                                <TableHead className="min-w-[200px]">Estado</TableHead>
                                <TableHead className="text-right min-w-[100px]">Acción</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredClientes.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    <div className="flex flex-col items-center gap-2">
                                      <User className="h-8 w-8 text-muted-foreground" />
                                      <p>{clientSearchTerm ? 'No se encontraron clientes que coincidan con tu búsqueda' : 'No hay clientes registrados'}</p>
                                      {clientSearchTerm && (
                                        <p className="text-sm">Intenta con otros términos de búsqueda</p>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredClientes.map((cliente) => {
                                  const hasActiveLead = cliente.hasActiveLead && cliente.activeLead
                                  const isDisabled = hasActiveLead

                                  return (
                                  <TableRow
                                    key={cliente.id}
                                    className={`
                                      ${isDisabled
                                        ? 'bg-destructive/10 dark:bg-destructive/20 border-l-4 border-l-destructive hover:bg-destructive/20 dark:hover:bg-destructive/30'
                                        : 'hover:bg-muted/50 cursor-pointer'
                                      }
                                    `}
                                    onClick={() => !isDisabled && selectClientFromModal(cliente)}
                                  >
                                    <TableCell className="font-medium">
                                      <div className="flex items-center gap-2">
                                        {hasActiveLead && (
                                          <span className="text-lg">🚫</span>
                                        )}
                                        {cliente.nombre}
                                      </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">{cliente.rut}</TableCell>
                                    <TableCell className="text-sm">{cliente.email || '-'}</TableCell>
                                    <TableCell className="text-sm">{cliente.telefono || '-'}</TableCell>
                                    <TableCell>
                                      {hasActiveLead ? (
                                        <div className="flex flex-col gap-1">
                                          <Badge variant="destructive" className="w-fit font-semibold">
                                            ⚠ NO DISPONIBLE
                                          </Badge>
                                          <span className="text-xs font-medium text-destructive dark:text-red-400">
                                            Lead activo desde {new Date(cliente.activeLead!.createdAt).toLocaleDateString('es-CL')}
                                          </span>
                                          <span className="text-xs text-destructive/80 dark:text-red-300">
                                            Estado: {cliente.activeLead!.estado}
                                          </span>
                                        </div>
                                      ) : (
                                        <Badge variant="outline" className="w-fit bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 font-semibold">
                                          ✓ Disponible
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (!isDisabled) {
                                            selectClientFromModal(cliente)
                                          }
                                        }}
                                        disabled={isDisabled}
                                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={isDisabled ? `Cliente tiene un lead activo desde ${new Date(cliente.activeLead!.createdAt).toLocaleDateString('es-CL')}` : ''}
                                      >
                                        {isDisabled ? 'No disponible' : 'Seleccionar'}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  )
                                })
                              )}
                            </TableBody>
                          </Table>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {clientExists === true && !clientCreatedInCurrentSession && (
                <p className="text-sm text-green-600 flex items-center">
                  ✓ Cliente encontrado en el sistema
                </p>
              )}
              {clientCreatedInCurrentSession && (
                <p className="text-sm text-blue-600 flex items-center">
                  ✓ Cliente creado exitosamente en esta sesión
                </p>
              )}
              {clientHandledByAnotherBroker && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-red-800 font-medium flex items-center">
                        ⚠ Este cliente ya está siendo manejado por otro vendedor
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Vendedor: {clientHandledByAnotherBroker.broker?.nombre} ({clientHandledByAnotherBroker.broker?.email})
                      </p>
                      <p className="text-xs text-red-600">
                        No puedes crear un lead para este cliente. Contacta al administrador si necesitas transferir el cliente.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearClientData}
                      className="ml-2 h-auto p-1 text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearClientData}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Buscar otro cliente
                    </Button>
                  </div>
                </div>
              )}
              {clientHasActiveLead && !clientHandledByAnotherBroker && (
                <div className="p-4 bg-destructive/10 dark:bg-destructive/20 rounded-lg border-2 border-destructive shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="bg-destructive text-destructive-foreground rounded-full p-2">
                        <span className="text-2xl">🚫</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-base text-destructive dark:text-red-400 font-bold flex items-center mb-2">
                        CLIENTE NO DISPONIBLE
                      </p>
                      <p className="text-sm text-destructive/90 dark:text-red-300 font-semibold mb-1">
                        Este cliente ya tiene un lead activo en proceso
                      </p>
                      <div className="bg-background/50 dark:bg-background/30 p-2 rounded mt-2 space-y-1 border border-border">
                        <p className="text-sm text-destructive/80 dark:text-red-300">
                          <span className="font-semibold">Creado el:</span> {new Date(clientHasActiveLead.createdAt).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-destructive/80 dark:text-red-300">
                          <span className="font-semibold">Estado actual:</span> {clientHasActiveLead.estado}
                        </p>
                        <p className="text-sm text-destructive/80 dark:text-red-300">
                          <span className="font-semibold">Edificio:</span> {clientHasActiveLead.edificio}
                        </p>
                      </div>
                      <p className="text-sm text-destructive/90 dark:text-red-300 mt-3 font-medium">
                        ⏱️ No puedes crear otro lead para este cliente hasta que:
                      </p>
                      <ul className="text-sm text-destructive/80 dark:text-red-300 mt-1 ml-4 list-disc space-y-1">
                        <li>El proceso actual termine (rechazado, cancelado o entregado)</li>
                        <li>O pasen al menos 30 días desde su creación</li>
                      </ul>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearClientData}
                      className="ml-2 h-auto p-1 text-destructive hover:text-destructive hover:bg-destructive/20"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearClientData}
                      className="border-destructive/50 hover:bg-destructive/10 font-semibold"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Buscar otro cliente
                    </Button>
                  </div>
                </div>
              )}
              {clientExists === false && !clientHandledByAnotherBroker && (
                <p className="text-sm text-yellow-600 flex items-center">
                  ⚠ Cliente no encontrado - se creará uno nuevo
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    value={clientData.nombre}
                    onChange={(e) => setClientData({ ...clientData, nombre: e.target.value })}
                    placeholder="Nombre del cliente"
                    disabled={clientHandledByAnotherBroker !== null}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientData.email}
                    onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                    placeholder="email@ejemplo.com"
                    disabled={clientHandledByAnotherBroker !== null}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={clientData.telefono}
                  onChange={(e) => setClientData({ ...clientData, telefono: e.target.value })}
                  placeholder="+56 9 1234 5678"
                  disabled={clientHandledByAnotherBroker !== null}
                />
              </div>

              {clientExists === true && !clientHandledByAnotherBroker && !clientCreatedInCurrentSession && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-sm text-green-800">Cliente Existente</h4>
                  <p className="text-sm text-green-700">
                    Los datos se han cargado desde la base de datos. Puede modificarlos si es necesario.
                  </p>
                </div>
              )}

              {clientCreatedInCurrentSession && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-sm text-blue-800">Cliente Creado</h4>
                  <p className="text-sm text-blue-700">
                    El cliente ha sido creado exitosamente en esta sesión. Puede generar el lead ahora.
                  </p>
                </div>
              )}

              {clientExists === false && !clientHandledByAnotherBroker && !clientCreatedInCurrentSession && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-sm text-yellow-800">Nuevo Cliente</h4>
                  <p className="text-sm text-yellow-700">
                    Complete los datos del cliente. Se creará automáticamente al generar el lead.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Información Financiera
              </CardTitle>
              <CardDescription>
                Precios del lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalLead">Total del Arriendo *</Label>
                  <Input
                    id="totalLead"
                    type="text"
                    value={displayTotalLead}
                    onChange={handleTotalLeadChange}
                    placeholder="ej: 150.000.000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato chileno: punto como separador de miles
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montoUf">Monto en UF (Opcional)</Label>
                  <Input
                    id="montoUf"
                    type="text"
                    value={displayMontoUf}
                    onChange={handleMontoUfChange}
                    placeholder="ej: 4.500,50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato chileno: punto para miles, coma para decimales
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado del Lead</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as typeof formData.estado })}>
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
              </div>

            </CardContent>
          </Card>

          {/* Fechas del Lead */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Fechas del Lead
              </CardTitle>
              <CardDescription>
                Fechas importantes del proceso de venta (opcionales)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaPagoReserva">Fecha Pago de Reserva</Label>
                  <Input
                    id="fechaPagoReserva"
                    type="date"
                    value={formData.fechaPagoReserva}
                    onChange={(e) => {
                      setFormData({ ...formData, fechaPagoReserva: e.target.value })
                      // Recalculate commission rules when date changes
                      if (e.target.value) {
                        fetchCommissionRules(e.target.value)
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaPagoLead">Fecha Pago de Lead</Label>
                  <Input
                    id="fechaPagoLead"
                    type="date"
                    value={formData.fechaPagoLead}
                    onChange={(e) => setFormData({ ...formData, fechaPagoLead: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaCheckin">Fecha Check-in</Label>
                  <Input
                    id="fechaCheckin"
                    type="date"
                    value={formData.fechaCheckin}
                    onChange={(e) => setFormData({ ...formData, fechaCheckin: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Observaciones</CardTitle>
              <CardDescription>
                Información adicional sobre el lead (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales sobre el lead..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Resumen del Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(selectedUnidad && selectedProyecto) || formData.codigoUnidad ? (
                <>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">UNIDAD</h4>
                    {selectedUnidad && selectedProyecto ? (
                      <>
                        <p className="font-medium">{selectedProyecto.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Unidad {selectedUnidad.numero} - {selectedUnidad.tipoUnidad.nombre}
                        </p>
                      </>
                    ) : formData.codigoUnidad ? (
                      <>
                        <p className="font-medium">Código Manual</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.codigoUnidad}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">Sin unidad específica</p>
                        <p className="text-sm text-muted-foreground">
                          Lead general para el edificio
                        </p>
                      </>
                    )}
                  </div>

                  {clientData.nombre && clientData.rut && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">CLIENTE</h4>
                      <p className="font-medium">{clientData.nombre}</p>
                      <p className="text-sm text-muted-foreground">{clientData.rut}</p>
                      {clientData.email && (
                        <p className="text-xs text-muted-foreground">{clientData.email}</p>
                      )}
                    </div>
                  )}

                  {formData.totalLead && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">PRECIO</h4>
                      <p className="font-medium">{formatCurrency(parseFloat(formData.totalLead))}</p>
                      <p className="text-sm text-muted-foreground">{formData.montoUf} UF</p>
                    </div>
                  )}

                  {/* Sección de Comisión Mejorada */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">COMISIÓN</h4>
                    {(formData.edificioId && comisionData.rate > 0) ? (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-2 space-y-3">
                        {/* Badge de Regla Automática */}
                        {comisionData.source === 'rule' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                              ⭐ Regla Automática
                            </span>
                          </div>
                        )}

                        {/* Información de Comisión */}
                        <div>
                          <p className="text-sm font-medium text-green-700">{comisionData.name || 'Sin nombre'}</p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl font-bold text-green-900">
                              {(comisionData.rate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-green-600">
                              {comisionData.source === 'rule' ? 'Regla de comisión aplicada' :
                               comisionData.source === 'unit' ? 'Específica de unidad' :
                               'Base del proyecto'}
                            </p>
                          </div>
                        </div>

                        {/* Monto estimado (solo si hay totalLead) */}
                        {formData.totalLead && comisionData.amount > 0 && (
                          <div className="pt-3 border-t border-green-200">
                            <p className="text-xs text-green-600">Monto estimado:</p>
                            <p className="text-lg font-bold text-green-900">
                              {formatCurrency(comisionData.amount)}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : formData.edificioId ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
                        <p className="text-sm text-gray-600">Sin comisión configurada</p>
                        <p className="text-xs text-gray-500">
                          Este proyecto no tiene comisión base configurada
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                        <p className="text-sm text-blue-600">
                          Selecciona un proyecto para ver la comisión aplicable
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : formData.edificioId ? (
                <>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">EDIFICIO</h4>
                    {(() => {
                      const proyecto = proyectos.find(p => p.id === formData.edificioId)
                      return proyecto ? (
                        <>
                          <p className="font-medium">{proyecto.nombre}</p>
                          <p className="text-sm text-muted-foreground">Lead general</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">Edificio seleccionado</p>
                      )
                    })()}
                  </div>

                  {clientData.nombre && clientData.rut && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">CLIENTE</h4>
                      <p className="font-medium">{clientData.nombre}</p>
                      <p className="text-sm text-muted-foreground">{clientData.rut}</p>
                      {clientData.email && (
                        <p className="text-xs text-muted-foreground">{clientData.email}</p>
                      )}
                    </div>
                  )}

                  {formData.totalLead && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">PRECIO</h4>
                      <p className="font-medium">{formatCurrency(parseFloat(formData.totalLead))}</p>
                      <p className="text-sm text-muted-foreground">{formData.montoUf} UF</p>
                    </div>
                  )}

                  {/* Sección de Comisión Mejorada para vista de solo edificio */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">COMISIÓN</h4>
                    {(formData.edificioId && comisionData.rate > 0) ? (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-2 space-y-3">
                        {/* Badge de Regla Automática */}
                        {comisionData.source === 'rule' && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                              ⭐ Regla Automática
                            </span>
                          </div>
                        )}

                        {/* Porcentaje de Comisión */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-green-700">
                              {comisionData.name || 'Comisión del proyecto'}
                            </p>
                            {formData.totalLead && comisionData.amount > 0 && (
                              <p className="text-lg font-bold text-green-900 mt-1">
                                {formatCurrency(comisionData.amount)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-900">
                              {(comisionData.rate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-green-600">
                              {comisionData.source === 'rule' ? 'Por regla' :
                               comisionData.source === 'unitType' ? 'Por tipología' :
                               'Base del proyecto'}
                            </p>
                          </div>
                        </div>

                        {/* Commission progress info is now shown in the dedicated Commission Preview Card above */}

                        {/* Mensaje informativo si no hay monto */}
                        {!formData.totalLead && (
                          <p className="text-xs text-green-600 italic">
                            Ingresa el monto del arriendo para ver la comisión estimada
                          </p>
                        )}
                      </div>
                    ) : formData.edificioId ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
                        <p className="text-sm text-gray-600">
                          Sin comisión configurada
                        </p>
                        <p className="text-xs text-gray-500">
                          Este proyecto no tiene comisión base configurada
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                        <p className="text-sm text-blue-600">
                          Selecciona un proyecto para ver la comisión
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Selecciona un edificio para continuar
                </p>
              )}
            </CardContent>
          </Card>

          {/* Commission Preview Card */}
          {formData.edificioId && Object.keys(commissionData).length > 0 && (
            <CommissionPreviewCard
              commissionData={commissionData}
              activeComisionId={(() => {
                // Determine active commission ID based on selection hierarchy
                if (selectedUnidad?.tipoUnidad.comision) {
                  return selectedUnidad.tipoUnidad.comision.id
                }
                if (formData.tipoUnidadEdificioId && selectedProyecto) {
                  const tipoUnidad = selectedProyecto.tiposUnidad.find(t => t.id === formData.tipoUnidadEdificioId)
                  if (tipoUnidad?.comision) {
                    return tipoUnidad.comision.id
                  }
                }
                if (selectedProyecto?.comision) {
                  return selectedProyecto.comision.id
                }
                return null
              })()}
              isLoading={loadingCommissionRules}
              selectedDate={formData.fechaPagoReserva ? new Date(formData.fechaPagoReserva) : new Date()}
            />
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saving || !clientData.rut.trim() || !clientData.nombre.trim() || !formData.edificioId || !formData.totalLead || clientHandledByAnotherBroker !== null || clientHasActiveLead !== null}
          >
            {saving ? 'Generando...' :
             clientHandledByAnotherBroker ? 'Cliente no disponible' :
             clientHasActiveLead ? 'Cliente tiene lead activo' :
             'Generar Lead'}
          </Button>
        </div>
      </div>
    </div>
  )
}