'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Plus,
  Search,
  Edit,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react'
import { toast } from 'sonner'
import type { TaxType, Broker } from '@/types'
import { BrokerFormData } from './interfaces'

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'todos' | 'activos' | 'inactivos'>('activos')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null)
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([])
  const [teamLeaders, setTeamLeaders] = useState<{ id: string; nombre: string }[]>([])
  const [formData, setFormData] = useState<BrokerFormData>({
    email: '',
    nombre: '',
    rut: '',
    telefono: '',
    birthDate: '',
    password: '',
    confirmPassword: '',
    taxTypeId: '',
    role: 'BROKER',
    teamLeaderId: '',
  })

  // Cargar brokers
  const fetchBrokers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/brokers')
      if (!response.ok) throw new Error('Error al cargar brokers')
      const data = await response.json()
      setBrokers(data.brokers)
    } catch (error) {
      toast.error('Error al cargar los brokers')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar tipos de impuesto
  const fetchTaxTypes = async () => {
    try {
      const response = await fetch('/api/admin/tax-types')
      const data = await response.json()
      if (data.success) {
        setTaxTypes(data.data.filter((t: TaxType) => t.active))
      }
    } catch {
      // silently fail – tax types are optional
    }
  }

  const fetchTeamLeaders = async () => {
    try {
      const response = await fetch('/api/admin/team-leaders')
      if (!response.ok) return
      const data = await response.json()
      setTeamLeaders(data.teamLeaders.filter((tl: { activo: boolean }) => tl.activo))
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchBrokers()
    fetchTaxTypes()
    fetchTeamLeaders()
  }, [])

  // Crear broker
  const handleCreateBroker = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const response = await fetch('/api/admin/brokers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          rut: formData.rut,
          telefono: formData.telefono || undefined,
          birthDate: formData.birthDate || undefined,
          password: formData.password,
          taxTypeId: formData.taxTypeId || undefined,
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Error al crear broker')
      }

      toast.success('Broker creado exitosamente')
      setIsCreateModalOpen(false)
      resetForm()
      fetchBrokers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Editar broker
  const handleEditBroker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBroker) return

    try {
      const updateData: {
        email: string
        nombre: string
        rut: string
        telefono?: string
        birthDate?: string
        password?: string
        taxTypeId?: string | null
        role?: string
        teamLeaderId?: string | null
      } = {
        email: formData.email,
        nombre: formData.nombre,
        rut: formData.rut,
        telefono: formData.telefono || undefined,
        birthDate: formData.birthDate || undefined,
        taxTypeId: formData.taxTypeId || null,
        role: formData.role,
        teamLeaderId: formData.teamLeaderId || null,
      }

      if (formData.password && formData.password === formData.confirmPassword) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/brokers/${editingBroker.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Error al actualizar broker')
      }

      toast.success('Broker actualizado exitosamente')
      setIsEditModalOpen(false)
      setEditingBroker(null)
      resetForm()
      fetchBrokers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  // Toggle activo/inactivo
  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/brokers/${id}/toggle-status`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Error al cambiar estado')
      }

      toast.success(`Broker ${currentStatus ? 'desactivado' : 'activado'} exitosamente`)
      fetchBrokers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(message)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      nombre: '',
      rut: '',
      telefono: '',
      birthDate: '',
      password: '',
      confirmPassword: '',
      taxTypeId: '',
      role: 'BROKER',
      teamLeaderId: '',
    })
  }

  const openEditModal = (broker: Broker) => {
    setEditingBroker(broker)
    setFormData({
      email: broker.email,
      nombre: broker.nombre,
      rut: broker.rut,
      telefono: broker.telefono || '',
      birthDate: broker.birthDate ? new Date(broker.birthDate).toISOString().split('T')[0] : '',
      password: '',
      confirmPassword: '',
      taxTypeId: broker.taxTypeId || '',
      role: 'BROKER',
      teamLeaderId: broker.teamLeaderId || '',
    })
    setIsEditModalOpen(true)
  }

  // Filtrar y ordenar brokers
  const filteredBrokers = brokers
    .filter(broker => {
      const matchesSearch =
        broker.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        broker.rut.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'todos' ||
        (statusFilter === 'activos' && broker.activo) ||
        (statusFilter === 'inactivos' && !broker.activo)

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))

  // Estadísticas
  const stats = {
    total: brokers.length,
    activos: brokers.filter(c => c.activo).length,
    inactivos: brokers.filter(c => !c.activo).length,
    ventasTotales: brokers.reduce((sum, c) => sum + c.ventasRealizadas, 0)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Brokers</h1>
          <p className="text-muted-foreground mt-1">Administra los brokers del sistema</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Broker
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <UserCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactivos</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arriendos Totales</CardTitle>
            <Calendar className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.ventasTotales}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar brokers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Estado</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as 'todos' | 'activos' | 'inactivos')}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="inactivos">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Brokers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acciones</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Impuesto</TableHead>
                  <TableHead>Team Leader</TableHead>
                  <TableHead>Arriendos</TableHead>
                  <TableHead>Comisiones</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrokers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No se encontraron brokers
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(broker)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{broker.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{broker.rut}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {broker.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {broker.telefono && broker.telefono.trim() !== '' ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {broker.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(broker.id, broker.activo)}
                        >
                          <Badge variant={broker.activo ? "default" : "secondary"}>
                            {broker.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {broker.taxType ? (
                          <div className="flex items-center gap-1 text-xs">
                            {broker.taxType.nature === 'DEDUCTIVE'
                              ? <ArrowDownCircle className="w-3 h-3 text-red-500 shrink-0" />
                              : <ArrowUpCircle className="w-3 h-3 text-green-500 shrink-0" />}
                            <span className="truncate max-w-[100px]" title={broker.taxType.name}>
                              {broker.taxType.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {broker.teamLeader
                          ? broker.teamLeader.nombre
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>{broker.ventasRealizadas}</TableCell>
                      <TableCell className="font-mono">
                        ${broker.comisionesTotales.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(broker.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Broker</DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo broker en el sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBroker} className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="create-nombre">Nombre completo</Label>
              <Input
                id="create-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-rut">RUT</Label>
              <Input
                id="create-rut"
                placeholder="12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-telefono">Teléfono (opcional)</Label>
              <Input
                id="create-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-birthDate">Fecha de nacimiento (opcional)</Label>
              <Input
                id="create-birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-taxTypeId">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  Tipo de Impuesto (opcional)
                </span>
              </Label>
              <Select
                value={formData.taxTypeId || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, taxTypeId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger id="create-taxTypeId">
                  <SelectValue placeholder="Sin impuesto asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin impuesto</SelectItem>
                  {taxTypes.map((t) => (
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
              <Label htmlFor="create-password">Contraseña</Label>
              <Input
                id="create-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-confirm-password">Confirmar contraseña</Label>
              <Input
                id="create-confirm-password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Crear Broker</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Broker</DialogTitle>
            <DialogDescription>
              Modifique los datos del broker. Deje la contraseña vacía si no desea cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditBroker} className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre completo</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rut">RUT</Label>
              <Input
                id="edit-rut"
                placeholder="12345678-9"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">Como administrador, puedes cambiar el email del broker</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData(prev => ({ ...prev, role: v as 'BROKER' | 'TEAM_LEADER' }))}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BROKER">Broker</SelectItem>
                  <SelectItem value="TEAM_LEADER">Líder de Equipo</SelectItem>
                </SelectContent>
              </Select>
              {formData.role !== 'BROKER' && (
                <p className="text-xs text-amber-600">Al cambiar el rol, este usuario dejará de aparecer en la lista de brokers</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-teamLeaderId">Team Leader (opcional)</Label>
              <Select
                value={formData.teamLeaderId || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, teamLeaderId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger id="edit-teamLeaderId">
                  <SelectValue placeholder="Sin team leader asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin team leader</SelectItem>
                  {teamLeaders.map((tl) => (
                    <SelectItem key={tl.id} value={tl.id}>{tl.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input
                id="edit-telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birthDate">Fecha de nacimiento</Label>
              <Input
                id="edit-birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-taxTypeId">
                <span className="flex items-center gap-1">
                  <Receipt className="w-3 h-3" />
                  Tipo de Impuesto
                </span>
              </Label>
              <Select
                value={formData.taxTypeId || 'none'}
                onValueChange={(v) => setFormData(prev => ({ ...prev, taxTypeId: v === 'none' ? '' : v }))}
              >
                <SelectTrigger id="edit-taxTypeId">
                  <SelectValue placeholder="Sin impuesto asignado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin impuesto</SelectItem>
                  {taxTypes.map((t) => (
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
              <Label htmlFor="edit-password">Nueva contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                minLength={6}
              />
            </div>
            {formData.password && (
              <div className="space-y-2">
                <Label htmlFor="edit-confirm-password">Confirmar nueva contraseña</Label>
                <Input
                  id="edit-confirm-password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  minLength={6}
                />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}