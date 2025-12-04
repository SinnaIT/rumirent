'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Save,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  FileText,
  MessageSquare,
  ExternalLink,
  Info,
  ClipboardList
} from 'lucide-react'

interface Broker {
  id: string
  nombre: string
  email: string
  rut: string
}

interface Lead {
  id: string
  codigoUnidad?: string
  totalLead: number
  montoUf: number
  estado: string
  edificio: {
    nombre: string
  }
  createdAt: string
}

interface ClienteDetail {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
  direccion?: string
  fechaNacimiento?: string
  broker: Broker | null
  leads: Lead[]
  createdAt: string
  updatedAt: string
}

export default function ClienteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [cliente, setCliente] = useState<ClienteDetail | null>(null)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    brokerId: ''
  })

  useEffect(() => {
    fetchCliente()
    fetchBrokers()
  }, [params.id])

  const fetchCliente = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/clientes/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setCliente(data.cliente)
        setFormData({
          nombre: data.cliente.nombre || '',
          rut: data.cliente.rut || '',
          email: data.cliente.email || '',
          telefono: data.cliente.telefono || '',
          direccion: data.cliente.direccion || '',
          fechaNacimiento: data.cliente.fechaNacimiento ? new Date(data.cliente.fechaNacimiento).toISOString().split('T')[0] : '',
          brokerId: data.cliente.broker?.id || ''
        })
      } else {
        toast.error('Error al cargar el cliente')
        router.push('/admin/clientes')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
      router.push('/admin/clientes')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrokers = async () => {
    try {
      const response = await fetch('/api/admin/brokers')
      const data = await response.json()

      if (data.success) {
        setBrokers(data.brokers.filter((b: Broker & { activo: boolean }) => b.activo))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (!formData.telefono.trim()) {
      toast.error('El teléfono (WhatsApp) es requerido')
      return
    }

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/clientes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Cliente actualizado exitosamente')
        setIsEditing(false)
        fetchCliente()
      } else {
        toast.error(data.error || 'Error al actualizar el cliente')
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
        nombre: cliente.nombre || '',
        rut: cliente.rut || '',
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        fechaNacimiento: cliente.fechaNacimiento ? new Date(cliente.fechaNacimiento).toISOString().split('T')[0] : '',
        brokerId: cliente.broker?.id || ''
      })
    }
    setIsEditing(false)
  }

  const handleSendEmail = () => {
    if (formData.email) {
      window.open(`mailto:${formData.email}`, '_blank')
    } else {
      toast.error('El cliente no tiene email registrado')
    }
  }

  const handleSendWhatsApp = () => {
    if (formData.telefono) {
      // Limpiar el número de teléfono (quitar espacios, guiones, etc.)
      const phoneNumber = formData.telefono.replace(/\D/g, '')
      window.open(`https://wa.me/${phoneNumber}`, '_blank')
    } else {
      toast.error('El cliente no tiene teléfono registrado')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando cliente...</p>
        </div>
      </div>
    )
  }

  if (!cliente) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/clientes')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{cliente.nombre}</h1>
            <p className="text-muted-foreground">Detalle del Lead</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendEmail}
            disabled={!formData.email}
          >
            <Mail className="w-4 h-4 mr-2" />
            Enviar Email
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendWhatsApp}
            disabled={!formData.telefono}
            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Enviar WhatsApp
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            Información Principal
          </TabsTrigger>
          <TabsTrigger value="leads" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Prospectaciones ({cliente.leads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Información del Cliente */}
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Información del Cliente</CardTitle>
                      <CardDescription>Datos personales y de contacto</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)}>
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? 'Guardando...' : 'Guardar'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">
                      Nombre Completo *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="nombre"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-9 ${!isEditing ? 'bg-muted' : ''}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rut">
                      RUT <span className="text-muted-foreground text-xs">(Opcional)</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rut"
                        value={formData.rut}
                        onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-9 ${!isEditing ? 'bg-muted' : ''}`}
                        placeholder="12345678-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-muted-foreground text-xs">(Opcional)</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-9 ${!isEditing ? 'bg-muted' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">
                      WhatsApp *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-9 ${!isEditing ? 'bg-muted' : ''}`}
                        placeholder="+56 9 1234 5678"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaNacimiento">
                      Fecha de Nacimiento <span className="text-muted-foreground text-xs">(Opcional)</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fechaNacimiento"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                        disabled={!isEditing}
                        className={`pl-9 ${!isEditing ? 'bg-muted' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brokerId">
                      Broker Asignado
                    </Label>
                    <Select
                      value={formData.brokerId}
                      onValueChange={(value) => setFormData({ ...formData, brokerId: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className={!isEditing ? 'bg-muted' : ''}>
                        <SelectValue placeholder="Seleccionar broker" />
                      </SelectTrigger>
                      <SelectContent>
                        {brokers.map((broker) => (
                          <SelectItem key={broker.id} value={broker.id}>
                            {broker.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">
                    Dirección <span className="text-muted-foreground text-xs">(Opcional)</span>
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      disabled={!isEditing}
                      className={`pl-9 ${!isEditing ? 'bg-muted' : ''}`}
                      rows={2}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Reservas</p>
                <p className="text-2xl font-bold">{cliente.leads.length}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Registro</p>
                <p className="text-sm font-medium">
                  {new Date(cliente.createdAt).toLocaleDateString('es-CL')}
                </p>
              </div>
              {cliente.broker && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Broker</p>
                    <p className="text-sm font-medium">{cliente.broker.nombre}</p>
                    <p className="text-xs text-muted-foreground">{cliente.broker.email}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Información de Contacto Rápido */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {formData.telefono && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSendWhatsApp}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {formData.telefono}
                </Button>
              )}
              {formData.email && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleSendEmail}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {formData.email}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
        </TabsContent>

        <TabsContent value="leads" className="space-y-6">
          {/* Historial de Prospectaciones */}
          {cliente.leads.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Historial de Prospectaciones</CardTitle>
                <CardDescription>Listado de todas las prospectaciones (leads) del cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cliente.leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/leads?clienteId=${cliente.id}`)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{lead.edificio.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {lead.codigoUnidad || 'Sin código'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(lead.createdAt).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={
                          lead.estado === 'DEPARTAMENTO_ENTREGADO' ? 'default' :
                          lead.estado === 'CONTRATO_PAGADO' ? 'default' :
                          lead.estado === 'CONTRATO_FIRMADO' ? 'secondary' :
                          lead.estado === 'APROBADO' ? 'secondary' :
                          lead.estado === 'RESERVA_PAGADA' ? 'secondary' :
                          lead.estado === 'RECHAZADO' ? 'destructive' :
                          'outline'
                        }>
                          {lead.estado.replace(/_/g, ' ')}
                        </Badge>
                        <p className="text-sm font-medium">
                          ${lead.totalLead.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No hay prospectaciones
                </h3>
                <p className="text-muted-foreground text-center">
                  Este cliente aún no tiene prospectaciones registradas
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
