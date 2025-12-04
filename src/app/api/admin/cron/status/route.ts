import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting cron jobs status')

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const now = new Date()

    // Obtener cambios programados pendientes
    const cambiosPendientes = await prisma.cambioComisionProgramado.findMany({
      where: {
        ejecutado: false
      },
      include: {
        comisionNueva: true,
        edificio: {
          select: {
            id: true,
            nombre: true
          }
        },
        edificioTipoUnidad: {
          include: {
            edificio: {
              select: {
                id: true,
                nombre: true
              }
            },
            tipoUnidad: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaCambio: 'asc'
      }
    })

    // Separar en próximos y vencidos
    const proximosCambios = cambiosPendientes.filter(c => c.fechaCambio > now)
    const cambiosVencidos = cambiosPendientes.filter(c => c.fechaCambio <= now)

    // Obtener últimos cambios ejecutados (últimos 10)
    const cambiosEjecutados = await prisma.cambioComisionProgramado.findMany({
      where: {
        ejecutado: true
      },
      include: {
        comisionNueva: true,
        edificio: {
          select: {
            id: true,
            nombre: true
          }
        },
        edificioTipoUnidad: {
          include: {
            edificio: {
              select: {
                id: true,
                nombre: true
              }
            },
            tipoUnidad: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        }
      },
      orderBy: {
        fechaCambio: 'desc'
      },
      take: 10
    })

    // Estadísticas de leads
    const totalLeads = await prisma.lead.count({
      where: {
        estado: {
          not: 'RECHAZADO'
        }
      }
    })

    const status = {
      cronJobsEnabled: true,
      schedule: 'Every hour at minute 0',
      timezone: 'America/Santiago',
      lastCheck: now.toISOString(),
      jobs: [
        {
          name: 'Recálculo de Comisiones',
          description: 'Recalcula las comisiones de todos los leads activos',
          schedule: '0 * * * *',
          nextRun: getNextHourlyRun(),
          enabled: true
        },
        {
          name: 'Ejecución de Cambios Programados',
          description: 'Ejecuta los cambios de comisión que han llegado a su fecha',
          schedule: '0 * * * *',
          nextRun: getNextHourlyRun(),
          enabled: true
        }
      ],
      scheduledChanges: {
        pending: proximosCambios.length,
        overdue: cambiosVencidos.length,
        executed: cambiosEjecutados.length,
        upcoming: proximosCambios.slice(0, 5), // Próximos 5
        overdueList: cambiosVencidos,
        recentlyExecuted: cambiosEjecutados.slice(0, 5) // Últimos 5 ejecutados
      },
      stats: {
        totalActiveLeads: totalLeads,
        pendingChanges: cambiosPendientes.length,
        executedToday: await getExecutedTodayCount()
      }
    }

    return NextResponse.json({
      success: true,
      status
    })

  } catch (error) {
    console.error('❌ Error getting cron status:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error al obtener el estado de los trabajos', details: errorMessage },
      { status: 500 }
    )
  }
}

function getNextHourlyRun(): string {
  const now = new Date()
  const next = new Date(now)
  next.setHours(now.getHours() + 1)
  next.setMinutes(0)
  next.setSeconds(0)
  next.setMilliseconds(0)
  return next.toISOString()
}

async function getExecutedTodayCount(): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return await prisma.cambioComisionProgramado.count({
    where: {
      ejecutado: true,
      updatedAt: {
        gte: today
      }
    }
  })
}
