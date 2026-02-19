'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Receipt, Plus, Edit, Trash2, ArrowUpCircle, ArrowDownCircle, Calendar, Percent } from 'lucide-react'

interface TaxType {
  id: string
  name: string
  nature: 'ADDITIVE' | 'DEDUCTIVE'
  active: boolean
  createdAt: string
  updatedAt: string
  taxRates: TaxRate[]
  _count: { users: number }
}

interface TaxRate {
  id: string
  taxTypeId: string
  rate: number
  validFrom: string
  active: boolean
  createdAt: string
  updatedAt: string
  taxType?: {
    id: string
    name: string
    nature: 'ADDITIVE' | 'DEDUCTIVE'
  }
}

const NATURE_LABELS: Record<string, string> = {
  ADDITIVE: 'Suma al monto',
  DEDUCTIVE: 'Resta al monto',
}

const NATURE_ICONS: Record<string, React.ReactNode> = {
  ADDITIVE: <ArrowUpCircle className="w-3 h-3" />,
  DEDUCTIVE: <ArrowDownCircle className="w-3 h-3" />,
}

const NATURE_COLORS: Record<string, string> = {
  ADDITIVE: 'bg-green-100 text-green-700 border-green-200',
  DEDUCTIVE: 'bg-red-100 text-red-700 border-red-200',
}

export default function ImpuestosPage() {
  const [activeTab, setActiveTab] = useState('tipos')

  // --- Tax Types state ---
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [editingType, setEditingType] = useState<TaxType | null>(null)
  const [typeForm, setTypeForm] = useState({ name: '', nature: 'DEDUCTIVE' as 'ADDITIVE' | 'DEDUCTIVE', active: true })
  const [savingType, setSavingType] = useState(false)

  // --- Tax Rates state ---
  const [taxRates, setTaxRates] = useState<TaxRate[]>([])
  const [loadingRates, setLoadingRates] = useState(true)
  const [rateDialogOpen, setRateDialogOpen] = useState(false)
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null)
  const [rateForm, setRateForm] = useState({ taxTypeId: '', rate: '', validFrom: '', active: true })
  const [savingRate, setSavingRate] = useState(false)

  // --- Fetch ---
  const fetchTaxTypes = useCallback(async () => {
    setLoadingTypes(true)
    try {
      const res = await fetch('/api/admin/tax-types')
      const data = await res.json()
      if (data.success) setTaxTypes(data.data)
      else toast.error(data.error || 'Error al cargar tipos de impuesto')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoadingTypes(false)
    }
  }, [])

  const fetchTaxRates = useCallback(async () => {
    setLoadingRates(true)
    try {
      const res = await fetch('/api/admin/tax-rates')
      const data = await res.json()
      if (data.success) setTaxRates(data.data)
      else toast.error(data.error || 'Error al cargar tasas de impuesto')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoadingRates(false)
    }
  }, [])

  useEffect(() => {
    fetchTaxTypes()
    fetchTaxRates()
  }, [fetchTaxTypes, fetchTaxRates])

  // --- Tax Type CRUD ---
  const openCreateType = () => {
    setEditingType(null)
    setTypeForm({ name: '', nature: 'DEDUCTIVE', active: true })
    setTypeDialogOpen(true)
  }

  const openEditType = (t: TaxType) => {
    setEditingType(t)
    setTypeForm({ name: t.name, nature: t.nature, active: t.active })
    setTypeDialogOpen(true)
  }

  const saveType = async () => {
    if (!typeForm.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }
    setSavingType(true)
    try {
      const url = editingType ? `/api/admin/tax-types/${editingType.id}` : '/api/admin/tax-types'
      const method = editingType ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(typeForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingType ? 'Tipo de impuesto actualizado' : 'Tipo de impuesto creado')
        setTypeDialogOpen(false)
        fetchTaxTypes()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingType(false)
    }
  }

  const deleteType = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de impuesto? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/admin/tax-types/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Tipo de impuesto eliminado')
        fetchTaxTypes()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  // --- Tax Rate CRUD ---
  const openCreateRate = () => {
    setEditingRate(null)
    setRateForm({ taxTypeId: '', rate: '', validFrom: '', active: true })
    setRateDialogOpen(true)
  }

  const openEditRate = (r: TaxRate) => {
    setEditingRate(r)
    setRateForm({
      taxTypeId: r.taxTypeId,
      rate: (r.rate * 100).toFixed(2),
      validFrom: r.validFrom.split('T')[0],
      active: r.active,
    })
    setRateDialogOpen(true)
  }

  const saveRate = async () => {
    if (!rateForm.taxTypeId) { toast.error('Seleccione un tipo de impuesto'); return }
    if (!rateForm.rate) { toast.error('La tasa es requerida'); return }
    if (!rateForm.validFrom) { toast.error('La fecha de validez es requerida'); return }

    const rateValue = parseFloat(rateForm.rate) / 100
    if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
      toast.error('La tasa debe ser un valor entre 0 y 100')
      return
    }

    setSavingRate(true)
    try {
      const url = editingRate ? `/api/admin/tax-rates/${editingRate.id}` : '/api/admin/tax-rates'
      const method = editingRate ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rateForm, rate: rateValue }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingRate ? 'Tasa actualizada' : 'Tasa creada')
        setRateDialogOpen(false)
        fetchTaxRates()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingRate(false)
    }
  }

  const deleteRate = async (id: string) => {
    if (!confirm('¿Eliminar esta tasa de impuesto? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/admin/tax-rates/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Tasa de impuesto eliminada')
        fetchTaxRates()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Receipt className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Impuestos</h1>
            <p className="text-muted-foreground text-sm">
              Configura los tipos de impuesto y sus tasas aplicables a comisiones de brokers
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tipos" className="flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span>Tipos de Impuesto</span>
          </TabsTrigger>
          <TabsTrigger value="tasas" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            <span>Tasas de Impuesto</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB: Tipos de Impuesto ── */}
        <TabsContent value="tipos" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tipos de Impuesto</CardTitle>
                <CardDescription>
                  Define los tipos de impuesto que pueden aplicarse a las comisiones. Cada tipo puede sumar o restar al monto líquido.
                </CardDescription>
              </div>
              <Button onClick={openCreateType} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Tipo
              </Button>
            </CardHeader>
            <CardContent>
              {loadingTypes ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  Cargando...
                </div>
              ) : taxTypes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Receipt className="w-10 h-10 opacity-30" />
                  <p>No hay tipos de impuesto configurados</p>
                  <Button variant="outline" size="sm" onClick={openCreateType}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear el primero
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Naturaleza</TableHead>
                      <TableHead>Tasas configuradas</TableHead>
                      <TableHead>Brokers asignados</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxTypes.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${NATURE_COLORS[t.nature]}`}
                          >
                            {NATURE_ICONS[t.nature]}
                            {NATURE_LABELS[t.nature]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{t.taxRates.length} tasa(s)</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{t._count.users} broker(s)</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={t.active ? 'default' : 'secondary'}>
                            {t.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditType(t)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteType(t.id)}
                              title="Eliminar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB: Tasas de Impuesto ── */}
        <TabsContent value="tasas" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Tasas de Impuesto</CardTitle>
                <CardDescription>
                  Configura las tasas porcentuales para cada tipo de impuesto. El sistema usará la tasa activa más reciente según la fecha de validez.
                </CardDescription>
              </div>
              <Button onClick={openCreateRate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Nueva Tasa
              </Button>
            </CardHeader>
            <CardContent>
              {loadingRates ? (
                <div className="flex items-center justify-center py-10 text-muted-foreground">
                  Cargando...
                </div>
              ) : taxRates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
                  <Percent className="w-10 h-10 opacity-30" />
                  <p>No hay tasas de impuesto configuradas</p>
                  <Button variant="outline" size="sm" onClick={openCreateRate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Crear la primera
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Impuesto</TableHead>
                      <TableHead>Naturaleza</TableHead>
                      <TableHead>Tasa</TableHead>
                      <TableHead>Válido desde</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taxRates.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.taxType?.name}</TableCell>
                        <TableCell>
                          {r.taxType && (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${NATURE_COLORS[r.taxType.nature]}`}
                            >
                              {NATURE_ICONS[r.taxType.nature]}
                              {NATURE_LABELS[r.taxType.nature]}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono font-semibold">
                            {(r.rate * 100).toFixed(2)}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(r.validFrom)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={r.active ? 'default' : 'secondary'}>
                            {r.active ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditRate(r)}
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRate(r.id)}
                              title="Eliminar"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Dialog: Tipo de Impuesto ── */}
      <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingType ? 'Editar Tipo de Impuesto' : 'Nuevo Tipo de Impuesto'}</DialogTitle>
            <DialogDescription>
              {editingType
                ? 'Modifica los datos del tipo de impuesto.'
                : 'Define un nuevo tipo de impuesto para asignar a brokers.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="type-name">Nombre *</Label>
              <Input
                id="type-name"
                placeholder="Ej: Retención Honorarios, IVA..."
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-nature">Naturaleza *</Label>
              <Select
                value={typeForm.nature}
                onValueChange={(v) => setTypeForm({ ...typeForm, nature: v as 'ADDITIVE' | 'DEDUCTIVE' })}
              >
                <SelectTrigger id="type-nature">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEDUCTIVE">
                    <div className="flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      Resta al monto (Deductivo)
                    </div>
                  </SelectItem>
                  <SelectItem value="ADDITIVE">
                    <div className="flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-green-500" />
                      Suma al monto (Aditivo)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {typeForm.nature === 'DEDUCTIVE'
                  ? 'Se restará del monto líquido de la comisión del broker.'
                  : 'Se sumará al monto líquido de la comisión del broker.'}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="type-active" className="cursor-pointer">Estado activo</Label>
                <p className="text-xs text-muted-foreground">
                  Solo los tipos activos pueden asignarse a brokers
                </p>
              </div>
              <Switch
                id="type-active"
                checked={typeForm.active}
                onCheckedChange={(v: boolean) => setTypeForm({ ...typeForm, active: v })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setTypeDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveType} disabled={savingType}>
                {savingType ? 'Guardando...' : editingType ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Tasa de Impuesto ── */}
      <Dialog open={rateDialogOpen} onOpenChange={setRateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRate ? 'Editar Tasa de Impuesto' : 'Nueva Tasa de Impuesto'}</DialogTitle>
            <DialogDescription>
              {editingRate
                ? 'Modifica los datos de la tasa.'
                : 'Agrega una nueva tasa para un tipo de impuesto existente.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="rate-type">Tipo de Impuesto *</Label>
              <Select
                value={rateForm.taxTypeId}
                onValueChange={(v) => setRateForm({ ...rateForm, taxTypeId: v })}
              >
                <SelectTrigger id="rate-type">
                  <SelectValue placeholder="Seleccionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  {taxTypes.filter((t) => t.active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        {t.nature === 'DEDUCTIVE'
                          ? <ArrowDownCircle className="w-3 h-3 text-red-500" />
                          : <ArrowUpCircle className="w-3 h-3 text-green-500" />}
                        {t.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-value">Tasa (%) *</Label>
              <div className="relative">
                <Input
                  id="rate-value"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ej: 19.00"
                  value={rateForm.rate}
                  onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresa el porcentaje (ej: 19 para 19%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate-valid-from">Válido desde *</Label>
              <Input
                id="rate-valid-from"
                type="date"
                value={rateForm.validFrom}
                onChange={(e) => setRateForm({ ...rateForm, validFrom: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                El sistema usará la tasa activa más reciente según esta fecha
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="rate-active" className="cursor-pointer">Tasa activa</Label>
                <p className="text-xs text-muted-foreground">
                  Solo las tasas activas se consideran en el cálculo
                </p>
              </div>
              <Switch
                id="rate-active"
                checked={rateForm.active}
                onCheckedChange={(v: boolean) => setRateForm({ ...rateForm, active: v })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveRate} disabled={savingRate}>
                {savingRate ? 'Guardando...' : editingRate ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
