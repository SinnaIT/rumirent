'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Home,
  Settings
} from 'lucide-react'

interface TipoUnidad {
  tipo: string
  cantidad: number
}

interface TipoUnidadDetail {
  id: string
  nombre: string
  codigo: string
  comisionId: string
  comision: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
    activa: boolean
  }
  _count: {
    unidades: number
  }
  createdAt: string
  updatedAt: string
}

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
  tipo: string
  estado: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'
  descripcion?: string
  metros2?: number
}

interface EdificioDetail {
  id: string
  nombre: string
  direccion: string
  descripcion?: string
  estado: 'PLANIFICACION' | 'CONSTRUCCION' | 'COMPLETADO'
  totalUnidades: number
  unidadesDisponibles: number
  unidadesVendidas: number
  unidadesReservadas: number
  unidades: Unidad[]
  tiposUnidad: TipoUnidad[]
  comision?: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
    activa: boolean
  }
  createdAt: string
  updatedAt: string
}

const ESTADOS_EDIFICIO = [
  { value: 'PLANIFICACION', label: 'Planificación', color: 'bg-blue-100 text-blue-800' },
  { value: 'CONSTRUCCION', label: 'Construcción', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'COMPLETADO', label: 'Completado', color: 'bg-green-100 text-green-800' }
]

export default function ProyectoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [edificio, setEdificio] = useState<EdificioDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateUnidadDialogOpen, setIsCreateUnidadDialogOpen] = useState(false)
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null)
  const [activeTab, setActiveTab] = useState('tipos-unidad')

  // Tipos de unidad state
  const [tiposUnidadDetalle, setTiposUnidadDetalle] = useState<TipoUnidadDetail[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [isCreateTipoUnidadDialogOpen, setIsCreateTipoUnidadDialogOpen] = useState(false)
  const [editingTipoUnidad, setEditingTipoUnidad] = useState<TipoUnidadDetail | null>(null)
  const [loadingTiposUnidad, setLoadingTiposUnidad] = useState(false)


  // Form state for unidades
  const [unidadFormData, setUnidadFormData] = useState({
    numero: '',
    tipo: '',
    precio: '',
    estado: 'DISPONIBLE' as const,
    prioridad: 'BAJA' as const,
    descripcion: '',
    metros2: ''
  })

  // Form state for tipos de unidad
  const [tipoUnidadFormData, setTipoUnidadFormData] = useState({
    nombre: '',
    codigo: '',
    comisionId: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchEdificio()
      fetchComisiones()
    }
  }, [params.id])

  useEffect(() => {
    if (params.id && activeTab === 'tipos-unidad') {
      fetchTiposUnidadDetalle()
    }
  }, [params.id, activeTab])

  const fetchEdificio = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/edificios/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setEdificio(data.edificio)
      } else {
        toast.error('Error al cargar proyecto')
        router.push('/admin/proyectos')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
      router.push('/admin/proyectos')
    } finally {
      setLoading(false)
    }
  }

  const fetchTiposUnidadDetalle = async () => {
    try {
      setLoadingTiposUnidad(true)
      const response = await fetch(`/api/admin/edificios/${params.id}/tipos-unidad`)
      const data = await response.json()

      if (data.success) {
        setTiposUnidadDetalle(data.tiposUnidad)
      } else {
        toast.error('Error al cargar tipos de unidad')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingTiposUnidad(false)
    }
  }

  const fetchComisiones = async () => {
    try {
      const response = await fetch('/api/admin/comisiones')
      const data = await response.json()

      if (data.success) {
        setComisiones(data.comisiones)
      } else {
        console.error('Error al cargar comisiones')
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }



  // Tipo Unidad management functions
  const resetTipoUnidadForm = () => {
    setTipoUnidadFormData({
      nombre: '',
      codigo: '',
      comisionId: ''
    })
    setEditingTipoUnidad(null)
  }

  const handleOpenCreateTipoUnidadDialog = () => {
    resetTipoUnidadForm()
    setIsCreateTipoUnidadDialogOpen(true)
  }

  const handleOpenEditTipoUnidadDialog = (tipoUnidad: TipoUnidadDetail) => {
    setTipoUnidadFormData({
      nombre: tipoUnidad.nombre,
      codigo: tipoUnidad.codigo,
      comisionId: tipoUnidad.comisionId || 'none'
    })
    setEditingTipoUnidad(tipoUnidad)
    setIsCreateTipoUnidadDialogOpen(true)
  }

  const handleSubmitTipoUnidad = async () => {
    if (!tipoUnidadFormData.nombre.trim() || !tipoUnidadFormData.codigo.trim()) {
      toast.error('Nombre y código son requeridos')
      return
    }

    try {
      setSaving(true)
      const url = editingTipoUnidad
        ? `/api/admin/edificios/${params.id}/tipos-unidad/${editingTipoUnidad.id}`
        : `/api/admin/edificios/${params.id}/tipos-unidad`

      const method = editingTipoUnidad ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tipoUnidadFormData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCreateTipoUnidadDialogOpen(false)
        resetTipoUnidadForm()
        fetchTiposUnidadDetalle()
        fetchEdificio() // Refresh para actualizar estadísticas
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

  const handleDeleteTipoUnidad = async (tipoUnidad: TipoUnidadDetail) => {
    try {
      const response = await fetch(`/api/admin/edificios/${params.id}/tipos-unidad/${tipoUnidad.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchTiposUnidadDetalle()
        fetchEdificio() // Refresh para actualizar estadísticas
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  // Unidad management functions
  const resetUnidadForm = () => {
    setUnidadFormData({
      numero: '',
      tipo: '',
      precio: '',
      estado: 'DISPONIBLE',
      prioridad: 'BAJA',
      descripcion: '',
      metros2: ''
    })
    setEditingUnidad(null)
  }

  const handleOpenCreateUnidadDialog = () => {
    resetUnidadForm()
    setIsCreateUnidadDialogOpen(true)
  }

  const handleOpenEditUnidadDialog = (unidad: Unidad) => {
    setUnidadFormData({
      numero: unidad.numero,
      tipo: unidad.tipo,
      precio: unidad.precio?.toString() || '',
      estado: unidad.estado,
      prioridad: unidad.prioridad,
      descripcion: unidad.descripcion || '',
      metros2: unidad.metros2?.toString() || ''
    })
    setEditingUnidad(unidad)
    setIsCreateUnidadDialogOpen(true)
  }

  const handleSubmitUnidad = async () => {
    if (!unidadFormData.numero.trim() || !unidadFormData.tipo || !unidadFormData.precio) {
      toast.error('Número, tipo de unidad y precio son requeridos')
      return
    }

    const precio = parseFloat(unidadFormData.precio)
    if (isNaN(precio) || precio <= 0) {
      toast.error('El precio debe ser un número válido mayor a 0')
      return
    }

    const metros2 = unidadFormData.metros2 ? parseFloat(unidadFormData.metros2) : undefined
    if (metros2 && (isNaN(metros2) || metros2 <= 0)) {
      toast.error('Los metros cuadrados deben ser un número válido mayor a 0')
      return
    }

    try {
      setSaving(true)
      const url = editingUnidad
        ? `/api/admin/unidades/${editingUnidad.id}`
        : '/api/admin/unidades'

      const method = editingUnidad ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: unidadFormData.numero,
          tipoUnidadEdificioId: unidadFormData.tipo,
          precio,
          estado: unidadFormData.estado,
          prioridad: unidadFormData.prioridad,
          descripcion: unidadFormData.descripcion || undefined,
          metros2,
          edificioId: params.id
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCreateUnidadDialogOpen(false)
        resetUnidadForm()
        fetchEdificio()
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

  const handleDeleteUnidad = async (unidad: Unidad) => {
    try {
      const response = await fetch(`/api/admin/unidades/${unidad.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchEdificio()
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
          <p className="mt-2 text-muted-foreground">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  if (!edificio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
      </div>
    )
  }

  const estado = formatearEstado(edificio.estado)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/proyectos')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{edificio.nombre}</h1>
            <p className="text-muted-foreground flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {edificio.direccion}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={estado.color}>
            {estado.label}
          </Badge>
          <Button
            variant="outline"
            onClick={fetchEdificio}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Unidades</p>
                <p className="text-2xl font-bold">{edificio.totalUnidades}</p>
              </div>
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tipos de Unidad</p>
                <p className="text-2xl font-bold">{edificio.totalTiposUnidad}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unidades Vendidas</p>
                <p className="text-2xl font-bold">{edificio.unidadesVendidas}</p>
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
                <p className="text-2xl font-bold">{edificio.unidadesDisponibles}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="tipos-unidad">Tipos de Unidad</TabsTrigger>
          <TabsTrigger value="unidades">Unidades</TabsTrigger>
        </TabsList>

        <TabsContent value="tipos-unidad" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Unidad</CardTitle>
                  <CardDescription>
                    Gestiona los tipos de unidades disponibles en este proyecto
                  </CardDescription>
                </div>
                <Dialog open={isCreateTipoUnidadDialogOpen} onOpenChange={setIsCreateTipoUnidadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleOpenCreateTipoUnidadDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Tipo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>
                        {editingTipoUnidad ? 'Editar Tipo de Unidad' : 'Nuevo Tipo de Unidad'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingTipoUnidad
                          ? 'Modifica los datos del tipo de unidad existente'
                          : 'Crea un nuevo tipo de unidad para este proyecto'
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="nombre">Nombre del Tipo *</Label>
                        <Input
                          id="nombre"
                          value={tipoUnidadFormData.nombre}
                          onChange={(e) => setTipoUnidadFormData({ ...tipoUnidadFormData, nombre: e.target.value })}
                          placeholder="ej: Studio, 1 Dormitorio, Penthouse"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="codigo">Código *</Label>
                        <Input
                          id="codigo"
                          value={tipoUnidadFormData.codigo}
                          onChange={(e) => setTipoUnidadFormData({ ...tipoUnidadFormData, codigo: e.target.value.toUpperCase() })}
                          placeholder="ej: STU, 1D, PH"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="comision">
                          Comisión
                          <span className="text-muted-foreground text-sm ml-1">(opcional - usa la del proyecto si no se especifica)</span>
                        </Label>
                        <Select
                          value={tipoUnidadFormData.comisionId}
                          onValueChange={(value: string) => setTipoUnidadFormData({ ...tipoUnidadFormData, comisionId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Usar comisión del proyecto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Usar comisión del proyecto</SelectItem>
                            {comisiones.map((comision) => (
                              <SelectItem key={comision.id} value={comision.id}>
                                {comision.nombre} ({(comision.porcentaje * 100).toFixed(1)}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsCreateTipoUnidadDialogOpen(false)}
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmitTipoUnidad} disabled={saving}>
                        {saving ? 'Guardando...' : (editingTipoUnidad ? 'Actualizar' : 'Crear')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingTiposUnidad ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Cargando tipos de unidad...</p>
                  </div>
                </div>
              ) : tiposUnidadDetalle.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay tipos de unidad</h3>
                  <p className="text-muted-foreground mb-4">
                    Crea el primer tipo de unidad para comenzar a organizar las unidades de este proyecto
                  </p>
                  <Button onClick={handleOpenCreateTipoUnidadDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Tipo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Unidades</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tiposUnidadDetalle.map((tipoUnidad) => (
                        <TableRow key={tipoUnidad.id}>
                          <TableCell>
                            <div className="font-medium">{tipoUnidad.nombre}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tipoUnidad.codigo}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              {tipoUnidad.comision ? (
                                <>
                                  <div className="font-medium">{tipoUnidad.comision.nombre}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {(tipoUnidad.comision.porcentaje * 100).toFixed(1)}%
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-medium text-muted-foreground">Comisión del proyecto</div>
                                  <div className="text-sm text-muted-foreground">
                                    {edificio.comision ? `${(edificio.comision.porcentaje * 100).toFixed(1)}%` : 'No definida'}
                                  </div>
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-medium">{tipoUnidad._count.unidades}</div>
                              <div className="text-sm text-muted-foreground">unidades</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditTipoUnidadDialog(tipoUnidad)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={tipoUnidad._count.unidades > 0}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar tipo de unidad?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente el tipo de unidad "{tipoUnidad.nombre}".
                                      Esta acción no se puede deshacer.
                                      {tipoUnidad._count.unidades > 0 && (
                                        <span className="block mt-2 text-destructive font-medium">
                                          No se puede eliminar porque tiene {tipoUnidad._count.unidades} unidades asociadas.
                                        </span>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTipoUnidad(tipoUnidad)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={tipoUnidad._count.unidades > 0}
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
        </TabsContent>

        <TabsContent value="unidades" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Unidades del Proyecto</CardTitle>
                  <CardDescription>
                    Gestiona las unidades individuales de este proyecto
                  </CardDescription>
                </div>
                {tiposUnidadDetalle.length > 0 && (
                  <Dialog open={isCreateUnidadDialogOpen} onOpenChange={setIsCreateUnidadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={handleOpenCreateUnidadDialog}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Unidad
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingUnidad ? 'Editar Unidad' : 'Nueva Unidad'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingUnidad
                            ? 'Modifica los datos de la unidad existente'
                            : 'Crea una nueva unidad para este proyecto'
                          }
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="numero">Número de Unidad *</Label>
                            <Input
                              id="numero"
                              value={unidadFormData.numero}
                              onChange={(e) => setUnidadFormData({ ...unidadFormData, numero: e.target.value })}
                              placeholder="ej: 101"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="metros2">Metros Cuadrados</Label>
                            <Input
                              id="metros2"
                              type="number"
                              value={unidadFormData.metros2}
                              onChange={(e) => setUnidadFormData({ ...unidadFormData, metros2: e.target.value })}
                              placeholder="ej: 85.5"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="tipoUnidad">Tipo de Unidad *</Label>
                            <Select value={unidadFormData.tipo} onValueChange={(value: string) => setUnidadFormData({ ...unidadFormData, tipo: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                {tiposUnidadDetalle.map((tipoUnidad) => (
                                  <SelectItem key={tipoUnidad.id} value={tipoUnidad.id}>
                                    {tipoUnidad.nombre} ({tipoUnidad.codigo})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select value={unidadFormData.estado} onValueChange={(value: any) => setUnidadFormData({ ...unidadFormData, estado: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                                <SelectItem value="RESERVADA">Reservada</SelectItem>
                                <SelectItem value="VENDIDA">Vendida</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="precio">Precio *</Label>
                            <Input
                              id="precio"
                              type="number"
                              value={unidadFormData.precio}
                              onChange={(e) => setUnidadFormData({ ...unidadFormData, precio: e.target.value })}
                              placeholder="Precio de la unidad..."
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="prioridad">Prioridad</Label>
                            <Select value={unidadFormData.prioridad} onValueChange={(value: any) => setUnidadFormData({ ...unidadFormData, prioridad: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BAJA">Baja</SelectItem>
                                <SelectItem value="MEDIA">Media</SelectItem>
                                <SelectItem value="ALTA">Alta</SelectItem>
                                <SelectItem value="URGENTE">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <Label htmlFor="descripcion">Descripción</Label>
                          <Input
                            id="descripcion"
                            value={unidadFormData.descripcion}
                            onChange={(e) => setUnidadFormData({ ...unidadFormData, descripcion: e.target.value })}
                            placeholder="Descripción opcional de la unidad..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateUnidadDialogOpen(false)}
                          disabled={saving}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmitUnidad} disabled={saving}>
                          {saving ? 'Guardando...' : (editingUnidad ? 'Actualizar' : 'Crear')}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tiposUnidadDetalle.length === 0 ? (
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">Primero crea tipos de unidad</h3>
                  <p className="text-muted-foreground mb-4">
                    Necesitas crear al menos un tipo de unidad antes de poder agregar unidades
                  </p>
                  <Button onClick={() => setActiveTab('tipos-unidad')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Ir a Tipos de Unidad
                  </Button>
                </div>
              ) : edificio.unidades.length === 0 ? (
                <div className="text-center py-12">
                  <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay unidades</h3>
                  <p className="text-muted-foreground mb-4">
                    Comienza creando la primera unidad para este proyecto
                  </p>
                  <Button onClick={handleOpenCreateUnidadDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Unidad
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>m²</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {edificio.unidades.map((unidad) => (
                        <TableRow key={unidad.id}>
                          <TableCell>
                            <div className="font-medium">{unidad.numero}</div>
                            {unidad.descripcion && (
                              <div className="text-sm text-muted-foreground">{unidad.descripcion}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const tipoUnidadInfo = tiposUnidadDetalle.find(t => t.id === unidad.tipo)
                              return (
                                <div>
                                  <div className="font-medium text-sm">
                                    {tipoUnidadInfo?.nombre || unidad.tipo}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {tipoUnidadInfo?.codigo || unidad.tipo}
                                  </div>
                                </div>
                              )
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              unidad.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-800' :
                              unidad.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {unidad.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {unidad.metros2 ? `${unidad.metros2} m²` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditUnidadDialog(unidad)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar unidad?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente la unidad "{unidad.numero}".
                                      Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteUnidad(unidad)}
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
        </TabsContent>
      </Tabs>
    </div>
  )
}