'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Home,
  Percent,
  ChevronLeft,
  ChevronRight,
  Plus,
  Bed,
  Bath,
  Info,
  Search,
  ArrowUpDown
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface Imagen {
  id: string
  url: string
  descripcion?: string
  orden: number
}

interface Caracteristica {
  id: string
  nombre: string
  valor: string
  icono?: string
  tipoIcono: 'LUCIDE' | 'URL' | 'UPLOAD'
  mostrarEnResumen: boolean
  tipoCaracteristica: {
    id: string
    nombre: string
    descripcion?: string
  }
}

interface TipoUnidad {
  id: string
  nombre: string
  codigo: string
  bedrooms?: number | null
  bathrooms?: number | null
  comision: Comision | null
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
  estado: 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'
  descripcion?: string
  metros2?: number
  tipoUnidad: {
    id: string
    nombre: string
    codigo: string
    comision: Comision | null
  }
}

interface Proyecto {
  id: string
  nombre: string
  direccion: string
  descripcion?: string
  urlGoogleMaps?: string
  telefono?: string
  email?: string
  comision?: Comision | null
  totalUnidades: number
  unidadesDisponibles: number
  imagenes: Imagen[]
  caracteristicas: Caracteristica[]
  tiposUnidad: TipoUnidad[]
  unidades: Unidad[]
}

export default function ProyectoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const proyectoId = params?.id as string

  const [proyecto, setProyecto] = useState<Proyecto | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Estados para filtrado y ordenamiento de unidades
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('TODOS')
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS')
  const [sortField, setSortField] = useState<'numero' | 'metros2' | 'comision'>('numero')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    if (proyectoId) {
      fetchProyecto()
    }
  }, [proyectoId])

  const fetchProyecto = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/broker/proyectos')
      const data = await response.json()

      if (data.success) {
        const foundProyecto = data.proyectos.find((p: Proyecto) => p.id === proyectoId)
        if (foundProyecto) {
          setProyecto(foundProyecto)
        } else {
          toast.error('Proyecto no encontrado')
          router.push('/broker/proyectos')
        }
      } else {
        toast.error('Error al cargar proyecto')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerarLead = (unidadId: string) => {
    router.push(`/broker/generar-lead?unidadId=${unidadId}`)
  }

  const nextImage = () => {
    if (proyecto && proyecto.imagenes.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === proyecto.imagenes.length - 1 ? 0 : prev + 1
      )
    }
  }

  const prevImage = () => {
    if (proyecto && proyecto.imagenes.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? proyecto.imagenes.length - 1 : prev - 1
      )
    }
  }

  const renderIcon = (caracteristica: Caracteristica) => {
    if (!caracteristica.icono) return null

    if (caracteristica.tipoIcono === 'LUCIDE' && caracteristica.icono) {
      const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[caracteristica.icono]
      if (IconComponent) {
        return <IconComponent className="h-5 w-5 text-primary" />
      }
    } else if (caracteristica.tipoIcono === 'URL' || caracteristica.tipoIcono === 'UPLOAD') {
      return (
        <img
          src={caracteristica.icono}
          alt={caracteristica.nombre}
          className="h-5 w-5 object-contain"
        />
      )
    }

    return null
  }

  // Filtrado y ordenamiento de unidades
  const filteredAndSortedUnidades = useMemo(() => {
    if (!proyecto) return []

    let filtered = proyecto.unidades

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.tipoUnidad.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (estadoFilter !== 'TODOS') {
      filtered = filtered.filter(u => u.estado === estadoFilter)
    }

    // Filtrar por tipo
    if (tipoFilter !== 'TODOS') {
      filtered = filtered.filter(u => u.tipoUnidad.id === tipoFilter)
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'numero':
          comparison = a.numero.localeCompare(b.numero, undefined, { numeric: true })
          break
        case 'metros2':
          const aMetros = a.metros2 || 0
          const bMetros = b.metros2 || 0
          comparison = aMetros - bMetros
          break
        case 'comision':
          const aComision = a.tipoUnidad.comision?.porcentaje || 0
          const bComision = b.tipoUnidad.comision?.porcentaje || 0
          comparison = aComision - bComision
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [proyecto, searchTerm, estadoFilter, tipoFilter, sortField, sortDirection])

  const handleSort = (field: 'numero' | 'metros2' | 'comision') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
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

  if (!proyecto) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header con botón de volver */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/broker/proyectos')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Proyectos
        </Button>
      </div>

      {/* Título y ubicación */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{proyecto.nombre}</h1>
        <div className="flex items-center text-muted-foreground gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{proyecto.direccion}</span>
          </div>
          {proyecto.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${proyecto.telefono}`} className="hover:text-primary">
                {proyecto.telefono}
              </a>
            </div>
          )}
          {proyecto.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${proyecto.email}`} className="hover:text-primary">
                {proyecto.email}
              </a>
            </div>
          )}
          {proyecto.urlGoogleMaps && (
            <a
              href={proyecto.urlGoogleMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              Ver en Google Maps
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* Galería de imágenes */}
      {proyecto.imagenes.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-muted">
              <img
                src={proyecto.imagenes[currentImageIndex].url}
                alt={proyecto.imagenes[currentImageIndex].descripcion || `Imagen ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Controles del carrusel */}
              {proyecto.imagenes.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>

                  {/* Indicadores */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {proyecto.imagenes.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex
                            ? 'w-8 bg-white'
                            : 'w-2 bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Descripción de la imagen */}
              {proyecto.imagenes[currentImageIndex].descripcion && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white text-sm">
                    {proyecto.imagenes[currentImageIndex].descripcion}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen del Proyecto */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6">Resumen del Proyecto</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información General */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                  Ubicación
                </h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">{proyecto.direccion}</p>
                      {proyecto.urlGoogleMaps && (
                        <a
                          href={proyecto.urlGoogleMaps}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Ver en Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos de Contacto */}
              {(proyecto.telefono || proyecto.email) && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Contacto
                  </h3>
                  <div className="space-y-2">
                    {proyecto.telefono && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-primary flex-shrink-0" />
                        <a href={`tel:${proyecto.telefono}`} className="hover:text-primary">
                          {proyecto.telefono}
                        </a>
                      </div>
                    )}
                    {proyecto.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                        <a href={`mailto:${proyecto.email}`} className="hover:text-primary">
                          {proyecto.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Comisión */}
              {proyecto.comision && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Comisión
                  </h3>
                  <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-semibold">{proyecto.comision.nombre}</p>
                      <p className="text-sm text-muted-foreground">{proyecto.comision.codigo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Percent className="h-5 w-5 text-primary" />
                      <span className="text-2xl font-bold text-primary">
                        {(proyecto.comision.porcentaje * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipos de Unidad */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                  Tipos de Unidad
                </h3>
                <div className="space-y-3">
                  {proyecto.tiposUnidad.map((tipo) => (
                    <div
                      key={tipo.id}
                      className="p-4 bg-muted/50 rounded-lg border border-border"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{tipo.nombre}</p>
                          <p className="text-sm text-muted-foreground">{tipo.codigo}</p>
                        </div>
                        {tipo.comision && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {(tipo.comision.porcentaje * 100).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                      {(tipo.bedrooms !== null || tipo.bathrooms !== null) && (
                        <div className="flex items-center gap-4 mt-2">
                          {tipo.bedrooms !== null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Bed className="h-4 w-4 text-muted-foreground" />
                              <span>{tipo.bedrooms} {tipo.bedrooms === 1 ? 'hab' : 'habs'}</span>
                            </div>
                          )}
                          {tipo.bathrooms !== null && (
                            <div className="flex items-center gap-1.5 text-sm">
                              <Bath className="h-4 w-4 text-muted-foreground" />
                              <span>{tipo.bathrooms} {tipo.bathrooms === 1 ? 'baño' : 'baños'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Características Destacadas (Resumen) */}
              {proyecto.caracteristicas.filter(c => c.mostrarEnResumen).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                    Características Destacadas
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {proyecto.caracteristicas
                      .filter(c => c.mostrarEnResumen)
                      .map((caracteristica) => (
                        <div
                          key={caracteristica.id}
                          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-shrink-0">
                            {renderIcon(caracteristica)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{caracteristica.nombre}</p>
                            <p className="text-muted-foreground text-sm">{caracteristica.valor}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Descripción */}
          {proyecto.descripcion && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
                Descripción
              </h3>
              <p className="text-muted-foreground whitespace-pre-line">{proyecto.descripcion}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla de Características por Categoría */}
      {proyecto.caracteristicas.length > 0 && (() => {
        // Agrupar características por tipo
        const caracteristicasPorTipo = proyecto.caracteristicas.reduce((acc, car) => {
          const tipoNombre = car.tipoCaracteristica.nombre
          if (!acc[tipoNombre]) {
            acc[tipoNombre] = []
          }
          acc[tipoNombre].push(car)
          return acc
        }, {} as Record<string, Caracteristica[]>)

        return (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Info className="h-5 w-5 text-primary" />
                <h2 className="text-2xl font-bold">Todas las Características</h2>
              </div>

              <div className="space-y-6">
                {Object.entries(caracteristicasPorTipo).map(([tipoNombre, caracteristicas]) => (
                  <div key={tipoNombre}>
                    <h3 className="text-lg font-bold mb-3 text-primary">{tipoNombre}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {caracteristicas.map((caracteristica) => (
                        <div
                          key={caracteristica.id}
                          className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {renderIcon(caracteristica)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm mb-0.5">{caracteristica.nombre}</p>
                            <p className="text-muted-foreground text-sm">{caracteristica.valor}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Tabla de unidades con filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Unidades del Proyecto</h2>
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {proyecto.unidadesDisponibles} disponibles de {proyecto.totalUnidades} total
              </span>
            </div>
          </div>

          {proyecto.unidades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay unidades registradas en este proyecto
            </div>
          ) : (
            <>
              {/* Filtros y búsqueda */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar unidad..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los estados</SelectItem>
                    <SelectItem value="DISPONIBLE">Disponible</SelectItem>
                    <SelectItem value="RESERVADA">Reservada</SelectItem>
                    <SelectItem value="VENDIDA">Vendida</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={tipoFilter} onValueChange={setTipoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de unidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos los tipos</SelectItem>
                    {proyecto.tiposUnidad.map((tipo) => (
                      <SelectItem key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Mostrando {filteredAndSortedUnidades.length} de {proyecto.unidades.length}
                  </span>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('numero')}
                          className="h-8 px-2 lg:px-3"
                        >
                          Número
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('metros2')}
                          className="h-8 px-2 lg:px-3"
                        >
                          M²
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort('comision')}
                          className="h-8 px-2 lg:px-3"
                        >
                          Comisión
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedUnidades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No se encontraron unidades con los filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedUnidades.map((unidad) => {
                        const estadoBadgeColor =
                          unidad.estado === 'DISPONIBLE' ? 'bg-green-100 text-green-800 border-green-200' :
                          unidad.estado === 'RESERVADA' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200';

                        return (
                          <TableRow key={unidad.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{unidad.numero}</TableCell>
                            <TableCell>{unidad.tipoUnidad.nombre}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={estadoBadgeColor}>
                                {unidad.estado}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {unidad.descripcion || '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {unidad.metros2 ? `${unidad.metros2} m²` : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              {unidad.tipoUnidad.comision ? (
                                <span className="font-bold text-primary">
                                  {(unidad.tipoUnidad.comision.porcentaje * 100).toFixed(1)}%
                                </span>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                size="sm"
                                onClick={() => handleGenerarLead(unidad.id)}
                                disabled={unidad.estado !== 'DISPONIBLE'}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Lead
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
