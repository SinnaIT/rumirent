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
import { Users, Search, Mail, Phone, Calendar } from 'lucide-react'

import type { ClienteBasic, ActiveLeadInfo } from '@/types'

interface Cliente extends ClienteBasic {
  createdAt: string
  broker: { id: string; nombre: string }
  hasActiveLead: boolean
  activeLead: ActiveLeadInfo | null
}

export default function TeamLeadsPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterBrokerId, setFilterBrokerId] = useState<string>('all')

  useEffect(() => {
    fetchClientes()
  }, [filterBrokerId])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterBrokerId && filterBrokerId !== 'all') {
        params.set('brokerId', filterBrokerId)
      }
      const response = await fetch(`/api/team-leader/leads?${params}`)
      const data = await response.json()
      setClientes(data.clientes || [])
    } catch {
      toast.error('Error al cargar los leads')
    } finally {
      setLoading(false)
    }
  }

  const brokers = Array.from(
    new Map(clientes.map(c => [c.broker.id, c.broker])).values()
  )

  const filteredClientes = clientes.filter(c =>
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.telefono && c.telefono.includes(searchTerm))
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

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
          <Users className="w-6 h-6 mr-2" />
          Leads del Equipo
        </h1>
        <p className="text-muted-foreground">
          Clientes potenciales de los brokers de tu equipo
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, RUT, email o teléfono..."
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
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{filteredClientes.length}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
          <CardDescription>
            {filteredClientes.length} lead{filteredClientes.length !== 1 ? 's' : ''}
            {searchTerm && ' encontrado'}
            {filteredClientes.length !== 1 && searchTerm && 's'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broker</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p>
                          {searchTerm
                            ? 'No se encontraron leads que coincidan con tu búsqueda'
                            : 'No hay leads registrados'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell>
                        <Badge variant="outline">{cliente.broker.nombre}</Badge>
                      </TableCell>
                      <TableCell>
                        {cliente.hasActiveLead ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="destructive" className="w-fit">Lead Activo</Badge>
                            {cliente.activeLead && (
                              <span className="text-xs text-muted-foreground">
                                {cliente.activeLead.edificio} - {cliente.activeLead.estado.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="w-fit bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            Disponible
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{cliente.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{cliente.rut}</TableCell>
                      <TableCell>
                        {cliente.email ? (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                            {cliente.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.telefono ? (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {cliente.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                          {formatDate(cliente.createdAt)}
                        </div>
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
