'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { FileText, Search, Building2, DollarSign, User } from 'lucide-react'

interface Lead {
  id: string
  estado: string
  total: number | null
  montoUf: number | null
  codigoUnidad: string | null
  fechaPagoReserva: string | null
  fechaPagoContrato: string | null
  fechaCheckin: string | null
  createdAt: string
  broker: { id: string; nombre: string }
  cliente: { id: string; nombre: string; rut: string }
  edificio: { id: string; nombre: string } | null
  unidad: { id: string; numero: string } | null
  comision: { id: string; nombre: string; porcentaje: number } | null
}

export default function TeamVentasPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBrokerId, setFilterBrokerId] = useState<string>('all')
  const [filterEstado, setFilterEstado] = useState<string>('all')

  useEffect(() => {
    fetchLeads()
  }, [filterBrokerId])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterBrokerId && filterBrokerId !== 'all') {
        params.set('brokerId', filterBrokerId)
      }
      const response = await fetch(`/api/team-leader/ventas?${params}`)
      const data = await response.json()
      setLeads(data.leads || [])
    } catch {
      toast.error('Error al cargar los prospectos')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400',
      RESERVA_PAGADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
      APROBADO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-400',
      RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    }
    return styles[estado] || 'bg-gray-100 text-gray-800'
  }

  const brokers = Array.from(
    new Map(leads.map(l => [l.broker.id, l.broker])).values()
  )

  const estados = Array.from(new Set(leads.map(l => l.estado)))

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.cliente.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.codigoUnidad && l.codigoUnidad.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.edificio && l.edificio.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesEstado = filterEstado === 'all' || l.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  const totalMonto = filteredLeads.reduce((sum, l) => sum + (l.total || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center">
          <FileText className="w-6 h-6 mr-2" />
          Prospectos del Equipo
        </h1>
        <p className="text-muted-foreground">
          Leads activos y su estado de los brokers de tu equipo
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Prospectos</p>
                <p className="text-3xl font-bold text-primary">{filteredLeads.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monto Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMonto)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entregados</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {filteredLeads.filter(l => l.estado === 'ENTREGADO').length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, RUT, unidad o edificio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Select value={filterBrokerId} onValueChange={setFilterBrokerId}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los brokers</SelectItem>
                {brokers.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {estados.map(e => (
                  <SelectItem key={e} value={e}>{e.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Prospectos</CardTitle>
          <CardDescription>
            {filteredLeads.length} prospecto{filteredLeads.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broker</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Edificio</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>F. Reserva</TableHead>
                  <TableHead>F. Check-in</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p>
                          {searchTerm
                            ? 'No se encontraron prospectos que coincidan con tu búsqueda'
                            : 'No hay prospectos registrados'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{lead.broker.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{lead.cliente.nombre}</p>
                          <p className="text-xs text-muted-foreground font-mono">{lead.cliente.rut}</p>
                        </div>
                      </TableCell>
                      <TableCell>{lead.edificio?.nombre || '-'}</TableCell>
                      <TableCell>{lead.unidad?.numero || lead.codigoUnidad || '-'}</TableCell>
                      <TableCell>{lead.total ? formatCurrency(lead.total) : '-'}</TableCell>
                      <TableCell>
                        {lead.comision ? (
                          <span className="text-sm">{lead.comision.porcentaje}%</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{formatDate(lead.fechaPagoReserva)}</TableCell>
                      <TableCell>{formatDate(lead.fechaCheckin)}</TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadge(lead.estado)}>
                          {lead.estado.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
