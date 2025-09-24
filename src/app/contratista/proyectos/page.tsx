'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'
import {
  Building2,
  Home,
  ChevronDown,
  ChevronRight,
  MapPin,
  RefreshCw,
  Plus,
  Calculator
} from 'lucide-react'

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
    comision: Comision
  }
  createdAt: string
  updatedAt: string
}

interface Proyecto {
  id: string
  nombre: string
  direccion: string
  descripcion?: string
  estado: 'ENTREGA_INMEDIATA' | 'ENTREGA_FUTURA'
  comision?: Comision | null
  totalUnidades: number
  unidadesDisponibles: number
  unidades: Unidad[]
  createdAt: string
  updatedAt: string
}


export default function ContratistaProyectosPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchProyectos()
  }, [])

  const fetchProyectos = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/contratista/proyectos')
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

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }


  const handleGenerarContrato = (unidadId: string) => {
    router.push(`/contratista/generar-contrato?unidadId=${unidadId}`)
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
            onClick={() => router.push('/contratista/generar-contrato')}
          >
            <Plus className="w-4 h-4 mr-2" />
            Generar Contrato
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

      {/* Lista de Proyectos */}
      <div className="space-y-4">
        {proyectos.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hay proyectos disponibles</h3>
                <p className="text-muted-foreground">
                  Actualmente no hay proyectos con unidades disponibles para la venta
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          proyectos.map((proyecto) => {
            const isExpanded = expandedProjects.has(proyecto.id)

            return (
              <Card key={proyecto.id} className="overflow-hidden">
                <Collapsible open={isExpanded} onOpenChange={() => toggleProject(proyecto.id)}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{proyecto.nombre}</CardTitle>
                            <CardDescription className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {proyecto.direccion}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {proyecto.unidadesDisponibles} de {proyecto.totalUnidades}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              unidades disponibles
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      {proyecto.descripcion && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">{proyecto.descripcion}</p>
                        </div>
                      )}

                      {proyecto.comision && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-blue-900">
                                Comisión del Proyecto
                              </h4>
                              <p className="text-sm text-blue-700">
                                {proyecto.comision.nombre} ({proyecto.comision.codigo})
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-900">
                                {(proyecto.comision.porcentaje * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-blue-600">
                                comisión base
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Unidad</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Comisión</TableHead>
                              <TableHead>m²</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {proyecto.unidades.map((unidad) => (
                              <TableRow key={unidad.id}>
                                <TableCell>
                                  <div className="font-medium">{unidad.numero}</div>
                                  {unidad.descripcion && (
                                    <div className="text-sm text-muted-foreground">{unidad.descripcion}</div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium text-sm">{unidad.tipoUnidad.nombre}</div>
                                    <div className="text-xs text-muted-foreground">{unidad.tipoUnidad.codigo}</div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    {unidad.tipoUnidad.comision ? (
                                      <>
                                        <div className="font-medium text-sm">{unidad.tipoUnidad.comision.nombre}</div>
                                        <div className="text-xs text-green-600 font-medium">
                                          {(unidad.tipoUnidad.comision.porcentaje * 100).toFixed(1)}%
                                        </div>
                                      </>
                                    ) : proyecto.comision ? (
                                      <>
                                        <div className="font-medium text-sm">{proyecto.comision.nombre}</div>
                                        <div className="text-xs text-blue-600 font-medium">
                                          {(proyecto.comision.porcentaje * 100).toFixed(1)}% (base)
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-sm text-muted-foreground">Sin comisión</div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {unidad.metros2 ? `${unidad.metros2} m²` : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => handleGenerarContrato(unidad.id)}
                                  >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Generar Contrato
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}