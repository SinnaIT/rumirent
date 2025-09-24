'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileCheck,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  GripVertical
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import {
  CSS
} from '@dnd-kit/utilities'

interface ExcelData {
  fechaLead: string
  monto: number
  proyecto: string
  unidad: string
  raw: any
}

interface LeadSistema {
  id: string
  fechaLead: string
  totalLead: number
  edificioNombre: string
  unidadCodigo: string
  clienteNombre: string
  brokerNombre: string
  comision: number
  conciliado: boolean
}

interface ConciliacionMatch {
  id: string
  excel: ExcelData
  sistema: LeadSistema
  tipo: 'automatico' | 'manual'
  confidence: number
}

interface DraggableRowProps {
  id: string
  children: React.ReactNode
  isDragging?: boolean
}

function DraggableRow({ id, children, isDragging }: DraggableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      <TableCell className="w-8">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </TableCell>
      {children}
    </TableRow>
  )
}

export default function ConciliacionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Estados para los datos
  const [excelData, setExcelData] = useState<ExcelData[]>([])
  const [leadsSistema, setLeadsSistema] = useState<LeadSistema[]>([])
  const [matches, setMatches] = useState<ConciliacionMatch[]>([])

  // Estados para drag and drop
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [draggedItem, setDraggedItem] = useState<any>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filtros
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString())
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())

  const meses = [
    { value: '0', label: 'Enero' },
    { value: '1', label: 'Febrero' },
    { value: '2', label: 'Marzo' },
    { value: '3', label: 'Abril' },
    { value: '4', label: 'Mayo' },
    { value: '5', label: 'Junio' },
    { value: '6', label: 'Julio' },
    { value: '7', label: 'Agosto' },
    { value: '8', label: 'Septiembre' },
    { value: '9', label: 'Octubre' },
    { value: '10', label: 'Noviembre' },
    { value: '11', label: 'Diciembre' },
  ]

  const años = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year.toString(), label: year.toString() }
  })

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const processFile = async () => {
    if (!selectedFile) return

    setProcessing(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mes', selectedMonth)
      formData.append('year', selectedYear)

      const response = await fetch('/api/admin/conciliacion/process-file', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setExcelData(data.excelData)
        setLeadsSistema(data.leadsSistema)
        setMatches(data.matches)
      } else {
        console.error('Error processing file')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setProcessing(false)
    }
  }

  const loadLeadsPendientes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/conciliacion/leads-pendientes?mes=${selectedMonth}&year=${selectedYear}`)
      if (response.ok) {
        const data = await response.json()
        setLeadsSistema(data.leads)
      }
    } catch (error) {
      console.error('Error loading contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  const conciliarManual = async (excelIndex: number, leadId: string) => {
    try {
      const excel = excelData[excelIndex]
      const lead = leadsSistema.find(c => c.id === leadId)

      if (excel && lead) {
        const newMatch: ConciliacionMatch = {
          id: `match-${Date.now()}`,
          excel,
          sistema: lead,
          tipo: 'manual',
          confidence: 0.5
        }

        setMatches(prev => [...prev, newMatch])
        setExcelData(prev => prev.filter((_, i) => i !== excelIndex))
        setLeadsSistema(prev => prev.filter(c => c.id !== leadId))
      }
    } catch (error) {
      console.error('Error in manual conciliation:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id)

    // Encontrar el item que se está arrastrando
    const excelIndex = excelData.findIndex((_, i) => `excel-${i}` === active.id)
    if (excelIndex !== -1) {
      setDraggedItem({ type: 'excel', data: excelData[excelIndex], index: excelIndex })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedItem(null)

    if (!over) return

    // Si se suelta sobre un lead del sistema
    if (active.id.toString().startsWith('excel-') && over.id.toString().startsWith('sistema-')) {
      const excelIndex = parseInt(active.id.toString().replace('excel-', ''))
      const leadId = over.id.toString().replace('sistema-', '')
      conciliarManual(excelIndex, leadId)
    }
  }

  const confirmarConciliacion = async () => {
    if (matches.length === 0) return

    try {
      const response = await fetch('/api/admin/conciliacion/confirmar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ matches }),
      })

      if (response.ok) {
        // Limpiar datos después de confirmar
        setMatches([])
        setExcelData([])
        setLeadsSistema([])
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        alert('Conciliación confirmada exitosamente')
      }
    } catch (error) {
      console.error('Error confirming conciliation:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Conciliación de Leads</h1>
        <p className="text-muted-foreground">
          Concilia los leads del sistema con los datos de archivos Excel/CSV para el pago de comisiones
        </p>
      </div>

      {/* Filtros y carga de archivo */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Período de Conciliación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mes">Mes</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="año">Año</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar año" />
                  </SelectTrigger>
                  <SelectContent>
                    {años.map((año) => (
                      <SelectItem key={año.value} value={año.value}>
                        {año.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={loadLeadsPendientes} className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <Filter className="mr-2 h-4 w-4" />
                  Cargar Leads Pendientes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Cargar Archivo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">Archivo Excel/CSV</Label>
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Debe contener: fecha lead, monto, proyecto, unidad
              </p>
            </div>
            <Button
              onClick={processFile}
              disabled={!selectedFile || processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Procesar Archivo
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas */}
      {(excelData.length > 0 || leadsSistema.length > 0 || matches.length > 0) && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Datos Excel</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{excelData.length}</div>
              <p className="text-xs text-muted-foreground">Registros cargados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Sistema</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leadsSistema.length}</div>
              <p className="text-xs text-muted-foreground">Sin conciliar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matches</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.length}</div>
              <p className="text-xs text-muted-foreground">Conciliados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automáticos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {matches.filter(m => m.tipo === 'automatico').length}
              </div>
              <p className="text-xs text-muted-foreground">Match perfecto</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nuevo Layout con Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Tablas lado a lado arriba */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Datos Excel - Izquierda */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Datos CSV/Excel ({excelData.length})</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Arrastra un registro hacia la tabla de leads del sistema para conciliar
                </p>
              </CardHeader>
              <CardContent>
                {excelData.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext items={excelData.map((_, i) => `excel-${i}`)} strategy={verticalListSortingStrategy}>
                          {excelData.map((row, index) => (
                            <DraggableRow key={`excel-${index}`} id={`excel-${index}`}>
                              <TableCell>{formatDate(row.fechaLead)}</TableCell>
                              <TableCell className="font-medium">{row.proyecto}</TableCell>
                              <TableCell>{row.unidad}</TableCell>
                              <TableCell>{formatCurrency(row.monto)}</TableCell>
                            </DraggableRow>
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay datos del archivo</p>
                    <p className="text-xs">Carga un archivo Excel/CSV para comenzar</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leads Sistema - Derecha */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Leads Sistema ({leadsSistema.length})</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Suelta aquí los registros del CSV para crear una conciliación
                </p>
              </CardHeader>
              <CardContent>
                {leadsSistema.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Unidad</TableHead>
                          <TableHead>Monto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadsSistema.map((lead) => (
                          <TableRow
                            key={`sistema-${lead.id}`}
                            id={`sistema-${lead.id}`}
                            className="hover:bg-blue-50 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
                          >
                            <TableCell>{formatDate(lead.fechaLead)}</TableCell>
                            <TableCell>{lead.clienteNombre}</TableCell>
                            <TableCell className="font-medium">{lead.edificioNombre}</TableCell>
                            <TableCell>{lead.unidadCodigo}</TableCell>
                            <TableCell>{formatCurrency(lead.totalLead)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                    <Clock className="h-8 w-8 mx-auto mb-2" />
                    <p>No hay leads sin conciliar</p>
                    <p className="text-xs">Para el período seleccionado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Conciliados - Abajo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Registros Conciliados ({matches.length})</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revisa las conciliaciones antes de confirmar el pago de comisiones
                  </p>
                </div>
                {matches.length > 0 && (
                  <Button onClick={confirmarConciliacion} className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar Conciliación ({matches.length})
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {matches.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>CSV - Proyecto</TableHead>
                        <TableHead>CSV - Unidad</TableHead>
                        <TableHead>CSV - Monto</TableHead>
                        <TableHead>Sistema - Cliente</TableHead>
                        <TableHead>Sistema - Proyecto</TableHead>
                        <TableHead>Sistema - Unidad</TableHead>
                        <TableHead>Sistema - Monto</TableHead>
                        <TableHead>Broker</TableHead>
                        <TableHead>Comisión</TableHead>
                        <TableHead>Confianza</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((match, index) => (
                        <TableRow key={match.id} className="hover:bg-gray-50">
                          <TableCell>
                            <Badge variant={match.tipo === 'automatico' ? 'default' : 'secondary'}>
                              {match.tipo === 'automatico' ? 'Auto' : 'Manual'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{match.excel.proyecto}</TableCell>
                          <TableCell>{match.excel.unidad}</TableCell>
                          <TableCell className="text-green-700 font-medium">{formatCurrency(match.excel.monto)}</TableCell>
                          <TableCell>{match.sistema.clienteNombre}</TableCell>
                          <TableCell className="font-medium">{match.sistema.edificioNombre}</TableCell>
                          <TableCell>{match.sistema.unidadCodigo}</TableCell>
                          <TableCell className="text-blue-700 font-medium">{formatCurrency(match.sistema.totalLead)}</TableCell>
                          <TableCell>{match.sistema.brokerNombre}</TableCell>
                          <TableCell className="text-orange-700 font-medium">{formatCurrency(match.sistema.comision)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    match.confidence > 0.8 ? 'bg-green-600' :
                                    match.confidence > 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${match.confidence * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">{Math.round(match.confidence * 100)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No hay registros conciliados</h3>
                  <p className="text-sm">Arrastra registros del CSV hacia los leads del sistema para crear conciliaciones</p>
                  <p className="text-xs mt-1">También puedes procesar un archivo para obtener coincidencias automáticas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Overlay para mostrar el item siendo arrastrado */}
        <DragOverlay>
          {activeId && draggedItem ? (
            <Card className="opacity-80 rotate-3 shadow-lg">
              <CardContent className="p-3">
                <div className="text-sm font-medium">{draggedItem.data.proyecto}</div>
                <div className="text-xs text-muted-foreground">{draggedItem.data.unidad}</div>
                <div className="text-xs font-medium text-green-600">{formatCurrency(draggedItem.data.monto)}</div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}