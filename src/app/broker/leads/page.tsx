'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Users, Eye, Search, Mail, Phone, MapPin, Calendar, MessageCircle } from 'lucide-react'

interface Cliente {
  id: string
  nombre: string
  rut: string
  email?: string
  telefono?: string
  direccion?: string
  fechaNacimiento?: string
  createdAt: string
  updatedAt: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      console.log('[LEADS] Fetching clientes from /api/broker/clientes')
      const response = await fetch('/api/broker/clientes')
      console.log('[LEADS] Response status:', response.status)
      console.log('[LEADS] Response ok:', response.ok)

      const data = await response.json()
      console.log('[LEADS] Response data:', data)

      if (data.success) {
        console.log('[LEADS] Clientes received:', data.clientes.length)
        setClientes(data.clientes)
      } else {
        console.error('[LEADS] Error in response:', data.error)
        toast.error(data.error || 'Error al cargar leads')
      }
    } catch (error) {
      console.error('[LEADS] Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (clienteId: string) => {
    router.push(`/broker/leads/${clienteId}`)
  }

  const handleSendWhatsApp = (telefono: string) => {
    const phoneNumber = telefono.replace(/\D/g, '')
    window.open(`https://wa.me/${phoneNumber}`, '_blank')
  }

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.telefono && cliente.telefono.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center">
            <Users className="w-6 h-6 mr-2" />
            Mis Leads
          </h1>
          <p className="text-muted-foreground">
            Gestiona la información de tus clientes potenciales
          </p>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3">
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
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{clientes.length}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Leads */}
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
                  <TableHead>Nombre</TableHead>
                  <TableHead>RUT</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Fecha Nacimiento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
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
                        {searchTerm && (
                          <p className="text-sm">Intenta con otros términos de búsqueda</p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
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
                        {cliente.direccion ? (
                          <div className="flex items-center text-sm">
                            <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                            {cliente.direccion}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.fechaNacimiento ? (
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                            {formatDate(cliente.fechaNacimiento)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {cliente.telefono && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                              onClick={() => handleSendWhatsApp(cliente.telefono!)}
                            >
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetail(cliente.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
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
