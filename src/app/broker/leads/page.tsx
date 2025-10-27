'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Users, Edit, Search, Mail, Phone, MapPin, Calendar } from 'lucide-react'

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
}

export default function LeadsPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state para edición
  const [formData, setFormData] = useState({
    telefono: '',
    email: '',
    direccion: '',
    fechaNacimiento: ''
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  useEffect(() => {
    if (editingCliente) {
      setFormData({
        telefono: editingCliente.telefono || '',
        email: editingCliente.email || '',
        direccion: editingCliente.direccion || '',
        fechaNacimiento: editingCliente.fechaNacimiento
          ? new Date(editingCliente.fechaNacimiento).toISOString().split('T')[0]
          : ''
      })
    }
  }, [editingCliente])

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

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente)
    setShowEditDialog(true)
  }

  const handleCloseDialog = () => {
    setShowEditDialog(false)
    setEditingCliente(null)
    setFormData({
      telefono: '',
      email: '',
      direccion: '',
      fechaNacimiento: ''
    })
  }

  const handleSave = async () => {
    if (!editingCliente) return

    try {
      setSaving(true)

      const response = await fetch(`/api/broker/clientes/${editingCliente.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          telefono: formData.telefono.trim() || null,
          email: formData.email.trim() || null,
          direccion: formData.direccion.trim() || null,
          fechaNacimiento: formData.fechaNacimiento || null
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Lead actualizado exitosamente')
        fetchClientes()
        handleCloseDialog()
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Fecha Nacimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Edición */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>
              Actualiza la información de contacto del lead. Los campos nombre y RUT no son editables.
            </DialogDescription>
          </DialogHeader>

          {editingCliente && (
            <div className="space-y-4 py-4">
              {/* Información no editable */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Nombre</Label>
                  <p className="font-medium">{editingCliente.nombre}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">RUT</Label>
                  <p className="font-medium font-mono">{editingCliente.rut}</p>
                </div>
              </div>

              {/* Campos editables */}
              <div className="grid grid-cols-2 gap-4">
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
                    placeholder="email@ejemplo.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
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
                />
              </div>

              {/* Botones de acción */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
