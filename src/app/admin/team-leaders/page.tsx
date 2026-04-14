'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  UsersRound, Plus, Search, Edit, Mail, Phone, UserCheck, UserX, Users, X, Receipt, ArrowDownCircle, ArrowUpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { TaxType } from '@/types'
import type { TeamLeader, TeamLeaderFormData, AvailableBroker } from './interfaces'

export default function TeamLeadersPage() {
  const [teamLeaders, setTeamLeaders] = useState<TeamLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [editingTL, setEditingTL] = useState<TeamLeader | null>(null)
  const [assigningTL, setAssigningTL] = useState<TeamLeader | null>(null)
  const [availableBrokers, setAvailableBrokers] = useState<AvailableBroker[]>([])
  const [taxTypes, setTaxTypes] = useState<TaxType[]>([])
  const [formData, setFormData] = useState<TeamLeaderFormData>({
    email: '', nombre: '', rut: '', telefono: '', birthDate: '', password: '', confirmPassword: '', taxTypeId: '', role: 'TEAM_LEADER',
  })

  const fetchTeamLeaders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/team-leaders')
      if (!response.ok) throw new Error('Error al cargar líderes de equipo')
      const data = await response.json()
      setTeamLeaders(data.teamLeaders)
    } catch (error) {
      toast.error('Error al cargar los líderes de equipo')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableBrokers = async () => {
    try {
      const response = await fetch('/api/admin/brokers')
      if (!response.ok) return
      const data = await response.json()
      // Filter brokers not assigned to any team leader
      const assignedBrokerIds = new Set(
        teamLeaders.flatMap(tl => tl.brokers.map(b => b.id))
      )
      setAvailableBrokers(
        data.brokers.filter((b: AvailableBroker) => !assignedBrokerIds.has(b.id) && b.activo)
      )
    } catch {
      // silently fail
    }
  }

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

  useEffect(() => {
    fetchTeamLeaders()
    fetchTaxTypes()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    try {
      const response = await fetch('/api/admin/team-leaders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          nombre: formData.nombre,
          rut: formData.rut,
          password: formData.password,
          telefono: formData.telefono || undefined,
          birthDate: formData.birthDate || undefined,
          taxTypeId: formData.taxTypeId || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al crear líder de equipo')
      }

      toast.success('Líder de equipo creado exitosamente')
      setIsCreateModalOpen(false)
      resetForm()
      fetchTeamLeaders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTL) return

    try {
      const updateData: Record<string, string | null | undefined> = {
        email: formData.email,
        nombre: formData.nombre,
        rut: formData.rut,
        telefono: formData.telefono || undefined,
        birthDate: formData.birthDate || undefined,
        taxTypeId: formData.taxTypeId || null,
        role: formData.role,
      }
      if (formData.password && formData.password === formData.confirmPassword) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/admin/team-leaders/${editingTL.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al actualizar')
      }

      toast.success('Líder de equipo actualizado')
      setIsEditModalOpen(false)
      setEditingTL(null)
      resetForm()
      fetchTeamLeaders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/team-leaders/${id}/toggle-status`, { method: 'PATCH' })
      if (!response.ok) throw new Error('Error al cambiar estado')
      toast.success(`Líder ${currentStatus ? 'desactivado' : 'activado'} exitosamente`)
      fetchTeamLeaders()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleAssignBroker = async (brokerId: string) => {
    if (!assigningTL) return
    try {
      const response = await fetch(`/api/admin/team-leaders/${assigningTL.id}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerId }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al asignar broker')
      }
      toast.success('Broker asignado exitosamente')
      fetchTeamLeaders()
      // Refresh available brokers
      setAvailableBrokers(prev => prev.filter(b => b.id !== brokerId))
      // Update the assigning TL locally
      const broker = availableBrokers.find(b => b.id === brokerId)
      if (broker && assigningTL) {
        setAssigningTL({
          ...assigningTL,
          brokersCount: assigningTL.brokersCount + 1,
          brokers: [...assigningTL.brokers, { id: broker.id, nombre: broker.nombre, email: broker.email }],
        })
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const handleUnassignBroker = async (brokerId: string) => {
    if (!assigningTL) return
    try {
      const response = await fetch(
        `/api/admin/team-leaders/${assigningTL.id}/assignments?brokerId=${brokerId}`,
        { method: 'DELETE' },
      )
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Error al desasignar broker')
      }
      toast.success('Broker desasignado')
      fetchTeamLeaders()
      const broker = assigningTL.brokers.find(b => b.id === brokerId)
      if (broker) {
        setAvailableBrokers(prev => [...prev, { id: broker.id, nombre: broker.nombre, email: broker.email, rut: '', activo: true }])
      }
      setAssigningTL({
        ...assigningTL,
        brokersCount: assigningTL.brokersCount - 1,
        brokers: assigningTL.brokers.filter(b => b.id !== brokerId),
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  const resetForm = () => {
    setFormData({ email: '', nombre: '', rut: '', telefono: '', birthDate: '', password: '', confirmPassword: '', taxTypeId: '', role: 'TEAM_LEADER' })
  }

  const openEditModal = (tl: TeamLeader) => {
    setEditingTL(tl)
    setFormData({
      email: tl.email,
      nombre: tl.nombre,
      rut: tl.rut,
      telefono: tl.telefono || '',
      birthDate: tl.birthDate ? new Date(tl.birthDate).toISOString().split('T')[0] : '',
      password: '',
      confirmPassword: '',
      taxTypeId: tl.taxTypeId || '',
      role: 'TEAM_LEADER',
    })
    setIsEditModalOpen(true)
  }

  const openAssignModal = (tl: TeamLeader) => {
    setAssigningTL(tl)
    setIsAssignModalOpen(true)
    fetchAvailableBrokers()
  }

  const filteredTLs = teamLeaders.filter(tl =>
    tl.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tl.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tl.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: teamLeaders.length,
    activos: teamLeaders.filter(tl => tl.activo).length,
    inactivos: teamLeaders.filter(tl => !tl.activo).length,
    brokersAsignados: teamLeaders.reduce((sum, tl) => sum + tl.brokersCount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Líderes de Equipo</h1>
          <p className="text-muted-foreground mt-1">Gestiona los líderes de equipo y sus brokers asignados</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Líder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Líderes</CardTitle>
            <UsersRound className="h-4 w-4 text-primary" />
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
            <CardTitle className="text-sm font-medium">Brokers Asignados</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.brokersAsignados}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar líderes de equipo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Líderes de Equipo</CardTitle>
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
                  <TableHead>Brokers</TableHead>
                  <TableHead>Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTLs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron líderes de equipo
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTLs.map((tl) => (
                    <TableRow key={tl.id}>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(tl)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openAssignModal(tl)}>
                            <Users className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{tl.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{tl.rut}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {tl.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tl.telefono ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {tl.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(tl.id, tl.activo)}>
                          <Badge variant={tl.activo ? "default" : "secondary"}>
                            {tl.activo ? "Activo" : "Inactivo"}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell>
                        {tl.taxType ? (
                          <div className="flex items-center gap-1 text-xs">
                            {tl.taxType.nature === 'DEDUCTIVE'
                              ? <ArrowDownCircle className="w-3 h-3 text-red-500 shrink-0" />
                              : <ArrowUpCircle className="w-3 h-3 text-green-500 shrink-0" />}
                            <span className="truncate max-w-[100px]" title={tl.taxType.name}>
                              {tl.taxType.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="cursor-pointer" onClick={() => openAssignModal(tl)}>
                          {tl.brokersCount} broker{tl.brokersCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(tl.createdAt).toLocaleDateString()}
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
            <DialogTitle>Crear Líder de Equipo</DialogTitle>
            <DialogDescription>
              Complete los datos para crear un nuevo líder de equipo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="create-nombre">Nombre completo</Label>
              <Input id="create-nombre" value={formData.nombre} onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-rut">RUT</Label>
              <Input id="create-rut" placeholder="12345678-9" value={formData.rut} onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Email</Label>
              <Input id="create-email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-telefono">Teléfono (opcional)</Label>
              <Input id="create-telefono" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-birthDate">Fecha de nacimiento (opcional)</Label>
              <Input id="create-birthDate" type="date" value={formData.birthDate} onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))} />
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
              <Input id="create-password" type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-confirm-password">Confirmar contraseña</Label>
              <Input id="create-confirm-password" type="password" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} required minLength={6} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear Líder</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Líder de Equipo</DialogTitle>
            <DialogDescription>
              Modifique los datos. Deje la contraseña vacía si no desea cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre completo</Label>
              <Input id="edit-nombre" value={formData.nombre} onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-rut">RUT</Label>
              <Input id="edit-rut" value={formData.rut} onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-telefono">Teléfono</Label>
              <Input id="edit-telefono" value={formData.telefono} onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birthDate">Fecha de nacimiento</Label>
              <Input id="edit-birthDate" type="date" value={formData.birthDate} onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))} />
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
                  <SelectItem value="TEAM_LEADER">Líder de Equipo</SelectItem>
                  <SelectItem value="BROKER">Broker</SelectItem>
                </SelectContent>
              </Select>
              {formData.role !== 'TEAM_LEADER' && (
                <p className="text-xs text-amber-600">Al cambiar el rol, este usuario dejará de aparecer en la lista de líderes</p>
              )}
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
              <Input id="edit-password" type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} minLength={6} />
            </div>
            {formData.password && (
              <div className="space-y-2">
                <Label htmlFor="edit-confirm-password">Confirmar contraseña</Label>
                <Input id="edit-confirm-password" type="password" value={formData.confirmPassword} onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))} minLength={6} />
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Actualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Brokers Modal */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Gestionar Brokers — {assigningTL?.nombre}</DialogTitle>
            <DialogDescription>
              Asigne o desasigne brokers de este líder de equipo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1">
            {/* Current brokers */}
            <div>
              <h4 className="text-sm font-medium mb-2">Brokers asignados ({assigningTL?.brokers.length || 0})</h4>
              {assigningTL?.brokers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin brokers asignados</p>
              ) : (
                <div className="space-y-2">
                  {assigningTL?.brokers.map(broker => (
                    <div key={broker.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{broker.nombre}</p>
                        <p className="text-xs text-muted-foreground">{broker.email}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleUnassignBroker(broker.id)}>
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available brokers */}
            <div>
              <h4 className="text-sm font-medium mb-2">Brokers disponibles ({availableBrokers.length})</h4>
              {availableBrokers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay brokers disponibles para asignar</p>
              ) : (
                <div className="space-y-2">
                  {availableBrokers.map(broker => (
                    <div key={broker.id} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                      <div>
                        <p className="text-sm font-medium">{broker.nombre}</p>
                        <p className="text-xs text-muted-foreground">{broker.email}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleAssignBroker(broker.id)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Asignar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
