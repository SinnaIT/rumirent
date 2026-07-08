'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Calendar, DollarSign, CreditCard } from 'lucide-react'

import type { Anticipo, AnticipoStatus, BrokerBasic } from '@/types'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const STATUS_LABELS: Record<AnticipoStatus, string> = {
  PENDIENTE: 'Pendiente',
  APLICADO: 'Aplicado',
  ANULADO: 'Anulado',
}

const STATUS_VARIANTS: Record<AnticipoStatus, 'default' | 'secondary' | 'destructive'> = {
  PENDIENTE: 'secondary',
  APLICADO: 'default',
  ANULADO: 'destructive',
}

const defaultForm = {
  brokerId: '',
  monto: '',
  fecha: new Date().toISOString().split('T')[0],
  descripcion: '',
  status: 'PENDIENTE' as AnticipoStatus,
  paymentMethod: '',
  referenceNumber: '',
}

function mesAnioFromFecha(fecha: string): { mes: number; anio: number } {
  const d = new Date(fecha + 'T12:00:00')
  return { mes: d.getMonth() + 1, anio: d.getFullYear() }
}

export default function AnticiposPage() {
  const [anticipos, setAnticipos] = useState<Anticipo[]>([])
  const [brokers, setBrokers] = useState<BrokerBasic[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAnticipo, setEditingAnticipo] = useState<Anticipo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultForm)

  // Filters
  const [filterBrokerId, setFilterBrokerId] = useState('')
  const [filterMes, setFilterMes] = useState('')
  const [filterAnio, setFilterAnio] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchAnticipos = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterBrokerId) params.append('brokerId', filterBrokerId)
      if (filterMes) params.append('mes', filterMes)
      if (filterAnio) params.append('anio', filterAnio)
      if (filterStatus) params.append('status', filterStatus)

      const response = await fetch(`/api/admin/anticipos?${params}`)
      if (!response.ok) throw new Error('Error al cargar anticipos')
      const data = await response.json()
      setAnticipos(data)
    } catch {
      setError('Error al cargar los anticipos')
    } finally {
      setLoading(false)
    }
  }, [filterBrokerId, filterMes, filterAnio, filterStatus])

  const fetchBrokers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/brokers')
      if (!response.ok) return
      const data = await response.json()
      setBrokers(data.brokers || [])
    } catch {
      setBrokers([])
    }
  }, [])

  useEffect(() => {
    fetchAnticipos()
  }, [fetchAnticipos])

  useEffect(() => {
    fetchBrokers()
  }, [fetchBrokers])

  const handleOpenDialog = (anticipo?: Anticipo) => {
    if (anticipo) {
      setEditingAnticipo(anticipo)
      setFormData({
        brokerId: anticipo.brokerId,
        monto: anticipo.monto.toString(),
        fecha: anticipo.fecha.split('T')[0],
        descripcion: anticipo.descripcion ?? '',
        status: anticipo.status,
        paymentMethod: anticipo.paymentMethod ?? '',
        referenceNumber: anticipo.referenceNumber ?? '',
      })
    } else {
      setEditingAnticipo(null)
      setFormData(defaultForm)
    }
    setError(null)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingAnticipo(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      const url = editingAnticipo
        ? `/api/admin/anticipos/${editingAnticipo.id}`
        : '/api/admin/anticipos'
      const method = editingAnticipo ? 'PUT' : 'POST'

      const { mes, anio } = mesAnioFromFecha(formData.fecha)
      const body = {
        brokerId: formData.brokerId,
        monto: parseFloat(formData.monto),
        fecha: formData.fecha,
        descripcion: formData.descripcion || undefined,
        mes,
        anio,
        status: formData.status,
        paymentMethod: formData.paymentMethod || undefined,
        referenceNumber: formData.referenceNumber || undefined,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Error al guardar el anticipo')
      }

      setSuccess(editingAnticipo ? 'Anticipo actualizado exitosamente' : 'Anticipo creado exitosamente')
      handleCloseDialog()
      fetchAnticipos()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este anticipo?')) return
    setSuccess(null)
    setError(null)

    try {
      const response = await fetch(`/api/admin/anticipos/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Error al eliminar el anticipo')
      setSuccess('Anticipo eliminado exitosamente')
      fetchAnticipos()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount)

  const totalMonto = anticipos.reduce((sum, a) => sum + a.monto, 0)
  const countByStatus = anticipos.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc },
    {} as Record<AnticipoStatus, number>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Anticipos</h1>
          <p className="text-lg text-muted-foreground font-medium">
            Registra anticipos de pago a brokers y descuéntalos de sus comisiones
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Anticipo</span>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Total anticipos</p>
          <p className="text-2xl font-bold text-card-foreground">{anticipos.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Monto total</p>
          <p className="text-2xl font-bold text-accent">{formatCurrency(totalMonto)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Aplicados</p>
          <p className="text-2xl font-bold text-success">{countByStatus.APLICADO ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Pendientes</p>
          <p className="text-2xl font-bold text-warning">{countByStatus.PENDIENTE ?? 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label>Broker</Label>
            <Select
              value={filterBrokerId || 'all'}
              onValueChange={(v) => setFilterBrokerId(v === 'all' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Todos los brokers" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los brokers</SelectItem>
                {brokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mes</Label>
            <Select
              value={filterMes || 'all'}
              onValueChange={(v) => setFilterMes(v === 'all' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Todos los meses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
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
          <div>
            <Label>Estado</Label>
            <Select
              value={filterStatus || 'all'}
              onValueChange={(v) => setFilterStatus(v === 'all' ? '' : v)}
            >
              <SelectTrigger><SelectValue placeholder="Todos los estados" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="APLICADO">Aplicado</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Broker</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Período</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Monto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Método de Pago</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Referencia</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  </td>
                </tr>
              ) : anticipos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No hay anticipos registrados
                  </td>
                </tr>
              ) : (
                anticipos.map((anticipo) => (
                  <tr key={anticipo.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-card-foreground">{anticipo.broker.nombre}</p>
                      <p className="text-sm text-muted-foreground">{anticipo.broker.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-card-foreground">
                          {MESES[anticipo.mes - 1]} {anticipo.anio}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <DollarSign className="h-4 w-4 text-success" />
                        <span className="font-mono font-bold text-accent">
                          {formatCurrency(anticipo.monto)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={STATUS_VARIANTS[anticipo.status]}>
                        {STATUS_LABELS[anticipo.status]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {anticipo.paymentMethod ? (
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-card-foreground">{anticipo.paymentMethod}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-card-foreground font-mono">
                        {anticipo.referenceNumber ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(anticipo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(anticipo.id)}
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
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>
              {editingAnticipo ? 'Editar Anticipo' : 'Nuevo Anticipo'}
            </DialogTitle>
            <DialogDescription>
              {editingAnticipo
                ? 'Actualiza los datos del anticipo'
                : 'Registra un anticipo de pago para un broker'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="brokerId">Broker *</Label>
              <Select
                value={formData.brokerId || 'none'}
                onValueChange={(v) => setFormData({ ...formData, brokerId: v === 'none' ? '' : v })}
                disabled={!!editingAnticipo}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un broker" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.nombre} — {b.rut}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="monto">Monto (CLP) *</Label>
                <Input
                  id="monto"
                  type="number"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  min="1"
                  step="1000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.fecha && (
              <p className="text-sm text-muted-foreground">
                Período que aplica:{' '}
                <span className="font-medium text-foreground">
                  {(() => { const { mes, anio } = mesAnioFromFecha(formData.fecha); return `${MESES[mes - 1]} ${anio}` })()}
                </span>
              </p>
            )}

            <div>
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as AnticipoStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                  <SelectItem value="APLICADO">Aplicado</SelectItem>
                  <SelectItem value="ANULADO">Anulado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentMethod">Método de pago</Label>
                <Input
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  placeholder="Ej: Transferencia"
                />
              </div>
              <div>
                <Label htmlFor="referenceNumber">Nro. de referencia</Label>
                <Input
                  id="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  placeholder="Ej: 0001234"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Observaciones adicionales (opcional)"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingAnticipo ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
