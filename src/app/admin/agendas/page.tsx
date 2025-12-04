'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Clock,
  Play,
  RefreshCw,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Activity,
  Zap
} from 'lucide-react'

interface CronJob {
  name: string
  description: string
  schedule: string
  nextRun: string
  enabled: boolean
}

interface ScheduledChange {
  id: string
  fechaCambio: string
  ejecutado: boolean
  comisionNueva: {
    nombre: string
    porcentaje: number
  }
  edificio?: {
    id: string
    nombre: string
  }
  edificioTipoUnidad?: {
    edificio: {
      id: string
      nombre: string
    }
    tipoUnidad: {
      nombre: string
      codigo: string
    }
  }
}

interface CronStatus {
  cronJobsEnabled: boolean
  schedule: string
  timezone: string
  lastCheck: string
  jobs: CronJob[]
  scheduledChanges: {
    pending: number
    overdue: number
    executed: number
    upcoming: ScheduledChange[]
    overdueList: ScheduledChange[]
    recentlyExecuted: ScheduledChange[]
  }
  stats: {
    totalActiveLeads: number
    pendingChanges: number
    executedToday: number
  }
}

export default function AgendasPage() {
  const [status, setStatus] = useState<CronStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/cron/status')
      const data = await response.json()

      if (data.success) {
        setStatus(data.status)
      } else {
        toast.error('Error al cargar el estado de las agendas')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const executeJob = async (jobType: string) => {
    try {
      setExecuting(jobType)

      const response = await fetch('/api/admin/cron/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobType })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message || 'Trabajo ejecutado exitosamente')
        fetchStatus() // Refrescar estado
      } else {
        toast.error(data.error || 'Error al ejecutar el trabajo')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error de conexión')
    } finally {
      setExecuting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando estado de agendas...</p>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se pudo cargar el estado de las agendas</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agendas y Trabajos Programados</h1>
          <p className="text-muted-foreground">
            Gestión de procesos automatizados y cambios programados
          </p>
        </div>
        <Button onClick={fetchStatus} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads Activos</p>
                <p className="text-2xl font-bold">{status.stats.totalActiveLeads}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cambios Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{status.scheduledChanges.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cambios Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{status.scheduledChanges.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ejecutados Hoy</p>
                <p className="text-2xl font-bold text-green-600">{status.stats.executedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cron Jobs Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Trabajos Programados
          </CardTitle>
          <CardDescription>
            Estado y configuración de los procesos automáticos ({status.schedule} - {status.timezone})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.jobs.map((job, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{job.name}</h3>
                    <Badge variant={job.enabled ? "default" : "secondary"}>
                      {job.enabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{job.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    <Clock className="inline h-3 w-3 mr-1" />
                    Próxima ejecución: {new Date(job.nextRun).toLocaleString('es-CL')}
                  </p>
                </div>
                <Button
                  onClick={() => executeJob(
                    job.name.includes('Recálculo') ? 'recalculate-commissions' : 'execute-commission-changes'
                  )}
                  disabled={executing !== null}
                  size="sm"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {executing === (job.name.includes('Recálculo') ? 'recalculate-commissions' : 'execute-commission-changes')
                    ? 'Ejecutando...'
                    : 'Ejecutar Ahora'}
                </Button>
              </div>
            ))}

            <Separator />

            <div className="flex justify-end">
              <Button
                onClick={() => executeJob('all')}
                disabled={executing !== null}
                variant="outline"
              >
                <Zap className="w-4 h-4 mr-2" />
                {executing === 'all' ? 'Ejecutando Todo...' : 'Ejecutar Todos los Trabajos'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambios Vencidos */}
      {status.scheduledChanges.overdueList.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Cambios Vencidos (Pendientes de Ejecutar)
            </CardTitle>
            <CardDescription>
              Estos cambios deberían haberse ejecutado automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Comisión Nueva</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.scheduledChanges.overdueList.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      {new Date(change.fechaCambio).toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>
                      {change.edificio
                        ? `Edificio: ${change.edificio.nombre}`
                        : change.edificioTipoUnidad
                        ? `Tipo: ${change.edificioTipoUnidad.tipoUnidad.nombre} (${change.edificioTipoUnidad.edificio.nombre})`
                        : 'Global'}
                    </TableCell>
                    <TableCell>
                      {change.comisionNueva.nombre} ({change.comisionNueva.porcentaje}%)
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Vencido</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Próximos Cambios */}
      {status.scheduledChanges.upcoming.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos Cambios Programados
            </CardTitle>
            <CardDescription>
              Cambios que se ejecutarán automáticamente en las fechas indicadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Comisión Nueva</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.scheduledChanges.upcoming.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      {new Date(change.fechaCambio).toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>
                      {change.edificio
                        ? `Edificio: ${change.edificio.nombre}`
                        : change.edificioTipoUnidad
                        ? `Tipo: ${change.edificioTipoUnidad.tipoUnidad.nombre} (${change.edificioTipoUnidad.edificio.nombre})`
                        : 'Global'}
                    </TableCell>
                    <TableCell>
                      {change.comisionNueva.nombre} ({change.comisionNueva.porcentaje}%)
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Programado</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Cambios Ejecutados Recientemente */}
      {status.scheduledChanges.recentlyExecuted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Cambios Ejecutados Recientemente
            </CardTitle>
            <CardDescription>
              Últimos cambios que se ejecutaron exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha de Ejecución</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Comisión Aplicada</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {status.scheduledChanges.recentlyExecuted.map((change) => (
                  <TableRow key={change.id}>
                    <TableCell>
                      {new Date(change.fechaCambio).toLocaleString('es-CL')}
                    </TableCell>
                    <TableCell>
                      {change.edificio
                        ? `Edificio: ${change.edificio.nombre}`
                        : change.edificioTipoUnidad
                        ? `Tipo: ${change.edificioTipoUnidad.tipoUnidad.nombre} (${change.edificioTipoUnidad.edificio.nombre})`
                        : 'Global'}
                    </TableCell>
                    <TableCell>
                      {change.comisionNueva.nombre} ({change.comisionNueva.porcentaje}%)
                    </TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">
                        Ejecutado
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
