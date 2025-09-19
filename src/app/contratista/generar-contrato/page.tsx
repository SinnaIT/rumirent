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
  Calendar
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
    comision: Comision
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

const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja', color: 'bg-gray-100 text-gray-800', multiplier: 1.0 },
  { value: 'MEDIA', label: 'Media', color: 'bg-blue-100 text-blue-800', multiplier: 1.2 },
  { value: 'ALTA', label: 'Alta', color: 'bg-orange-100 text-orange-800', multiplier: 1.5 },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-100 text-red-800', multiplier: 2.0 }
]

const ESTADOS_CONTRATO = [
  { value: 'POSTULACION', label: 'Postulación' },
  { value: 'RESERVADO', label: 'Reservado' },
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'CHECKIN_REALIZADO', label: 'Check-in Realizado' },
  { value: 'CANCELADO', label: 'Cancelado' }
]

export default function GenerarContratoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const unidadIdFromParams = searchParams.get('unidadId')

  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null)
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    proyectoId: '',
    unidadId: unidadIdFromParams || '',
    unidadManual: '',
    prioridad: 'BAJA' as const,
    rutCliente: '',
    nombreCliente: '',
    precioPesos: '',
    precioUF: '',
    estado: 'POSTULACION' as const,
    fechaPagoReserva: '',
    fechaPagoContrato: '',
    fechaCheckin: '',
    observaciones: ''
  })

  useEffect(() => {
    fetchProyectos()
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
            proyectoId: proyecto.id,
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

  const handleProyectoChange = (proyectoId: string) => {
    const proyecto = proyectos.find(p => p.id === proyectoId)
    setSelectedProyecto(proyecto || null)
    setFormData({ ...formData, proyectoId, unidadId: '' })
    setSelectedUnidad(null)
  }

  const handleUnidadChange = (unidadId: string) => {
    const proyecto = proyectos.find(p => p.id === formData.proyectoId)
    if (proyecto) {
      const unidad = proyecto.unidades.find(u => u.id === unidadId)
      if (unidad) {
        setSelectedUnidad(unidad)
        setFormData({ ...formData, unidadId })
      }
    }
  }

  const calculateComision = () => {
    if (!selectedUnidad || !formData.precioPesos) return 0

    const precio = parseFloat(formData.precioPesos)
    const prioridad = PRIORIDADES.find(p => p.value === formData.prioridad)
    const baseComision = selectedUnidad.tipoUnidad.comision.porcentaje
    const multiplier = prioridad?.multiplier || 1.0

    return precio * baseComision * multiplier
  }

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.unidadId && !formData.unidadManual.trim()) {
      toast.error('Debe seleccionar una unidad del sistema o ingresar una unidad manual')
      return
    }

    if (!formData.rutCliente.trim() || !formData.nombreCliente.trim()) {
      toast.error('RUT y nombre del cliente son requeridos')
      return
    }

    if (!formData.precioPesos || !formData.precioUF) {
      toast.error('Precio en pesos y UF son requeridos')
      return
    }

    const precioPesos = parseFloat(formData.precioPesos)
    const precioUF = parseFloat(formData.precioUF)

    if (isNaN(precioPesos) || precioPesos <= 0) {
      toast.error('El precio en pesos debe ser un número válido mayor a 0')
      return
    }

    if (isNaN(precioUF) || precioUF <= 0) {
      toast.error('El precio en UF debe ser un número válido mayor a 0')
      return
    }

    try {
      setSaving(true)

      const comisionCalculada = calculateComision()

      const response = await fetch('/api/contratista/contratos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unidadId: formData.unidadId || undefined,
          unidadManual: formData.unidadManual || undefined,
          prioridad: formData.prioridad,
          rutCliente: formData.rutCliente,
          nombreCliente: formData.nombreCliente,
          precioPesos,
          precioUF,
          comisionAsesor: comisionCalculada,
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

  const prioridadSelected = PRIORIDADES.find(p => p.value === formData.prioridad)
  const comisionCalculada = calculateComision()

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
                Seleccionar Unidad
              </CardTitle>
              <CardDescription>
                Elige el proyecto y la unidad para el contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proyecto">Proyecto *</Label>
                  <Select value={formData.proyectoId} onValueChange={handleProyectoChange}>
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
                  <Label htmlFor="unidad">Unidad *</Label>
                  <Select
                    value={formData.unidadId}
                    onValueChange={handleUnidadChange}
                    disabled={!formData.proyectoId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.proyectoId && proyectos
                        .find(p => p.id === formData.proyectoId)
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
                <Label htmlFor="unidadManual">O ingrese unidad manualmente</Label>
                <Input
                  id="unidadManual"
                  value={formData.unidadManual}
                  onChange={(e) => setFormData({ ...formData, unidadManual: e.target.value })}
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
                      <h4 className="font-medium text-blue-900">Comisión Base</h4>
                      <p className="text-sm text-blue-700">
                        {selectedUnidad.tipoUnidad.comision.nombre}
                      </p>
                      <p className="text-xs text-blue-600">
                        {(selectedUnidad.tipoUnidad.comision.porcentaje * 100).toFixed(1)}% base
                      </p>
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
                Datos del cliente que realizará la compra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rutCliente">RUT del Cliente *</Label>
                  <Input
                    id="rutCliente"
                    value={formData.rutCliente}
                    onChange={(e) => setFormData({ ...formData, rutCliente: e.target.value })}
                    placeholder="ej: 12.345.678-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreCliente">Nombre Completo *</Label>
                  <Input
                    id="nombreCliente"
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                    placeholder="ej: Juan Pérez González"
                  />
                </div>
              </div>
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
                Precios y prioridad de la venta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precioPesos">Precio en Pesos *</Label>
                  <Input
                    id="precioPesos"
                    type="number"
                    value={formData.precioPesos}
                    onChange={(e) => setFormData({ ...formData, precioPesos: e.target.value })}
                    placeholder="ej: 150000000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="precioUF">Precio en UF *</Label>
                  <Input
                    id="precioUF"
                    type="number"
                    step="0.01"
                    value={formData.precioUF}
                    onChange={(e) => setFormData({ ...formData, precioUF: e.target.value })}
                    placeholder="ej: 4500.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad de Venta</Label>
                  <Select value={formData.prioridad} onValueChange={(value: any) => setFormData({ ...formData, prioridad: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORIDADES.map((prioridad) => (
                        <SelectItem key={prioridad.value} value={prioridad.value}>
                          {prioridad.label} (x{prioridad.multiplier})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {prioridadSelected && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-orange-900">
                        Prioridad Seleccionada
                      </h4>
                      <p className="text-sm text-orange-700">
                        <Badge className={prioridadSelected.color}>
                          {prioridadSelected.label}
                        </Badge>
                        <span className="ml-2">
                          Multiplicador: x{prioridadSelected.multiplier}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
              {(selectedUnidad && selectedProyecto) || formData.unidadManual ? (
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
                    ) : (
                      <>
                        <p className="font-medium">Unidad Manual</p>
                        <p className="text-sm text-muted-foreground">
                          {formData.unidadManual}
                        </p>
                      </>
                    )}
                  </div>

                  {formData.nombreCliente && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">CLIENTE</h4>
                      <p className="font-medium">{formData.nombreCliente}</p>
                      <p className="text-sm text-muted-foreground">{formData.rutCliente}</p>
                    </div>
                  )}

                  {formData.precioPesos && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground">PRECIO</h4>
                      <p className="font-medium">{formatCurrency(parseFloat(formData.precioPesos))}</p>
                      <p className="text-sm text-muted-foreground">{formData.precioUF} UF</p>
                    </div>
                  )}

                  {comisionCalculada > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-medium text-sm text-green-800">COMISIÓN CALCULADA</h4>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(comisionCalculada)}
                      </p>
                      <p className="text-xs text-green-600">
                        Base: {(selectedUnidad.tipoUnidad.comision.porcentaje * 100).toFixed(1)}% ×
                        Prioridad: x{prioridadSelected?.multiplier}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Selecciona una unidad del sistema o ingresa una unidad manual para ver el resumen
                </p>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={saving || (!selectedUnidad && !formData.unidadManual.trim()) || !formData.nombreCliente || !formData.precioPesos}
          >
            {saving ? 'Generando...' : 'Generar Contrato'}
          </Button>
        </div>
      </div>
    </div>
  )
}