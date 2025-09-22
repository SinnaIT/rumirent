'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  MapPin,
  Calendar,
  Home
} from 'lucide-react'

interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
}

interface Edificio {
  id: string
  nombre: string
  direccion: string
  descripcion?: string
  estado: 'ENTREGA_INMEDIATA' | 'ENTREGA_FUTURA'
  comision?: Comision | null
  totalUnidades: number
  unidadesDisponibles: number
  unidadesVendidas: number
  unidadesReservadas: number
  createdAt: string
  updatedAt: string
}

const ESTADOS_EDIFICIO = [
  { value: 'ENTREGA_INMEDIATA', label: 'Entrega Inmediata', color: 'bg-green-100 text-green-800' },
  { value: 'ENTREGA_FUTURA', label: 'Entrega Futura', color: 'bg-blue-100 text-blue-800' }
]

export default function ProyectosPage() {
  const router = useRouter()
  const [edificios, setEdificios] = useState<Edificio[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEdificio, setEditingEdificio] = useState<Edificio | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    descripcion: '',
    estado: 'ENTREGA_FUTURA' as const,
    comisionId: 'none'
  })

  useEffect(() => {
    fetchEdificios()
    fetchComisiones()
  }, [])

  const fetchEdificios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/edificios')
      const data = await response.json()

      if (data.success) {
        setEdificios(data.edificios)
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

  const fetchComisiones = async () => {
    try {
      const response = await fetch('/api/admin/comisiones')
      const data = await response.json()

      if (data.success) {
        setComisiones(data.comisiones)
      } else {
        console.error('Error al cargar comisiones:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      direccion: '',
      descripcion: '',
      estado: 'ENTREGA_FUTURA',
      comisionId: 'none'
    })
    setEditingEdificio(null)
  }

  const handleOpenCreateDialog = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleOpenEditDialog = (edificio: Edificio) => {
    setFormData({
      nombre: edificio.nombre,
      direccion: edificio.direccion,
      descripcion: edificio.descripcion || '',
      estado: edificio.estado,
      comisionId: edificio.comision?.id || 'none'
    })
    setEditingEdificio(edificio)
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.direccion.trim()) {
      toast.error('Nombre y dirección son requeridos')
      return
    }

    try {
      setSaving(true)
      const url = editingEdificio
        ? `/api/admin/edificios/${editingEdificio.id}`
        : '/api/admin/edificios'

      const method = editingEdificio ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          comisionId: formData.comisionId === 'none' ? undefined : formData.comisionId
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCreateDialogOpen(false)
        resetForm()
        fetchEdificios()
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

  const handleDelete = async (edificio: Edificio) => {
    try {
      const response = await fetch(`/api/admin/edificios/${edificio.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchEdificios()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  const formatearEstado = (estado: string) => {
    const estadoObj = ESTADOS_EDIFICIO.find(e => e.value === estado)
    return estadoObj || { label: estado, color: 'bg-gray-100 text-gray-800' }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Proyectos</h1>
          <p className="text-muted-foreground">
            Administra los edificios y proyectos inmobiliarios
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchEdificios}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  {editingEdificio ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                </DialogTitle>
                <DialogDescription>
                  {editingEdificio
                    ? 'Modifica los datos del proyecto existente'
                    : 'Crea un nuevo proyecto inmobiliario'
                  }
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="ej: Torre del Sol"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="direccion">Dirección *</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="ej: Av. Principal 123, Madrid"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="estado">Estado del Proyecto</Label>
                  <Select value={formData.estado} onValueChange={(value: any) => setFormData({ ...formData, estado: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_EDIFICIO.map((estado) => (
                        <SelectItem key={estado.value} value={estado.value}>
                          {estado.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="comision">Comisión del Proyecto</Label>
                  <Select value={formData.comisionId} onValueChange={(value: string) => setFormData({ ...formData, comisionId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar comisión (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin comisión específica</SelectItem>
                      {comisiones.map((comision) => (
                        <SelectItem key={comision.id} value={comision.id}>
                          {comision.nombre} ({comision.codigo}) - {(comision.porcentaje * 100).toFixed(1)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción opcional del proyecto..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Guardando...' : (editingEdificio ? 'Actualizar' : 'Crear')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {edificios.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Proyectos</p>
                  <p className="text-2xl font-bold">{edificios.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Unidades</p>
                  <p className="text-2xl font-bold">
                    {edificios.reduce((sum, e) => sum + e.totalUnidades, 0)}
                  </p>
                </div>
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unidades Vendidas</p>
                  <p className="text-2xl font-bold">
                    {edificios.reduce((sum, e) => sum + e.unidadesVendidas, 0)}
                  </p>
                </div>
                <Home className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Disponibles</p>
                  <p className="text-2xl font-bold">
                    {edificios.reduce((sum, e) => sum + e.unidadesDisponibles, 0)}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de edificios */}
      <Card>
        <CardHeader>
          <CardTitle>Proyectos Registrados</CardTitle>
          <CardDescription>
            Lista de todos los proyectos inmobiliarios con sus estadísticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {edificios.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No hay proyectos</h3>
              <p className="text-muted-foreground mb-4">
                Comienza creando tu primer proyecto inmobiliario
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Vendidas</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {edificios.map((edificio) => {
                    const estado = formatearEstado(edificio.estado)
                    return (
                      <TableRow key={edificio.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{edificio.nombre}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {edificio.direccion}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={estado.color}>
                            {estado.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {edificio.comision ? (
                            <div className="text-center">
                              <div className="font-medium text-sm">{edificio.comision.nombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {(edificio.comision.porcentaje * 100).toFixed(1)}%
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground text-sm">
                              Sin asignar
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium">{edificio.totalUnidades}</div>
                            <div className="text-sm text-muted-foreground">
                              {edificio.unidadesDisponibles} disponibles
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-center">
                            <div className="font-medium text-green-600">{edificio.unidadesVendidas}</div>
                            {edificio.unidadesReservadas > 0 && (
                              <div className="text-sm text-yellow-600">
                                {edificio.unidadesReservadas} reservadas
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(edificio.createdAt).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/proyectos/${edificio.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDialog(edificio)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={edificio.totalUnidades > 0}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente el proyecto "{edificio.nombre}".
                                    Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(edificio)}
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}