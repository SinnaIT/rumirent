'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  UserCheck,
  Search,
  RefreshCw,
  Mail,
  Phone,
  FileText,
  Edit,
  Plus,
  MapPin,
  Calendar,
  MessageCircle,
  Eye
} from 'lucide-react'
import { ImportClientesDialog } from '@/components/admin/ImportClientesDialog'

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
  direccion?: string
  fechaNacimiento?: string
  broker: Broker | null
  totalLeads: number
  createdAt: string
  updatedAt: string
}

interface Broker {
  id: string
  nombre: string
  email: string
  rut: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchField, setSearchField] = useState('nombre')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    email: '',
    telefono: '',
    direccion: '',
    fechaNacimiento: '',
    brokerId: 'UNASSIGNED'
  })

  useEffect(() => {
    fetchClientes()
    fetchBrokers()
  }, [])

  useEffect(() => {
    // Filtrar clientes basado en el campo y término de búsqueda
    if (!searchTerm.trim()) {
      setFilteredClientes(clientes)
      return
    }

    const filtered = clientes.filter(cliente => {
      const term = searchTerm.toLowerCase()

      switch (searchField) {
        case 'nombre':
          return cliente.nombre.toLowerCase().includes(term)
        case 'rut':
          return cliente.rut.toLowerCase().includes(term)
        case 'email':
          return cliente.email?.toLowerCase().includes(term) || false
        case 'telefono':
          return cliente.telefono?.toLowerCase().includes(term) || false
        case 'broker':
          return cliente.broker?.nombre.toLowerCase().includes(term) ||
                 cliente.broker?.rut.toLowerCase().includes(term) || false
        default:
          return cliente.nombre.toLowerCase().includes(term)
      }
    })
    setFilteredClientes(filtered)
  }, [clientes, searchTerm, searchField])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/clientes')
      const data = await response.json()

      if (data.success) {
        setClientes(data.clientes)
      } else {
        toast.error('Error al cargar clientes')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
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

  const resetForm = () => {
    setFormData({
      nombre: '',
      rut: '',
      email: '',
      telefono: '',
      direccion: '',
      fechaNacimiento: '',
      brokerId: 'UNASSIGNED'
    })
    setEditingCliente(null)
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (cliente: Cliente) => {
    setFormData({
      nombre: cliente.nombre,
      rut: cliente.rut,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || '',
      fechaNacimiento: cliente.fechaNacimiento ? cliente.fechaNacimiento.split('T')[0] : '',
      brokerId: cliente.broker?.id || 'UNASSIGNED'
    })
    setEditingCliente(cliente)
    setIsEditDialogOpen(true)
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

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      toast.error('Nombre y Telefono son requeridos')
      return
    }

    try {
      setSaving(true)

      // Convert UNASSIGNED to empty string for the API
      const dataToSend = {
        ...formData,
        brokerId: formData.brokerId === 'UNASSIGNED' ? '' : formData.brokerId
      }

      if (editingCliente) {
        // Editar cliente existente
        const response = await fetch(`/api/admin/clientes/${editingCliente.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend)
        })

        const data = await response.json()

        if (data.success) {
          toast.success(data.message)
          setIsEditDialogOpen(false)
          resetForm()
          fetchClientes()
        } else {
          toast.error(data.error)
        }
      } else {
        // Crear nuevo cliente
        const response = await fetch('/api/admin/clientes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToSend)
        })

        const data = await response.json()

        if (data.success) {
          toast.success(data.message)
          setIsCreateDialogOpen(false)
          resetForm()
          fetchClientes()
        } else {
          toast.error(data.error)
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando clientes...</p>
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
            Visualiza todos los clientes registrados por los brokers
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchClientes}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <ImportClientesDialog onImportComplete={fetchClientes} />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Crear Nuevo Cliente
                </DialogTitle>
                <DialogDescription>
                  Crea un nuevo cliente y asígnalo a un broker.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-nombre">Nombre *</Label>
                  <Input
                    id="create-nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre completo del cliente"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-rut">RUT (opcional)</Label>
                  <Input
                    id="create-rut"
                    value={formData.rut}
                    onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                    placeholder="12.345.678-9"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-email">Email (opcional)</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@ejemplo.com"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-telefono">Teléfono *</Label>
                  <Input
                    id="create-telefono"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-direccion">Dirección (opcional)</Label>
                  <Input
                    id="create-direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="Calle, número, ciudad"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-fechaNacimiento">Fecha de Nacimiento (opcional)</Label>
                  <Input
                    id="create-fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="create-broker">Broker Asignado (opcional)</Label>
                  <Select value={formData.brokerId} onValueChange={(value: string) => setFormData({ ...formData, brokerId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin broker asignado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNASSIGNED">Sin broker</SelectItem>
                      {brokers.map((broker) => (
                        <SelectItem key={broker.id} value={broker.id}>
                          {broker.nombre} - {broker.rut}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    resetForm()
                  }}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Cliente'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {clientes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                  <p className="text-2xl font-bold">{clientes.length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Con Leads</p>
                  <p className="text-2xl font-bold">
                    {clientes.filter(c => c.totalLeads > 0).length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Con Email</p>
                  <p className="text-2xl font-bold">
                    {clientes.filter(c => c.email).length}
                  </p>
                </div>
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Con Teléfono</p>
                  <p className="text-2xl font-bold">
                    {clientes.filter(c => c.telefono).length}
                  </p>
                </div>
                <Phone className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-4">
              <Label htmlFor="searchField" className="mb-2 block text-sm font-medium">
                Buscar por
              </Label>
              <Select value={searchField} onValueChange={setSearchField}>
                <SelectTrigger id="searchField">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="rut">RUT</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                  <SelectItem value="broker">Broker</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-8">
              <Label htmlFor="searchTerm" className="mb-2 block text-sm font-medium">
                Término de búsqueda
              </Label>
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchTerm"
                  placeholder={`Buscar por ${searchField}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Registrados</CardTitle>
          <CardDescription>
            Lista de todos los clientes con información de contacto y broker asignado
            {searchTerm && ` (${filteredClientes.length} de ${clientes.length} clientes)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Los clientes serán creados por los brokers al generar leads'
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
                    <TableHead>RUT</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Fecha Nac.</TableHead>
                    <TableHead>Broker</TableHead>
                    <TableHead>Leads</TableHead>
                    <TableHead>Fecha Registro</TableHead>
                  </tr>
                </thead>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleWhatsApp(cliente)}
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
                                  onClick={() => handleEmail(cliente)}
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
                                  onClick={() => handleViewClient(cliente.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="w-4 h-4 text-purple-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Ver detalle del cliente</p>
                              </TooltipContent>
                            </Tooltip>

                            <Dialog open={isEditDialogOpen && editingCliente?.id === cliente.id} onOpenChange={(open) => {
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
                                      onClick={() => handleOpenEditDialog(cliente)}
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="w-4 h-4 text-orange-600" />
                                    </Button>
                                  </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar cliente</p>
                                </TooltipContent>
                              </Tooltip>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center">
                                    <UserCheck className="w-5 h-5 mr-2" />
                                    Editar Cliente
                                  </DialogTitle>
                                  <DialogDescription>
                                    Modifica los datos del cliente, incluyendo su broker asignado.
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="nombre">Nombre *</Label>
                                    <Input
                                      id="nombre"
                                      value={formData.nombre}
                                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                      placeholder="Nombre completo del cliente"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="rut">RUT *</Label>
                                    <Input
                                      id="rut"
                                      value={formData.rut}
                                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                                      placeholder="12.345.678-9"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                      id="email"
                                      type="email"
                                      value={formData.email}
                                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                      placeholder="cliente@ejemplo.com"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="telefono">Teléfono (opcional)</Label>
                                    <Input
                                      id="telefono"
                                      value={formData.telefono}
                                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                      placeholder="+56 9 1234 5678"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="direccion">Dirección (opcional)</Label>
                                    <Input
                                      id="direccion"
                                      value={formData.direccion}
                                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                      placeholder="Calle, número, ciudad"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="fechaNacimiento">Fecha de Nacimiento (opcional)</Label>
                                    <Input
                                      id="fechaNacimiento"
                                      type="date"
                                      value={formData.fechaNacimiento}
                                      onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    <Label htmlFor="broker">Broker Asignado (opcional)</Label>
                                    <Select value={formData.brokerId} onValueChange={(value: string) => setFormData({ ...formData, brokerId: value })}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sin broker asignado" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="UNASSIGNED">Sin broker</SelectItem>
                                        {brokers.map((broker) => (
                                          <SelectItem key={broker.id} value={broker.id}>
                                            {broker.nombre} - {broker.rut}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                    <p className="text-sm text-amber-800">
                                      <strong>⚠ Atención:</strong> Cambiar el broker asignará este cliente a un nuevo broker.
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1">
                                      Los leads existentes mantendrán su broker original.
                                    </p>
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
                                    {saving ? 'Guardando...' : 'Actualizar'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{cliente.nombre}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{cliente.rut}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {cliente.email && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Mail className="w-3 h-3 mr-1" />
                              {cliente.email}
                            </div>
                          )}
                          {cliente.telefono && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Phone className="w-3 h-3 mr-1" />
                              {cliente.telefono}
                            </div>
                          )}
                          {!cliente.email && !cliente.telefono && (
                            <div className="text-sm text-muted-foreground">Sin contacto</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.direccion ? (
                          <div className="flex items-center text-sm text-muted-foreground max-w-[200px] truncate">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span title={cliente.direccion}>{cliente.direccion}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">-</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.fechaNacimiento ? (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(cliente.fechaNacimiento).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">-</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.broker ? (
                          <div>
                            <div className="font-medium text-sm">{cliente.broker.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {cliente.broker.rut}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            Sin broker asignado
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <Badge
                            variant={cliente.totalLeads > 0 ? "default" : "secondary"}
                            className="font-medium"
                          >
                            {cliente.totalLeads}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(cliente.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}