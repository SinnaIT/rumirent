'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, Calendar, DollarSign } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Broker {
  id: string
  nombre: string
  email: string
  rut: string
}

interface Meta {
  id: string
  brokerId: string | null
  mes: number
  anio: number
  montoMeta: number
  createdAt: string
  updatedAt: string
  broker: Broker | null
}

const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export default function MetasPage() {
  const [metas, setMetas] = useState<Meta[]>([])
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    brokerId: '',
    mes: '',
    anio: new Date().getFullYear().toString(),
    montoMeta: '',
  })

  // Filters
  const [filterBrokerId, setFilterBrokerId] = useState<string>('')
  const [filterMes, setFilterMes] = useState<string>('')
  const [filterAnio, setFilterAnio] = useState<string>('')

  useEffect(() => {
    fetchMetas()
    fetchBrokers()
  }, [filterBrokerId, filterMes, filterAnio])

  const fetchMetas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterBrokerId) params.append('brokerId', filterBrokerId)
      if (filterMes) params.append('mes', filterMes)
      if (filterAnio) params.append('anio', filterAnio)

      const response = await fetch(`/api/admin/metas?${params}`)
      if (!response.ok) throw new Error('Error al cargar metas')
      const data = await response.json()
      setMetas(data)
    } catch (error) {
      console.error('Error fetching metas:', error)
      setError('Error al cargar las metas')
    } finally {
      setLoading(false)
    }
  }

  const fetchBrokers = async () => {
    try {
      const response = await fetch('/api/admin/brokers')
      if (!response.ok) throw new Error('Error al cargar brokers')
      const data = await response.json()
      setBrokers(data.brokers || [])
    } catch (error) {
      console.error('Error fetching brokers:', error)
      setBrokers([])
    }
  }

  const handleOpenDialog = (meta?: Meta) => {
    if (meta) {
      setEditingMeta(meta)
      setFormData({
        brokerId: meta.brokerId || '',
        mes: meta.mes.toString(),
        anio: meta.anio.toString(),
        montoMeta: meta.montoMeta.toString(),
      })
    } else {
      setEditingMeta(null)
      setFormData({
        brokerId: '',
        mes: '',
        anio: new Date().getFullYear().toString(),
        montoMeta: '',
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingMeta(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const url = editingMeta
        ? `/api/admin/metas/${editingMeta.id}`
        : '/api/admin/metas'

      const method = editingMeta ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerId: formData.brokerId || null,
          mes: parseInt(formData.mes),
          anio: parseInt(formData.anio),
          montoMeta: parseFloat(formData.montoMeta),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar la meta')
      }

      setSuccess(editingMeta ? 'Meta actualizada exitosamente' : 'Meta creada exitosamente')
      handleCloseDialog()
      fetchMetas()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta meta?')) return

    try {
      const response = await fetch(`/api/admin/metas/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar la meta')
      }

      setSuccess('Meta eliminada exitosamente')
      fetchMetas()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Metas Mensuales
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Configura las metas de colocación para cada broker
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nueva Meta</span>
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-success/10 border-success text-success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Broker</Label>
            <Select value={filterBrokerId || "all"} onValueChange={(value) => setFilterBrokerId(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los brokers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los brokers</SelectItem>
                {brokers.map((broker) => (
                  <SelectItem key={broker.id} value={broker.id}>
                    {broker.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mes</Label>
            <Select value={filterMes || "all"} onValueChange={(value) => setFilterMes(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {meses.map((mes, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Año</Label>
            <Input
              type="number"
              placeholder="Año"
              value={filterAnio}
              onChange={(e) => setFilterAnio(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Broker
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                  Período
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                  Monto Meta
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : metas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    No hay metas configuradas
                  </td>
                </tr>
              ) : (
                metas.map((meta) => (
                  <tr key={meta.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      {meta.broker ? (
                        <div>
                          <p className="font-semibold text-card-foreground">{meta.broker.nombre}</p>
                          <p className="text-sm text-muted-foreground">{meta.broker.email}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-primary">Meta General</p>
                          <p className="text-sm text-muted-foreground">Aplica a todos los brokers</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-card-foreground">
                          {meses[meta.mes - 1]} {meta.anio}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-mono font-bold text-accent">
                          {formatCurrency(meta.montoMeta)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(meta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(meta.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMeta ? 'Editar Meta Mensual' : 'Nueva Meta Mensual'}
            </DialogTitle>
            <DialogDescription>
              {editingMeta
                ? 'Actualiza los datos de la meta mensual'
                : 'Configura una nueva meta de colocación para un broker'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="brokerId">Broker</Label>
              <Select
                value={formData.brokerId || "general"}
                onValueChange={(value) => setFormData({ ...formData, brokerId: value === "general" ? "" : value })}
                disabled={!!editingMeta}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un broker o meta general" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    Meta General (todos los brokers)
                  </SelectItem>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.nombre} - {broker.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Las metas específicas de un broker sobrescriben la meta general
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mes">Mes</Label>
                <Select
                  value={formData.mes}
                  onValueChange={(value) => setFormData({ ...formData, mes: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {meses.map((mes, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {mes}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="anio">Año</Label>
                <Input
                  id="anio"
                  type="number"
                  value={formData.anio}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  min="2020"
                  max="2100"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="montoMeta">Monto Meta (CLP)</Label>
              <Input
                id="montoMeta"
                type="number"
                value={formData.montoMeta}
                onChange={(e) => setFormData({ ...formData, montoMeta: e.target.value })}
                min="0"
                step="1000"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingMeta ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
