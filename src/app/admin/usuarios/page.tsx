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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Shield,
  Plus,
  Search,
  Edit,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  ShieldCheck,
  ShieldX
} from 'lucide-react'
import { toast } from 'sonner'

interface Usuario {
  id: string
  email: string
  nombre: string
  rut: string
  telefono: string | null
  birthDate?: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

interface UsuarioFormData {
  email: string
  nombre: string
  rut: string
  telefono: string
  birthDate: string
  password: string
  confirmPassword: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null)
  const [formData, setFormData] = useState<UsuarioFormData>({
    email: '',
    nombre: '',
    rut: '',
    telefono: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  })

  // Cargar usuarios
  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/usuarios')
      if (!response.ok) throw new Error('Error al cargar usuarios')
      const data = await response.json()
      setUsuarios(data.usuarios)
    } catch (error) {
      toast.error('Error al cargar los usuarios admin')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsuarios()
  }, [])

  // Crear usuario
  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          rut: formData.rut,
          telefono: formData.telefono || undefined,
          birthDate: formData.birthDate || undefined,
          password: formData.password
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Error al crear usuario')
      }

      toast.success('Usuario admin creado exitosamente')
      setIsCreateModalOpen(false)
      resetForm()
      fetchUsuarios()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Editar usuario
  const handleEditUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUsuario) return

    // Solo validar contraseñas si se ingresó una
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const updateData: {
        email: string
        nombre: string
        rut: string
        telefono?: string
        birthDate?: string
        password?: string
      } = {
        email: formData.email,
        nombre: formData.nombre,
        rut: formData.rut,
        telefono: formData.telefono || undefined,
        birthDate: formData.birthDate || undefined
      }

      if (formData.password && formData.password.length >= 6) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/usuarios/${editingUsuario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Error al actualizar usuario')
      }

      toast.success('Usuario actualizado exitosamente')
      setIsEditModalOpen(false)
      setEditingUsuario(null)
      resetForm()
      fetchUsuarios()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Toggle activo/inactivo
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/usuarios/${id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Error al cambiar estado')
      }

      toast.success(`Usuario ${currentStatus ? 'desactivado' : 'activado'} exitosamente`)
      fetchUsuarios()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      nombre: '',
      rut: '',
      telefono: '',
      birthDate: '',
      password: '',
      confirmPassword: ''
    })
  }

  const openEditModal = (usuario: Usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      rut: usuario.rut,
      telefono: usuario.telefono || '',
      birthDate: usuario.birthDate ? new Date(usuario.birthDate).toISOString().split('T')[0] : '',
      password: '',
      confirmPassword: ''
    })
    setIsEditModalOpen(true)
  }

  // Filtrar usuarios
  const filteredUsuarios = usuarios.filter(usuario =>
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Estadísticas
  const stats = {
    total: usuarios.length,
    activos: usuarios.filter(u => u.activo).length,
    inactivos: usuarios.filter(u => !u.activo).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios Admin</h1>
          <p className="text-muted-foreground mt-1">Administra los usuarios administradores del sistema</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Usuario Admin
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <ShieldCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <ShieldX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar usuarios admin..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios Administradores</CardTitle>
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
                  <TableHead>Acciones</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios admin
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(usuario)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{usuario.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{usuario.rut}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {usuario.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {usuario.telefono && usuario.telefono.trim() !== '' ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {usuario.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(usuario.id, usuario.activo)}
                        >
                          <Badge variant={usuario.activo ? "default" : "secondary"}>
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(usuario.createdAt).toLocaleDateString()}
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
            <DialogTitle>Crear Nuevo Usuario Admin</DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo usuario administrador en el sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUsuario} className="space-y-4">
            <ScrollArea className="max-h-[60vh] pr-4">
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
              <Label htmlFor="create-rut">RUT</Label>
              <Input
                id="create-rut"
                placeholder="12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
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
              <Label htmlFor="create-birthDate">Fecha de nacimiento (opcional)</Label>
              <Input
                id="create-birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
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
            </ScrollArea>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Usuario</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario Admin</DialogTitle>
            <DialogDescription>
              Modifique los datos del usuario. Deje la contraseña vacía si no desea cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUsuario} className="space-y-4">
            <ScrollArea className="max-h-[60vh] pr-4">
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
              <Label htmlFor="edit-rut">RUT</Label>
              <Input
                id="edit-rut"
                placeholder="12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">Como administrador, puedes cambiar el email</p>
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
              <Label htmlFor="edit-birthDate">Fecha de nacimiento</Label>
              <Input
                id="edit-birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
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
            </ScrollArea>
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