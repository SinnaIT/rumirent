'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react'
import { toast } from 'sonner'

interface Contratista {
  id: string
  email: string
  nombre: string
  telefono?: string
  activo: boolean
  ventasRealizadas: number
  comisionesTotales: number
  createdAt: string
}

interface ContratistaFormData {
  email: string
  nombre: string
  telefono?: string
  password: string
  confirmPassword: string
}

export default function ContratistasPage() {
  const [contratistas, setContratistas] = useState<Contratista[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingContratista, setEditingContratista] = useState<Contratista | null>(null)
  const [formData, setFormData] = useState<ContratistaFormData>({
    email: '',
    nombre: '',
    telefono: '',
    password: '',
    confirmPassword: ''
  })

  // Cargar contratistas
  const fetchContratistas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/contratistas')
      if (!response.ok) throw new Error('Error al cargar contratistas')
      const data = await response.json()
      setContratistas(data.contratistas)
    } catch (error) {
      toast.error('Error al cargar los contratistas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContratistas()
  }, [])

  // Crear contratista
  const handleCreateContratista = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const response = await fetch('/api/admin/contratistas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          telefono: formData.telefono,
          password: formData.password
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al crear contratista')
      }

      toast.success('Contratista creado exitosamente')
      setIsCreateModalOpen(false)
      resetForm()
      fetchContratistas()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Editar contratista
  const handleEditContratista = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingContratista) return

    try {
      const updateData: any = {
        nombre: formData.nombre,
        telefono: formData.telefono
      }

      if (formData.password && formData.password === formData.confirmPassword) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/contratistas/${editingContratista.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al actualizar contratista')
      }

      toast.success('Contratista actualizado exitosamente')
      setIsEditModalOpen(false)
      setEditingContratista(null)
      resetForm()
      fetchContratistas()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Eliminar contratista
  const handleDeleteContratista = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/contratistas/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al eliminar contratista')
      }

      toast.success('Contratista eliminado exitosamente')
      fetchContratistas()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Toggle activo/inactivo
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/contratistas/${id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al cambiar estado')
      }

      toast.success(`Contratista ${currentStatus ? 'desactivado' : 'activado'} exitosamente`)
      fetchContratistas()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      nombre: '',
      telefono: '',
      password: '',
      confirmPassword: ''
    })
  }

  const openEditModal = (contratista: Contratista) => {
    setEditingContratista(contratista)
    setFormData({
      email: contratista.email,
      nombre: contratista.nombre,
      telefono: contratista.telefono || '',
      password: '',
      confirmPassword: ''
    })
    setIsEditModalOpen(true)
  }

  // Filtrar contratistas
  const filteredContratistas = contratistas.filter(contratista =>
    contratista.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contratista.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Estadísticas
  const stats = {
    total: contratistas.length,
    activos: contratistas.filter(c => c.activo).length,
    inactivos: contratistas.filter(c => !c.activo).length,
    ventasTotales: contratistas.reduce((sum, c) => sum + c.ventasRealizadas, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Brokers</h1>
          <p className="text-muted-foreground mt-1">Administra los brokers del sistema</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Broker
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.ventasTotales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar brokers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Brokers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Comisiones</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContratistas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron brokers
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredContratistas.map((contratista) => (
                    <TableRow key={contratista.id}>
                      <TableCell className="font-medium">{contratista.nombre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {contratista.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {contratista.telefono ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {contratista.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(contratista.id, contratista.activo)}
                        >
                          <Badge variant={contratista.activo ? "default" : "secondary"}>
                            {contratista.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>{contratista.ventasRealizadas}</TableCell>
                      <TableCell className="font-mono">
                        ${contratista.comisionesTotales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(contratista.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(contratista)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar contratista?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente el contratista
                                  <strong> {contratista.nombre}</strong> y toda su información asociada.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteContratista(contratista.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Contratista</DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo contratista en el sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateContratista} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-nombre">Nombre completo</Label>
              <Input
                id="create-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-telefono">Teléfono (opcional)</Label>
              <Input
                id="create-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Contraseña</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-confirm-password">Confirmar contraseña</Label>
              <Input
                id="create-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Broker</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Broker</DialogTitle>
            <DialogDescription>
              Modifique los datos del broker. Deje la contraseña vacía si no desea cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditContratista} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre completo</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">El email no se puede modificar</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={6}
              />
            </div>
            {formData.password && (
              <div className="space-y-2">
                <Label htmlFor="edit-confirm-password">Confirmar nueva contraseña</Label>
                <Input
                  id="edit-confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  minLength={6}
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}