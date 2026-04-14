'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Users, Search, Mail, Phone, FileText, DollarSign } from 'lucide-react'

import type { BrokerBasic } from '@/types'

type Broker = BrokerBasic & {
  telefono: string | null
  activo: boolean
  totalLeads: number
  leadsActivos: number
  comisionesTotales: number
}

export default function TeamEquipoPage() {
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchBrokers()
  }, [])

  const fetchBrokers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/team-leader/brokers')
      const data = await response.json()
      setBrokers(data.brokers || [])
    } catch {
      toast.error('Error al cargar el equipo')
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

  const filteredBrokers = brokers.filter(b =>
    b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.rut.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalLeads = brokers.reduce((sum, b) => sum + b.totalLeads, 0)
  const totalLeadsActivos = brokers.reduce((sum, b) => sum + b.leadsActivos, 0)
  const totalComisiones = brokers.reduce((sum, b) => sum + b.comisionesTotales, 0)

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
          Mi Equipo
        </h1>
        <p className="text-muted-foreground">
          Brokers asignados a tu equipo y sus estadísticas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Brokers</p>
                <p className="text-3xl font-bold text-primary">{brokers.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-3xl font-bold">{totalLeads}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Leads Activos</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalLeadsActivos}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Comisiones Totales</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalComisiones)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Brokers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Brokers del Equipo</CardTitle>
          <CardDescription>
            {filteredBrokers.length} broker{filteredBrokers.length !== 1 ? 's' : ''}
            {searchTerm && ' encontrado'}
            {filteredBrokers.length !== 1 && searchTerm && 's'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Total Leads</TableHead>
                  <TableHead className="text-center">Leads Activos</TableHead>
                  <TableHead className="text-right">Comisiones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBrokers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p>
                          {searchTerm
                            ? 'No se encontraron brokers que coincidan con tu búsqueda'
                            : 'No hay brokers asignados a tu equipo'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBrokers.map((broker) => (
                    <TableRow key={broker.id}>
                      <TableCell className="font-medium">{broker.nombre}</TableCell>
                      <TableCell className="font-mono text-sm">{broker.rut}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          {broker.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {broker.telefono ? (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                            {broker.telefono}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={broker.activo ? 'default' : 'secondary'}>
                          {broker.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{broker.totalLeads}</TableCell>
                      <TableCell className="text-center font-medium text-blue-600 dark:text-blue-400">
                        {broker.leadsActivos}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(broker.comisionesTotales)}
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
