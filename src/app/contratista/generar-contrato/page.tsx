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
  estado: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'
  descripcion?: string
  metros2?: number
  tipoUnidad: {
    id: string
    nombre: string
    codigo: string
    comision: Comision | null
  }
  createdAt: string
  updatedAt: string
}

interface Proyecto {
  id: string
  nombre: string
  direccion: string
  unidades: Unidad[]
}

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
}

const ESTADOS_CONTRATO = [
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'RECHAZADO', label: 'Rechazado' }
]

export default function GenerarContratoPage() {
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
  const [showClientModal, setShowClientModal] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    edificioId: '',
    unidadId: unidadIdFromParams ?? '',
    codigoUnidad: '',
    clienteId: '',
    totalContrato: '',
    montoUf: '',
    comision: '',
    estado: 'ENTREGADO' as const,
    fechaPagoReserva: '',
    fechaPagoContrato: '',
    fechaCheckin: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchProyectos()
    fetchClientes()
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
      const response = await fetch('/api/contratista/proyectos')
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
      const response = await fetch('/api/contratista/clientes')
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

  const searchClientByRut = async (rut: string) => {
    if (!rut.trim()) {
      setClientExists(null)
      setClientData({ rut: '', nombre: '', email: '', telefono: '' })
      setFormData({ ...formData, clienteId: '' })
      return
    }

    try {
      setSearchingClient(true)
      const response = await fetch(`/api/contratista/clientes/search?rut=${encodeURIComponent(rut)}`)
      const data = await response.json()

      if (data.success && data.cliente) {
        // Cliente encontrado
        setClientExists(true)
        setClientData({
          rut: data.cliente.rut,
          nombre: data.cliente.nombre,
          email: data.cliente.email || '',
          telefono: data.cliente.telefono || ''
        })
        setFormData({ ...formData, clienteId: data.cliente.id })
      } else {
        // Cliente no encontrado
        setClientExists(false)
        setClientData({ rut, nombre: '', email: '', telefono: '' })
        setFormData({ ...formData, clienteId: '' })
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al buscar cliente')
      setClientExists(null)
    } finally {
      setSearchingClient(false)
    }
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
    setFormData({ ...formData, edificioId, unidadId: '', codigoUnidad: '' })
    setSelectedUnidad(null)
  }

  const handleUnidadChange = (unidadId: string) => {
    const proyecto = proyectos.find(p => p.id === formData.edificioId)
    if (proyecto) {
      const unidad = proyecto.unidades.find(u => u.id === unidadId)
      if (unidad) {
        setSelectedUnidad(unidad)
        setFormData({ ...formData, unidadId, codigoUnidad: '' })
      }
    }
  }

  const calculateComision = () => {
    if (!formData.totalContrato) return { amount: 0, rate: 0, source: 'none' }

    const precio = parseFloat(formData.totalContrato)
    if (isNaN(precio)) return { amount: 0, rate: 0, source: 'none' }

    // Prioridad: Comisión específica de la unidad > Comisión del proyecto > 0
    if (selectedUnidad?.tipoUnidad.comision) {
      const rate = selectedUnidad.tipoUnidad.comision.porcentaje
      return {
        amount: precio * rate,
        rate: rate,
        source: 'unit',
        name: selectedUnidad.tipoUnidad.comision.nombre
      }
    }

    if (selectedProyecto?.comision) {
      const rate = selectedProyecto.comision.porcentaje
      return {
        amount: precio * rate,
        rate: rate,
        source: 'project',
        name: selectedProyecto.comision.nombre
      }
    }

    return { amount: 0, rate: 0, source: 'none' }
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

    if (!formData.edificioId) {
      toast.error('Debe seleccionar un edificio')
      return
    }

    if (!formData.totalContrato || !formData.montoUf) {
      toast.error('Total del contrato y monto UF son requeridos')
      return
    }

    const totalContrato = parseFloat(formData.totalContrato)
    const montoUf = parseFloat(formData.montoUf)

    if (isNaN(totalContrato) || totalContrato <= 0) {
      toast.error('El total del contrato debe ser un número válido mayor a 0')
      return
    }

    if (isNaN(montoUf) || montoUf <= 0) {
      toast.error('El monto UF debe ser un número válido mayor a 0')
      return
    }

    try {
      setSaving(true)

      let clienteId = formData.clienteId

      // Si el cliente no existe, crearlo primero
      if (!clientExists && clientData.rut.trim() && clientData.nombre.trim()) {
        const clientResponse = await fetch('/api/contratista/clientes', {
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
          toast.success('Cliente creado exitosamente')
        } else {
          toast.error(clientData_response.error || 'Error al crear cliente')
          return
        }
      }

      const comisionData = calculateComision()
      const comisionCalculada = comisionData.amount

      const response = await fetch('/api/contratista/contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unidadId: formData.unidadId || undefined,
          codigoUnidad: formData.codigoUnidad || undefined,
          clienteId: clienteId,
          edificioId: formData.edificioId,
          totalContrato,
          montoUf,
          comision: comisionCalculada,
          estado: formData.estado,
          fechaPagoReserva: formData.fechaPagoReserva || undefined,
          fechaPagoContrato: formData.fechaPagoContrato || undefined,
          fechaCheckin: formData.fechaCheckin || undefined,
          observaciones: formData.observaciones || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Contrato generado exitosamente')
        router.push('/contratista/ventas')
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount)
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
            <h1 className="text-2xl font-bold text-foreground">Generar Nuevo Contrato</h1>
            <p className="text-muted-foreground">
              Crea un nuevo contrato de venta para una unidad disponible
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {formData.edificioId && proyectos
                        .find(p => p.id === formData.edificioId)
                        ?.unidades.map((unidad) => (
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
                  Use este campo si la unidad no está registrada en el sistema
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
                        className={`${
                          clientExists === true ? 'border-green-500 bg-green-50' :
                          clientExists === false ? 'border-yellow-500 bg-yellow-50' :
                          ''
                        }`}
                      />
                      {searchingClient && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        </div>
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
                          <div className="h-full overflow-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background">
                              <TableRow>
                                <TableHead className="min-w-[200px]">Nombre</TableHead>
                                <TableHead className="min-w-[120px]">RUT</TableHead>
                                <TableHead className="min-w-[180px]">Email</TableHead>
                                <TableHead className="min-w-[130px]">Teléfono</TableHead>
                                <TableHead className="text-right min-w-[100px]">Acción</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredClientes.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                                filteredClientes.map((cliente) => (
                                  <TableRow key={cliente.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => selectClientFromModal(cliente)}>
                                    <TableCell className="font-medium">{cliente.nombre}</TableCell>
                                    <TableCell className="font-mono text-sm">{cliente.rut}</TableCell>
                                    <TableCell className="text-sm">{cliente.email || '-'}</TableCell>
                                    <TableCell className="text-sm">{cliente.telefono || '-'}</TableCell>
                                    <TableCell className="text-right">
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          selectClientFromModal(cliente)
                                        }}
                                        className="bg-primary hover:bg-primary/90"
                                      >
                                        Seleccionar
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))
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

              {clientExists === true && (
                <p className="text-sm text-green-600 flex items-center">
                  ✓ Cliente encontrado en el sistema
                </p>
              )}
              {clientExists === false && (
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
                />
              </div>

              {clientExists === true && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-sm text-green-800">Cliente Existente</h4>
                  <p className="text-sm text-green-700">
                    Los datos se han cargado desde la base de datos. Puede modificarlos si es necesario.
                  </p>
                </div>
              )}

              {clientExists === false && (
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-sm text-yellow-800">Nuevo Cliente</h4>
                  <p className="text-sm text-yellow-700">
                    Complete los datos del cliente. Se creará automáticamente al generar el contrato.
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
                Precios del contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalContrato">Total del Contrato *</Label>
                  <Input
                    id="totalContrato"
                    type="number"
                    value={formData.totalContrato}
                    onChange={(e) => setFormData({ ...formData, totalContrato: e.target.value })}
                    placeholder="ej: 150000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="montoUf">Monto en UF *</Label>
                  <Input
                    id="montoUf"
                    type="number"
                    step="0.01"
                    value={formData.montoUf}
                    onChange={(e) => setFormData({ ...formData, montoUf: e.target.value })}
                    placeholder="ej: 4500.50"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado del Contrato</Label>
                  <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
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

          {/* Fechas del Contrato */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Fechas del Contrato
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
                    onChange={(e) => setFormData({ ...formData, fechaPagoReserva: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaPagoContrato">Fecha Pago de Contrato</Label>
                  <Input
                    id="fechaPagoContrato"
                    type="date"
                    value={formData.fechaPagoContrato}
                    onChange={(e) => setFormData({ ...formData, fechaPagoContrato: e.target.value })}
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
                Información adicional sobre el contrato (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                placeholder="Observaciones adicionales sobre el contrato..."
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
                Resumen del Contrato
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
                          Contrato general para el edificio
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

                  {formData.totalContrato && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">PRECIO</h4>
                      <p className="font-medium">{formatCurrency(parseFloat(formData.totalContrato))}</p>
                      <p className="text-sm text-muted-foreground">{formData.montoUf} UF</p>
                    </div>
                  )}

                  {/* Sección de Comisión Siempre Visible */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">COMISIÓN</h4>
                    {comisionData.amount > 0 ? (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-green-900">
                              {formatCurrency(comisionData.amount)}
                            </p>
                            <p className="text-sm text-green-700">
                              {comisionData.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-900">
                              {(comisionData.rate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-green-600">
                              {comisionData.source === 'unit' ? 'Específica de unidad' : 'Base del proyecto'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : formData.totalContrato ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
                        <p className="text-sm text-gray-600">
                          Sin comisión configurada
                        </p>
                        <p className="text-xs text-gray-500">
                          {!selectedProyecto ? 'Selecciona un proyecto para ver comisiones disponibles' :
                           'Este proyecto no tiene comisión base configurada'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                        <p className="text-sm text-blue-600">
                          Ingresa el monto del contrato para calcular la comisión
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
                          <p className="text-sm text-muted-foreground">Contrato general</p>
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

                  {formData.totalContrato && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">PRECIO</h4>
                      <p className="font-medium">{formatCurrency(parseFloat(formData.totalContrato))}</p>
                      <p className="text-sm text-muted-foreground">{formData.montoUf} UF</p>
                    </div>
                  )}

                  {/* Sección de Comisión para vista de solo edificio */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">COMISIÓN</h4>
                    {comisionData.amount > 0 ? (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200 mt-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-lg font-bold text-green-900">
                              {formatCurrency(comisionData.amount)}
                            </p>
                            <p className="text-sm text-green-700">
                              {comisionData.name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-green-900">
                              {(comisionData.rate * 100).toFixed(1)}%
                            </p>
                            <p className="text-xs text-green-600">
                              Base del proyecto
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : formData.totalContrato ? (
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
                          Ingresa el monto del contrato para calcular la comisión
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

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saving || !clientData.rut.trim() || !clientData.nombre.trim() || !formData.edificioId || !formData.totalContrato}
          >
            {saving ? 'Generando...' : 'Generar Contrato'}
          </Button>
        </div>
      </div>
    </div>
  )
}