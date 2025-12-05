'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
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
  Home,
  Search,
  X
} from 'lucide-react'

interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
}

interface Empresa {
  id: string
  nombre: string
  rut: string
  razonSocial: string
  activa: boolean
}

interface Edificio {
  id: string
  nombre: string
  direccion: string
  comuna: string
  ciudad: string
  region: string
  codigoPostal?: string
  descripcion?: string
  comision?: Comision | null
  empresa?: Empresa | null
  totalUnidades: number
  unidadesDisponibles: number
  unidadesVendidas: number
  unidadesReservadas: number
  createdAt: string
  updatedAt: string
}


type FilterField = 'all' | 'nombre' | 'empresa' | 'direccion' | 'comuna' | 'ciudad' | 'region'

export default function ProyectosPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [edificios, setEdificios] = useState<Edificio[]>([])
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingEdificio, setEditingEdificio] = useState<Edificio | null>(null)

  // Filter state
  const [filterField, setFilterField] = useState<FilterField>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [empresaIdFilter, setEmpresaIdFilter] = useState<string | null>(null)
  const [urlFilters, setUrlFilters] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    comuna: '',
    ciudad: '',
    region: '',
    codigoPostal: '',
    descripcion: '',
    comisionId: 'none',
    empresaId: ''
  })

  useEffect(() => {
    // Check for empresaId in URL params and find the company name
    const empresaIdParam = searchParams.get('empresaId')

    if (empresaIdParam && empresas.length > 0) {
      console.log('✅ empresaId from URL:', empresaIdParam)

      // Find the empresa by ID
      const empresa = empresas.find(e => e.id === empresaIdParam)

      if (empresa) {
        console.log('✅ Found empresa:', empresa.nombre)

        // Set the search term to the company name
        setSearchTerm(empresa.nombre)
        setFilterField('empresa')
        setEmpresaIdFilter(empresaIdParam)

        // Store in urlFilters for the badge display
        setUrlFilters({ empresaId: empresaIdParam })
      }
    }
  }, [searchParams, empresas])

  const fetchEdificios = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/edificios')
      const data = await response.json()

      if (data.success) {
        console.log('✅ Edificios loaded:', data.edificios.length, 'edificios')
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

  // Initial load
  useEffect(() => {
    fetchEdificios()
    fetchComisiones()
    fetchEmpresas()
  }, [])

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

  const fetchEmpresas = async () => {
    try {
      const response = await fetch('/api/admin/empresas')
      const data = await response.json()

      if (data.success) {
        // Filtrar solo empresas activas
        setEmpresas(data.empresas.filter((e: Empresa) => e.activa))
      } else {
        console.error('Error al cargar empresas:', data.error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: '',
      direccion: '',
      comuna: '',
      ciudad: '',
      region: '',
      codigoPostal: '',
      descripcion: '',
      comisionId: 'none',
      empresaId: ''
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
      comuna: edificio.comuna,
      ciudad: edificio.ciudad,
      region: edificio.region,
      codigoPostal: edificio.codigoPostal || '',
      descripcion: edificio.descripcion || '',
      comisionId: edificio.comision?.id || 'none',
      empresaId: edificio.empresa?.id || ''
    })
    setEditingEdificio(edificio)
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.nombre.trim() || !formData.direccion.trim() || !formData.comuna.trim() || !formData.ciudad.trim() || !formData.region.trim()) {
      toast.error('Nombre, dirección, comuna, ciudad y región son requeridos')
      return
    }

    if (!formData.empresaId) {
      toast.error('Debe seleccionar una empresa')
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
          comisionId: formData.comisionId === 'none' ? undefined : formData.comisionId,
          empresaId: formData.empresaId
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

  const clearFilters = () => {
    setSearchTerm('')
    setFilterField('all')
    setEmpresaIdFilter(null)
    setUrlFilters({})
    router.push('/admin/proyectos')
  }

  const clearSpecificFilter = (filterKey: string) => {
    if (filterKey === 'empresaId') {
      setSearchTerm('')
      setFilterField('all')
      setEmpresaIdFilter(null)
      setUrlFilters({})
      router.push('/admin/proyectos')
    }
  }

  // Filter logic - only apply text search if there's a search term
  // The empresaId filter is already applied at the API level
  const filteredEdificios = edificios.filter((edificio) => {
    // If no search term, show all edificios (already filtered by empresaId at API level)
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    switch (filterField) {
      case 'nombre':
        return edificio.nombre.toLowerCase().includes(searchLower)
      case 'empresa':
        return edificio.empresa?.nombre.toLowerCase().includes(searchLower) ||
               edificio.empresa?.rut.includes(searchTerm)
      case 'direccion':
        return edificio.direccion.toLowerCase().includes(searchLower)
      case 'comuna':
        return edificio.comuna.toLowerCase().includes(searchLower)
      case 'ciudad':
        return edificio.ciudad.toLowerCase().includes(searchLower)
      case 'region':
        return edificio.region.toLowerCase().includes(searchLower)
      case 'all':
      default:
        return (
          edificio.nombre.toLowerCase().includes(searchLower) ||
          edificio.direccion.toLowerCase().includes(searchLower) ||
          edificio.comuna.toLowerCase().includes(searchLower) ||
          edificio.ciudad.toLowerCase().includes(searchLower) ||
          edificio.region.toLowerCase().includes(searchLower) ||
          edificio.empresa?.nombre.toLowerCase().includes(searchLower) ||
          edificio.empresa?.rut.includes(searchTerm)
        )
    }
  })

  const activeEmpresaFilter = empresaIdFilter
    ? empresas.find(e => e.id === empresaIdFilter)
    : null



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

              <ScrollArea className="max-h-[60vh] pr-4">
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
                  <Label htmlFor="direccion">Dirección (calle y número) *</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    placeholder="ej: Av. Providencia 1234"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="comuna">Comuna *</Label>
                    <Input
                      id="comuna"
                      value={formData.comuna}
                      onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                      placeholder="ej: Providencia"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                      placeholder="ej: Santiago"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="region">Región *</Label>
                    <Input
                      id="region"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                      placeholder="ej: Región Metropolitana"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      value={formData.codigoPostal}
                      onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                      placeholder="ej: 7500000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="empresa">Empresa *</Label>
                  <Select value={formData.empresaId} onValueChange={(value: string) => setFormData({ ...formData, empresaId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar empresa" />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas.map((empresa) => (
                        <SelectItem key={empresa.id} value={empresa.id}>
                          {empresa.nombre} - {empresa.rut}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {empresas.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay empresas activas. Crea una empresa primero.
                    </p>
                  )}
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
              </ScrollArea>

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
                  <p className="text-2xl font-bold">{filteredEdificios.length}</p>
                  {filteredEdificios.length !== edificios.length && (
                    <p className="text-xs text-muted-foreground">de {edificios.length} total</p>
                  )}
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
                    {filteredEdificios.reduce((sum, e) => sum + e.totalUnidades, 0)}
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
                  <p className="text-sm font-medium text-muted-foreground">Unidades Arrendadas</p>
                  <p className="text-2xl font-bold">
                    {filteredEdificios.reduce((sum, e) => sum + e.unidadesVendidas, 0)}
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
                    {filteredEdificios.reduce((sum, e) => sum + e.unidadesDisponibles, 0)}
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
          {/* Search and filter controls */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar proyectos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select
                value={filterField}
                onValueChange={(value: FilterField) => setFilterField(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los campos</SelectItem>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="empresa">Empresa</SelectItem>
                  <SelectItem value="direccion">Dirección</SelectItem>
                  <SelectItem value="comuna">Comuna</SelectItem>
                  <SelectItem value="ciudad">Ciudad</SelectItem>
                  <SelectItem value="region">Región</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="sm:w-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>

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
          ) : filteredEdificios.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No se encontraron resultados</h3>
              <p className="text-muted-foreground mb-4">
                No hay proyectos que coincidan con tu búsqueda
              </p>
              <Button variant="outline" onClick={() => setSearchTerm('')}>
                Limpiar búsqueda
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Acciones</TableHead>
                    <TableHead>Proyecto</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Unidades</TableHead>
                    <TableHead>Arrendadas</TableHead>
                    <TableHead>Fecha Creación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEdificios.map((edificio) => {
                    return (
                      <TableRow key={edificio.id}>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/proyectos/${edificio.id}`)}
                              title="Ver detalles"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditDialog(edificio)}
                              title="Editar"
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
                                  title={edificio.totalUnidades > 0 ? "No se puede eliminar con unidades" : "Eliminar"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará permanentemente el proyecto &quot;{edificio.nombre}&quot;.
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
                        <TableCell>
                          <div>
                            <div className="font-medium">{edificio.nombre}</div>
                            <div className="text-sm text-muted-foreground flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {edificio.direccion}, {edificio.comuna}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {edificio.ciudad}, {edificio.region}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {edificio.empresa ? (
                            <div>
                              <div className="font-medium text-sm">{edificio.empresa.nombre}</div>
                              <div className="text-xs text-muted-foreground">
                                {edificio.empresa.rut}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">
                              Sin empresa
                            </div>
                          )}
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