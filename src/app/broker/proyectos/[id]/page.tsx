'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  Info
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

      {/* Resumen de unidades */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Unidades Disponibles</h2>
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-semibold">
                {proyecto.unidadesDisponibles} de {proyecto.totalUnidades}
              </span>
            </div>
          </div>

          {proyecto.unidades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay unidades disponibles en este momento
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proyecto.unidades.map((unidad) => (
                <Card key={unidad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">Unidad {unidad.numero}</h3>
                          <p className="text-sm text-muted-foreground">{unidad.tipoUnidad.nombre}</p>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Disponible
                        </Badge>
                      </div>

                      {unidad.descripcion && (
                        <p className="text-sm text-muted-foreground">{unidad.descripcion}</p>
                      )}

                      {unidad.metros2 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span>{unidad.metros2} m²</span>
                        </div>
                      )}

                      {unidad.tipoUnidad.comision && (
                        <div className="flex items-center justify-between p-2 bg-primary/5 rounded">
                          <span className="text-sm font-medium">Comisión</span>
                          <span className="text-sm font-bold text-primary">
                            {(unidad.tipoUnidad.comision.porcentaje * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={() => handleGenerarLead(unidad.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generar Lead
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
