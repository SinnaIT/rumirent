'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Calculator, Save, RefreshCw, Plus, Edit, Settings, Clock, Calendar, Trash2, CheckCircle, PlayCircle } from 'lucide-react'

// Interfaces
interface Comision {
  id: string
  nombre: string
  codigo: string
  porcentaje: number
  activa: boolean
  asignaciones: number
  cambiosProgramados: number
  createdAt: string
  updatedAt: string
}

interface Edificio {
  id: string
  nombre: string
}


interface TipoUnidad {
  id: string
  nombre: string
  codigo: string
  edificioId: string
}

interface CambioProgramado {
  id: string
  fechaCambio: string
  comision: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
    activa: boolean
  }
  edificio: {
    id: string
    nombre: string
  }
  tipoUnidad?: {
    id: string
    nombre: string
    codigo: string
  }
  ejecutado: boolean
  createdAt: string
  updatedAt: string
}


export default function ComisionesPage() {
  const [activeTab, setActiveTab] = useState('tipos')

  // Estados para comisiones
  const [comisiones, setComisiones] = useState<Comision[]>([])
  const [loadingComisiones, setLoadingComisiones] = useState(true)
  const [isComisionDialogOpen, setIsComisionDialogOpen] = useState(false)
  const [editingComision, setEditingComision] = useState<Comision | null>(null)

  // Estados para edificios
  const [edificios, setEdificios] = useState<Edificio[]>([])

  // Estados para tipos de unidad
  const [tiposUnidad, setTiposUnidad] = useState<TipoUnidad[]>([])


  // Estados para cambios programados
  const [cambiosProgramados, setCambiosProgramados] = useState<CambioProgramado[]>([])
  const [loadingCambios, setLoadingCambios] = useState(true)
  const [isCambioDialogOpen, setIsCambioDialogOpen] = useState(false)

  // Form states
  const [comisionForm, setComisionForm] = useState({
    nombre: '',
    codigo: '',
    porcentaje: ''
  })


  const [cambioForm, setCambioForm] = useState({
    fechaCambio: '',
    comisionId: '',
    edificioId: '',
    tipoUnidadId: ''
  })

  useEffect(() => {
    fetchComisiones()
    fetchEdificios()
    fetchTiposUnidad()
    fetchCambiosProgramados()
  }, [])

  const fetchComisiones = async () => {
    try {
      setLoadingComisiones(true)
      const response = await fetch('/api/admin/comisiones/tipos')
      const data = await response.json()

      if (data.success) {
        setComisiones(data.comisiones)
      } else {
        toast.error('Error al cargar comisiones')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingComisiones(false)
    }
  }

  const fetchEdificios = async () => {
    try {
      const response = await fetch('/api/admin/edificios')
      const data = await response.json()

      if (data.success) {
        setEdificios(data.edificios.map((e: { id: string; nombre: string }) => ({ id: e.id, nombre: e.nombre })))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchTiposUnidad = async () => {
    try {
      const response = await fetch('/api/admin/tipos-unidad')
      const data = await response.json()

      if (data.success) {
        setTiposUnidad(data.tiposUnidad)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }


  const fetchCambiosProgramados = async () => {
    try {
      setLoadingCambios(true)
      const response = await fetch('/api/admin/comisiones/programados')
      const data = await response.json()

      if (data.success) {
        setCambiosProgramados(data.cambiosProgramados)
      } else {
        toast.error('Error al cargar cambios programados')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoadingCambios(false)
    }
  }

  const resetComisionForm = () => {
    setComisionForm({
      nombre: '',
      codigo: '',
      porcentaje: ''
    })
    setEditingComision(null)
  }

  const handleOpenComisionDialog = (comision?: Comision) => {
    if (comision) {
      setComisionForm({
        nombre: comision.nombre,
        codigo: comision.codigo,
        porcentaje: (comision.porcentaje * 100).toString()
      })
      setEditingComision(comision)
    } else {
      resetComisionForm()
    }
    setIsComisionDialogOpen(true)
  }

  const handleSubmitComision = async () => {
    if (!comisionForm.nombre.trim() || !comisionForm.codigo.trim() || !comisionForm.porcentaje) {
      toast.error('Todos los campos son requeridos')
      return
    }

    const porcentajeDecimal = parseFloat(comisionForm.porcentaje) / 100
    if (isNaN(porcentajeDecimal) || porcentajeDecimal < 0 || porcentajeDecimal > 1) {
      toast.error('El porcentaje debe ser un número entre 0 y 100')
      return
    }

    try {
      const url = editingComision
        ? `/api/admin/comisiones/tipos/${editingComision.id}`
        : '/api/admin/comisiones/tipos'

      const method = editingComision ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: comisionForm.nombre,
          codigo: comisionForm.codigo,
          porcentaje: porcentajeDecimal
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsComisionDialogOpen(false)
        resetComisionForm()
        fetchComisiones()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  const handleToggleComision = async (comision: Comision) => {
    try {
      const response = await fetch(`/api/admin/comisiones/tipos/${comision.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: comision.nombre,
          codigo: comision.codigo,
          porcentaje: comision.porcentaje,
          activa: !comision.activa
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Comisión ${!comision.activa ? 'activada' : 'desactivada'}`)
        fetchComisiones()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }


  // Funciones para cambios programados
  const resetCambioForm = () => {
    setCambioForm({
      fechaCambio: '',
      comisionId: '',
      edificioId: '',
      tipoUnidadId: ''
    })
  }

  const handleSubmitCambio = async () => {
    if (!cambioForm.fechaCambio || !cambioForm.comisionId || !cambioForm.edificioId) {
      toast.error('Fecha, comisión y edificio son requeridos')
      return
    }

    try {
      const response = await fetch('/api/admin/comisiones/programados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fechaCambio: cambioForm.fechaCambio,
          comisionId: cambioForm.comisionId,
          edificioId: cambioForm.edificioId,
          tipoUnidadId: cambioForm.tipoUnidadId || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setIsCambioDialogOpen(false)
        resetCambioForm()
        fetchCambiosProgramados()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }

  const handleEjecutarCambios = async () => {
    try {
      const response = await fetch('/api/admin/comisiones/programados', {
        method: 'PATCH'
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        fetchCambiosProgramados()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    }
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Comisiones</h1>
          <p className="text-muted-foreground">
            Administra los tipos de comisión y cambios programados
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchComisiones()
            fetchTiposUnidad()
            fetchCambiosProgramados()
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar Todo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tipos" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Tipos de Comisión</span>
          </TabsTrigger>
          <TabsTrigger value="programados" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Cambios Programados</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Tipos de Comisión */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Calculator className="w-5 h-5 mr-2" />
                    Tipos de Comisión
                  </CardTitle>
                  <CardDescription>
                    Crea y gestiona los diferentes tipos de comisión disponibles
                  </CardDescription>
                </div>
                <Dialog open={isComisionDialogOpen} onOpenChange={setIsComisionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenComisionDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Comisión
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingComision ? 'Editar Comisión' : 'Nueva Comisión'}
                      </DialogTitle>
                      <DialogDescription>
                        {editingComision
                          ? 'Modifica los datos de la comisión existente'
                          : 'Crea un nuevo tipo de comisión'
                        }
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nombre">Nombre *</Label>
                          <Input
                            id="nombre"
                            value={comisionForm.nombre}
                            onChange={(e) => setComisionForm({ ...comisionForm, nombre: e.target.value })}
                            placeholder="ej: Comisión Premium"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="codigo">Código *</Label>
                          <Input
                            id="codigo"
                            value={comisionForm.codigo}
                            onChange={(e) => setComisionForm({ ...comisionForm, codigo: e.target.value })}
                            placeholder="ej: PREM"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="porcentaje">Porcentaje (%) *</Label>
                        <Input
                          id="porcentaje"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={comisionForm.porcentaje}
                          onChange={(e) => setComisionForm({ ...comisionForm, porcentaje: e.target.value })}
                          placeholder="ej: 5.5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsComisionDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmitComision}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingComision ? 'Actualizar' : 'Crear'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingComisiones ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando comisiones...</p>
                </div>
              ) : comisiones.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tipos de comisión definidos
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Porcentaje</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Asignaciones</TableHead>
                        <TableHead>Cambios Programados</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comisiones.map((comision) => (
                        <TableRow key={comision.id}>
                          <TableCell className="font-medium">{comision.nombre}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{comision.codigo}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(comision.porcentaje * 100).toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={comision.activa ? "default" : "secondary"}>
                              {comision.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </TableCell>
                          <TableCell>{comision.asignaciones}</TableCell>
                          <TableCell>{comision.cambiosProgramados}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenComisionDialog(comision)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleComision(comision)}
                              >
                                {comision.activa ? 'Desactivar' : 'Activar'}
                              </Button>
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


        {/* Tab: Cambios Programados */}
        <TabsContent value="programados" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2" />
                    Cambios Programados
                  </CardTitle>
                  <CardDescription>
                    Programa cambios de comisión para fechas futuras
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleEjecutarCambios}
                    className="flex items-center"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Ejecutar Pendientes
                  </Button>
                  <Dialog open={isCambioDialogOpen} onOpenChange={setIsCambioDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsCambioDialogOpen(true)}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Programar Cambio
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center">
                          <Clock className="w-5 h-5 mr-2" />
                          Programar Cambio de Comisión
                        </DialogTitle>
                        <DialogDescription>
                          Programa un cambio de comisión para una fecha futura específica
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="fecha-cambio">Fecha de Cambio *</Label>
                          <Input
                            id="fecha-cambio"
                            type="datetime-local"
                            value={cambioForm.fechaCambio}
                            onChange={(e) => setCambioForm({ ...cambioForm, fechaCambio: e.target.value })}
                            min={new Date().toISOString().slice(0, 16)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="comision-cambio-select">Nueva Comisión *</Label>
                          <Select
                            value={cambioForm.comisionId}
                            onValueChange={(value) => setCambioForm({ ...cambioForm, comisionId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar comisión" />
                            </SelectTrigger>
                            <SelectContent>
                              {comisiones
                                .filter(c => c.activa)
                                .map((comision) => (
                                  <SelectItem key={comision.id} value={comision.id}>
                                    {comision.nombre} ({comision.codigo}) - {(comision.porcentaje * 100).toFixed(2)}%
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="edificio-cambio-select">Proyecto *</Label>
                          <Select
                            value={cambioForm.edificioId}
                            onValueChange={(value) => setCambioForm({ ...cambioForm, edificioId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                            <SelectContent>
                              {edificios.map((edificio) => (
                                <SelectItem key={edificio.id} value={edificio.id}>
                                  {edificio.nombre}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tipo-unidad-cambio-select">Tipo de Unidad (Opcional)</Label>
                          <Select
                            value={cambioForm.tipoUnidadId}
                            onValueChange={(value) => setCambioForm({ ...cambioForm, tipoUnidadId: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Todo el proyecto o tipo específico" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todo el proyecto</SelectItem>
                              {tiposUnidad
                                .filter(tipo => cambioForm.edificioId ? tipo.edificioId === cambioForm.edificioId : true)
                                .map((tipo) => (
                                  <SelectItem key={tipo.id} value={tipo.id}>
                                    {tipo.nombre} ({tipo.codigo})
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCambioDialogOpen(false)
                            resetCambioForm()
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSubmitCambio}>
                          <Save className="w-4 h-4 mr-2" />
                          Programar Cambio
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCambios ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Cargando cambios programados...</p>
                </div>
              ) : cambiosProgramados.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay cambios programados</h3>
                  <p className="text-muted-foreground mb-4">
                    Programa cambios de comisión para fechas futuras
                  </p>
                  <Button onClick={() => setIsCambioDialogOpen(true)}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Programar Primer Cambio
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha Programada</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Proyecto</TableHead>
                        <TableHead>Tipo de Unidad</TableHead>
                        <TableHead>Porcentaje</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Creado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cambiosProgramados.map((cambio) => (
                        <TableRow key={cambio.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {new Date(cambio.fechaCambio).toLocaleDateString('es-ES')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(cambio.fechaCambio).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{cambio.comision.nombre}</div>
                              <div className="text-sm text-muted-foreground">
                                Código: {cambio.comision.codigo}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {cambio.edificio.nombre}
                          </TableCell>
                          <TableCell>
                            {cambio.tipoUnidad ? (
                              <div>
                                <div className="font-medium">{cambio.tipoUnidad.nombre}</div>
                                <div className="text-sm text-muted-foreground">
                                  Código: {cambio.tipoUnidad.codigo}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline">Todo el proyecto</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {(cambio.comision.porcentaje * 100).toFixed(2)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {cambio.ejecutado ? (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Ejecutado
                              </Badge>
                            ) : new Date(cambio.fechaCambio) <= new Date() ? (
                              <Badge variant="destructive">
                                <Clock className="w-3 h-3 mr-1" />
                                Pendiente
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Calendar className="w-3 h-3 mr-1" />
                                Programado
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(cambio.createdAt).toLocaleDateString('es-ES')}
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