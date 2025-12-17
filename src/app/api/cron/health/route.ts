import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Health check endpoint para verificar que los cron jobs estén funcionando
 * Este endpoint es público (no requiere autenticación) para poder ser usado
 * por servicios de monitoreo externos
 */
export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    // Verificar que la base de datos esté accesible
    const dbCheck = await prisma.$queryRaw`SELECT 1 as ok`

    // Verificar si hay cambios programados vencidos (más de 1 hora pasada la fecha)
    const overdueChanges = await prisma.cambioComisionProgramado.count({
      where: {
        ejecutado: false,
        fechaCambio: {
          lte: oneHourAgo
        }
      }
    })

    // Verificar si hay cambios ejecutados recientemente (últimas 24 horas)
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentExecutions = await prisma.cambioComisionProgramado.count({
      where: {
        ejecutado: true,
        updatedAt: {
          gte: last24Hours
        }
      }
    })

    // Obtener próximo cambio programado
    const nextScheduledChange = await prisma.cambioComisionProgramado.findFirst({
      where: {
        ejecutado: false,
        fechaCambio: {
          gt: now
        }
      },
      orderBy: {
        fechaCambio: 'asc'
      },
      select: {
        id: true,
        fechaCambio: true
      }
    })

    // Calcular el estado del sistema
    const isHealthy = overdueChanges === 0
    const warnings: string[] = []

    if (overdueChanges > 0) {
      warnings.push(`${overdueChanges} cambios programados no se ejecutaron a tiempo`)
    }

    const health = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: now.toISOString(),
      checks: {
        database: {
          status: 'ok',
          message: 'Database connection successful'
        },
        cronJobs: {
          status: isHealthy ? 'ok' : 'warning',
          message: isHealthy
            ? 'All scheduled changes executed on time'
            : `${overdueChanges} overdue changes detected`
        }
      },
      metrics: {
        overdueChanges,
        recentExecutions24h: recentExecutions,
        nextScheduledChange: nextScheduledChange ? {
          id: nextScheduledChange.id,
          scheduledFor: nextScheduledChange.fechaCambio.toISOString(),
          inMinutes: Math.round((nextScheduledChange.fechaCambio.getTime() - now.getTime()) / 60000)
        } : null
      },
      warnings,
      cronSchedule: {
        recalculateCommissions: '0 * * * * (Every hour)',
        executeScheduledChanges: '0 * * * * (Every hour)',
        timezone: 'America/Santiago'
      }
    }

    return NextResponse.json(health, {
      status: isHealthy ? 200 : 503
    })

  } catch (error) {
    console.error('❌ Health check failed:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: errorMessage
    }, {
      status: 503
    })
  }
}
