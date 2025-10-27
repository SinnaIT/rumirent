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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Building,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  RefreshCw,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface Empresa {
  id: string
  nombre: string
  rut: string
  razonSocial: string
  direccion: string | null
  telefono: string | null
  email: string | null
  activa: boolean
  totalEdificios: number
  createdAt: string
  updatedAt: string
}

interface EmpresaFormData {
  nombre: string
  rut: string
  razonSocial: string
  direccion: string
  telefono: string
  email: string
  activa: boolean
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null)
  const [formData, setFormData] = useState<EmpresaFormData>({
    nombre: '',
    rut: '',
    razonSocial: '',
    direccion: '',
    telefono: '',
    email: '',
    activa: true
  })

  // Cargar empresas
  const fetchEmpresas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/empresas')
      if (!response.ok) throw new Error('Error al cargar empresas')
      const data = await response.json()
      setEmpresas(data.empresas)
    } catch (error) {
      toast.error('Error al cargar las empresas')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmpresas()
  }, [])

  // Crear empresa
  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear empresa')
      }

      toast.success('Empresa creada exitosamente')
      setIsCreateModalOpen(false)
      resetForm()
      fetchEmpresas()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Editar empresa
  const handleEditEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEmpresa) return

    try {
      const response = await fetch(`/api/admin/empresas/${editingEmpresa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar empresa')
      }

      toast.success('Empresa actualizada exitosamente')
      setIsEditModalOpen(false)
      setEditingEmpresa(null)
      resetForm()
      fetchEmpresas()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Eliminar empresa
  const handleDeleteEmpresa = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/empresas/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar empresa')
      }

      toast.success('Empresa eliminada exitosamente')
      fetchEmpresas()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Abrir modal de edición
  const openEditModal = (empresa: Empresa) => {
    setEditingEmpresa(empresa)
    setFormData({
      nombre: empresa.nombre,
      rut: empresa.rut,
      razonSocial: empresa.razonSocial,
      direccion: empresa.direccion || '',
      telefono: empresa.telefono || '',
      email: empresa.email || '',
      activa: empresa.activa
    })
    setIsEditModalOpen(true)
  }

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      nombre: '',
      rut: '',
      razonSocial: '',
      direccion: '',
      telefono: '',
      email: '',
      activa: true
    })
  }

  // Formatear RUT mientras se escribe
  const formatRUT = (value: string) => {
    // Remover todo excepto números y k/K
    const clean = value.replace(/[^0-9kK]/g, '')

    if (clean.length === 0) return ''

    // Separar el dígito verificador
    const dv = clean.slice(-1)
    const numbers = clean.slice(0, -1)

    if (numbers.length === 0) return dv

    // Formatear con puntos
    const formatted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    return `${formatted}-${dv}`
  }

  const handleRUTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRUT(e.target.value)
    setFormData({ ...formData, rut: formatted })
  }

  // Filtrar empresas por búsqueda
  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.rut.includes(searchTerm) ||
    empresa.razonSocial.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Estadísticas
  const totalEmpresas = empresas.length
  const empresasActivas = empresas.filter(e => e.activa).length
  const totalEdificios = empresas.reduce((sum, e) => sum + e.totalEdificios, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando empresas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Empresas</h1>
          <p className="text-muted-foreground">
            Administra las empresas del sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchEmpresas}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Empresa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {empresas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Empresas</p>
                  <p className="text-2xl font-bold">{totalEmpresas}</p>
                </div>
                <Building className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empresas Activas</p>
                  <p className="text-2xl font-bold">{empresasActivas}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Edificios</p>
                  <p className="text-2xl font-bold">{totalEdificios}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Empresas Registradas</CardTitle>
          <CardDescription>
            Lista de todas las empresas del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nombre, RUT o razón social..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          {filteredEmpresas.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No se encontraron empresas' : 'No hay empresas'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza creando tu primera empresa'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Empresa
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>RUT</TableHead>
                    <TableHead>Razón Social</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Edificios</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmpresas.map((empresa) => (
                    <TableRow key={empresa.id}>
                      <TableCell>
                        <div className="font-medium">{empresa.nombre}</div>
                        {empresa.direccion && (
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {empresa.direccion}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {empresa.rut}
                      </TableCell>
                      <TableCell>{empresa.razonSocial}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {empresa.email && (
                            <div className="text-sm flex items-center text-muted-foreground">
                              <Mail className="w-3 h-3 mr-1" />
                              {empresa.email}
                            </div>
                          )}
                          {empresa.telefono && (
                            <div className="text-sm flex items-center text-muted-foreground">
                              <Phone className="w-3 h-3 mr-1" />
                              {empresa.telefono}
                            </div>
                          )}
                          {!empresa.email && !empresa.telefono && (
                            <span className="text-sm text-muted-foreground">Sin contacto</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <span className="font-medium">{empresa.totalEdificios}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {empresa.activa ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Activa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactiva
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(empresa)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                disabled={empresa.totalEdificios > 0}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar empresa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente la empresa &quot;{empresa.nombre}&quot;.
                                  Esta acción no se puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEmpresa(empresa.id)}
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Empresa */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Nueva Empresa
            </DialogTitle>
            <DialogDescription>
              Crea una nueva empresa en el sistema
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmpresa} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="nombre">Nombre de la Empresa *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej: Inmobiliaria ABC"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={handleRUTChange}
                  placeholder="ej: 12.345.678-9"
                  required
                />
              </div>

              <div>
                <Label htmlFor="razonSocial">Razón Social *</Label>
                <Input
                  id="razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  placeholder="ej: Inmobiliaria ABC SpA"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="ej: Av. Principal 123, Santiago"
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="ej: +56 9 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ej: contacto@empresa.cl"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateModalOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Crear Empresa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Empresa */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2" />
              Editar Empresa
            </DialogTitle>
            <DialogDescription>
              Modifica los datos de la empresa
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditEmpresa} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="edit-nombre">Nombre de la Empresa *</Label>
                <Input
                  id="edit-nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej: Inmobiliaria ABC"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-rut">RUT *</Label>
                <Input
                  id="edit-rut"
                  value={formData.rut}
                  onChange={handleRUTChange}
                  placeholder="ej: 12.345.678-9"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-razonSocial">Razón Social *</Label>
                <Input
                  id="edit-razonSocial"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                  placeholder="ej: Inmobiliaria ABC SpA"
                  required
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="edit-direccion">Dirección</Label>
                <Input
                  id="edit-direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="ej: Av. Principal 123, Santiago"
                />
              </div>

              <div>
                <Label htmlFor="edit-telefono">Teléfono</Label>
                <Input
                  id="edit-telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="ej: +56 9 1234 5678"
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ej: contacto@empresa.cl"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-activa"
                    checked={formData.activa}
                    onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-activa" className="cursor-pointer">
                    Empresa activa
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingEmpresa(null)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button type="submit">
                Actualizar Empresa
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
