'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  CreditCard,
  MessageCircle,
  Building2,
  DollarSign,
} from 'lucide-react'

interface Lead {
  id: string
  clienteNombre: string
  clienteRut: string
  edificioNombre: string
  codigoUnidad: string
  totalLead: number
  montoUf?: number
  estado: string
  comision: number
  fechaCheckin: string | null
  createdAt: string
}

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
  direccion?: string
  fechaNacimiento?: string
  createdAt: string
  updatedAt: string
  leads: Lead[]
}

export default function ClienteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params?.id as string

  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: ''
  })

  useEffect(() => {
    if (clienteId) {
      fetchCliente()
    }
  }, [clienteId])

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre,
        rut: cliente.rut,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        fechaNacimiento: cliente.fechaNacimiento
          ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0]
          : ''
      })
    }
  }, [cliente])

  const fetchCliente = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/broker/clientes/${clienteId}`)
      const data = await response.json()

      if (data.success) {
        setCliente(data.cliente)
      } else {
        toast.error('Error al cargar lead')
        router.push('/broker/leads')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
      router.push('/broker/leads')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast.error('Nombre y teléfono (WhatsApp) son requeridos')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(`/api/broker/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          rut: formData.rut.trim() || null,
          email: formData.email.trim() || null,
          telefono: formData.telefono.trim(),
          direccion: formData.direccion.trim() || null,
          fechaNacimiento: formData.fechaNacimiento || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Lead actualizado exitosamente')
        setEditing(false)
        fetchCliente()
      } else {
        toast.error(data.error || 'Error al actualizar lead')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre,
        rut: cliente.rut,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        fechaNacimiento: cliente.fechaNacimiento
          ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0]
          : ''
      })
    }
    setEditing(false)
  }

  const handleSendWhatsApp = () => {
    if (formData.telefono) {
      const phoneNumber = formData.telefono.replace(/\D/g, '')
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
    }
  }

  const handleSendEmail = () => {
    if (formData.email) {
      window.location.href = `mailto:${formData.email}`
    }
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

  const getEstadoBadge = (estado: string) => {
    const colors = {
      ENTREGADO: 'bg-green-100 text-green-800 border-green-200',
      RESERVA_PAGADA: 'bg-blue-100 text-blue-800 border-blue-200',
      APROBADO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      RECHAZADO: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[estado as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

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

  if (!cliente) {
    return null
  }

  // Calculate summary stats
  const totalReservas = cliente.leads.length
  const totalComisiones = cliente.leads.reduce((sum, lead) => sum + lead.comision, 0)
  const totalMonto = cliente.leads.reduce((sum, lead) => sum + lead.totalLead, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/broker/leads')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Mis Leads
        </Button>

        <div className="flex gap-2">
          {!editing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </Button>
              {formData.telefono && (
                <Button
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                  onClick={handleSendWhatsApp}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              )}
              {formData.email && (
                <Button
                  variant="outline"
                  onClick={handleSendEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reservas</p>
                <p className="text-2xl font-bold">{totalReservas}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMonto)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(totalComisiones)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cliente Info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  <User className="h-4 w-4 inline mr-1" />
                  Nombre *
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  disabled={!editing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rut">
                  <CreditCard className="h-4 w-4 inline mr-1" />
                  RUT
                </Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  disabled={!editing}
                  placeholder="12.345.678-9"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editing}
                  placeholder="email@ejemplo.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Teléfono (WhatsApp) *
                </Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  disabled={!editing}
                  placeholder="+56 9 1234 5678"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Dirección
                </Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  disabled={!editing}
                  placeholder="Calle 123, Comuna, Ciudad"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Fecha de Nacimiento
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  disabled={!editing}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial de Reservas */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {cliente.leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Este lead aún no tiene reservas registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Edificio</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                    <TableHead className="text-center">Check-in</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cliente.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.edificioNombre}</TableCell>
                      <TableCell>{lead.codigoUnidad}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getEstadoBadge(lead.estado)}>
                          {lead.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(lead.totalLead)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatCurrency(lead.comision)}
                      </TableCell>
                      <TableCell className="text-center">
                        {lead.fechaCheckin ? '✓' : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
