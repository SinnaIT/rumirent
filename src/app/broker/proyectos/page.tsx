'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Building2,
  Home,
  MapPin,
  RefreshCw,
  Plus,
  Calculator,
  Eye,
  Image as ImageIcon
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'

interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
}

interface TipoUnidad {
  id: string
  nombre: string
  codigo: string
  bedrooms?: number
  bathrooms?: number
  comision: Comision | null
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
    comision: Comision
  }
  createdAt: string
  updatedAt: string
}

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
  createdAt: string
  updatedAt: string
}


export default function BrokerProyectosPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProyectos()
  }, [])

  const fetchProyectos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/broker/proyectos')
      const data = await response.json()

      if (data.success) {
        setProyectos(data.proyectos)
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

  const handleGenerarLead = (unidadId: string) => {
    router.push(`/broker/generar-lead?unidadId=${unidadId}`)
  }

  const handleVerDetalle = (proyectoId: string) => {
    router.push(`/broker/proyectos/${proyectoId}`)
  }

  const renderIcon = (caracteristica: Caracteristica) => {
    if (!caracteristica.icono) return null

    if (caracteristica.tipoIcono === 'LUCIDE' && caracteristica.icono) {
      const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[caracteristica.icono]
      if (IconComponent) {
        return <IconComponent className="h-4 w-4 text-primary" />
      }
    } else if (caracteristica.tipoIcono === 'URL' || caracteristica.tipoIcono === 'UPLOAD') {
      return (
        <img
          src={caracteristica.icono}
          alt={caracteristica.nombre}
          className="h-4 w-4 object-contain"
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
          <p className="mt-2 text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  const totalUnidadesDisponibles = proyectos.reduce((sum, p) => sum + p.unidadesDisponibles, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proyectos Disponibles</h1>
          <p className="text-muted-foreground">
            Explora los proyectos con unidades disponibles para la venta
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={fetchProyectos}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button
            onClick={() => router.push('/broker/generar-lead')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generar Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {proyectos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Proyectos Activos</p>
                  <p className="text-2xl font-bold">{proyectos.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unidades Disponibles</p>
                  <p className="text-2xl font-bold">{totalUnidadesDisponibles}</p>
                </div>
                <Home className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Unidades</p>
                  <p className="text-2xl font-bold">
                    {proyectos.reduce((sum, p) => sum + p.totalUnidades, 0)}
                  </p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Proyectos - Vista de Tarjetas */}
      <div className="space-y-4">
        {proyectos.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hay proyectos disponibles</h3>
                <p className="text-muted-foreground">
                  Actualmente no hay proyectos configurados para la venta
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proyectos.map((proyecto) => (
              <Card key={proyecto.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                {/* Imagen del proyecto */}
                <div className="relative aspect-video bg-muted overflow-hidden">
                  {proyecto.imagenes.length > 0 ? (
                    <>
                      <img
                        src={proyecto.imagenes[0].url}
                        alt={proyecto.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {proyecto.imagenes.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" />
                          {proyecto.imagenes.length}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Título y ubicación */}
                  <div>
                    <h3 className="text-lg font-bold mb-1 line-clamp-1">{proyecto.nombre}</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{proyecto.direccion}</span>
                    </div>
                  </div>

                  {/* Descripción */}
                  {proyecto.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {proyecto.descripcion}
                    </p>
                  )}

                  {/* Características destacadas */}
                  {proyecto.caracteristicas.filter(c => c.mostrarEnResumen).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Características</p>
                      <div className="grid grid-cols-2 gap-2">
                        {proyecto.caracteristicas
                          .filter(c => c.mostrarEnResumen)
                          .slice(0, 4)
                          .map((caracteristica) => (
                          <div
                            key={caracteristica.id}
                            className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5"
                          >
                            {renderIcon(caracteristica)}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{caracteristica.nombre}</p>
                              <p className="text-muted-foreground truncate">{caracteristica.valor}</p>
                            </div>
                          </div>
                          ))}
                      </div>
                      {proyecto.caracteristicas.filter(c => c.mostrarEnResumen).length > 4 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{proyecto.caracteristicas.filter(c => c.mostrarEnResumen).length - 4} más
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">
                        <span className="font-bold text-green-600">{proyecto.unidadesDisponibles}</span>
                        <span className="text-muted-foreground"> / {proyecto.totalUnidades}</span>
                      </div>
                    </div>
                    {proyecto.comision && (
                      <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                        <Calculator className="h-3 w-3 text-primary" />
                        <span className="text-sm font-bold text-primary">
                          {(proyecto.comision.porcentaje * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleVerDetalle(proyecto.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalle
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        // Si tiene unidades físicas disponibles, usar la primera
                        const unidadDisponible = proyecto.unidades.find(u => u.estado === 'DISPONIBLE')
                        if (unidadDisponible) {
                          handleGenerarLead(unidadDisponible.id)
                        } else {
                          // Si no tiene unidades físicas pero tiene tipos de unidad, ir a generar lead con el proyecto
                          router.push(`/broker/generar-lead?proyectoId=${proyecto.id}`)
                        }
                      }}
                      disabled={proyecto.tiposUnidad.length === 0}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Lead
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}