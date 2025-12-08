'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Users, Eye, Search, Mail, Phone, MapPin, Calendar, MessageCircle, Edit2, Save, X } from 'lucide-react'

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
  direccion?: string
  fechaNacimiento?: string
  hasActiveLead?: boolean
  activeLead?: {
    id: string
    createdAt: string
    estado: string
    edificio: string
  } | null
  createdAt: string
  updatedAt: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
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
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      console.log('[LEADS] Fetching clientes from /api/broker/clientes')
      const response = await fetch('/api/broker/clientes')
      console.log('[LEADS] Response status:', response.status)
      console.log('[LEADS] Response ok:', response.ok)

      const data = await response.json()
      console.log('[LEADS] Response data:', data)

      if (data.success) {
        console.log('[LEADS] Clientes received:', data.clientes.length)
        setClientes(data.clientes)
      } else {
        console.error('[LEADS] Error in response:', data.error)
        toast.error(data.error || 'Error al cargar leads')
      }
    } catch (error) {
      console.error('[LEADS] Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (clienteId: string) => {
    router.push(`/broker/leads/${clienteId}`)
  }

  const handleSendWhatsApp = (telefono: string) => {
    const phoneNumber = telefono.replace(/\D/g, '')
    window.open(`https://wa.me/${phoneNumber}`, '_blank')
  }

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente)
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
    setIsEditModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setEditingCliente(null)
    setSaving(false)
  }

  const handleSaveCliente = async () => {
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast.error('Nombre y teléfono (WhatsApp) son requeridos')
      return
    }

    if (!editingCliente) return

    try {
      setSaving(true)

      const response = await fetch(`/api/broker/clientes/${editingCliente.id}`, {
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
        toast.success('Cliente actualizado exitosamente')
        handleCloseModal()
        fetchClientes() // Recargar la lista
      } else {
        toast.error(data.error || 'Error al actualizar cliente')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.telefono && cliente.telefono.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Mis Leads
          </h1>
          <p className="text-muted-foreground">
            Gestiona la información de tus clientes potenciales
          </p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUT, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{clientes.length}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            {filteredClientes.length} lead{filteredClientes.length !== 1 ? 's' : ''}
            {searchTerm && ' encontrado'}
            {filteredClientes.length !== 1 && searchTerm && 's'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Acciones</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Fecha Nacimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p>
                          {searchTerm
                            ? 'No se encontraron leads que coincidan con tu búsqueda'
                            : 'No hay leads registrados'}
                        </p>
                        {searchTerm && (
                          <p className="text-sm">Intenta con otros términos de búsqueda</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          {cliente.telefono && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                              onClick={() => handleSendWhatsApp(cliente.telefono!)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditCliente(cliente)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(cliente.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.hasActiveLead ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="destructive" className="w-fit">
                              🚫 Lead Activo
                            </Badge>
                            {cliente.activeLead && (
                              <span className="text-xs text-destructive dark:text-red-400">
                                Desde {new Date(cliente.activeLead.createdAt).toLocaleDateString('es-CL')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="w-fit bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            ✓ Disponible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{cliente.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{cliente.rut}</TableCell>
                      <TableCell>
                        {cliente.email ? (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            {cliente.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.telefono ? (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {cliente.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.direccion ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {cliente.direccion}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.fechaNacimiento ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatDate(cliente.fechaNacimiento)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Actualiza la información del cliente. Los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">
                Nombre *
              </Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-rut">
                RUT
              </Label>
              <Input
                id="edit-rut"
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                placeholder="12.345.678-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-telefono">
                Teléfono (WhatsApp) *
              </Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+56 9 1234 5678"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-direccion">
                Dirección
              </Label>
              <Input
                id="edit-direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle 123, Comuna, Ciudad"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-fechaNacimiento">
                Fecha de Nacimiento
              </Label>
              <Input
                id="edit-fechaNacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseModal}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCliente}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
