import { prisma } from '@/lib/db'
import { recalculateCommissionsForPeriod } from '@/lib/commissions'

/**
 * Ejecuta los cambios de comisión programados que han llegado a su fecha
 * Actualiza las comisiones de edificios o tipos de unidad según corresponda
 */
export async function executeScheduledCommissionChanges() {
  console.info('[execute-commission-changes] Starting...')

  try {
    const now = new Date()

    // Obtener todos los cambios programados que:
    // 1. No han sido ejecutados
    // 2. Su fecha de cambio ya pasó
    const cambiosPendientes = await prisma.cambioComisionProgramado.findMany({
      where: {
        ejecutado: false,
        fechaCambio: {
          lte: now
        }
      },
      include: {
        comisionNueva: true,
        edificio: true,
        edificioTipoUnidad: {
          include: {
            edificio: true,
            tipoUnidad: true
          }
        }
      },
      orderBy: {
        fechaCambio: 'asc'
      }
    })

    console.info(`[execute-commission-changes] Found ${cambiosPendientes.length} pending changes`)

    let executedCount = 0
    let errorCount = 0

    for (const cambio of cambiosPendientes) {
      try {
        console.log(`  Processing change #${cambio.id} scheduled for ${cambio.fechaCambio.toISOString()}`)

        // Caso 1: Cambio de comisión para un edificio específico
        if (cambio.edificioId) {
          await prisma.edificio.update({
            where: { id: cambio.edificioId },
            data: {
              comisionId: cambio.comisionNuevaId
            }
          })
          console.log(`    ✓ Updated building ${cambio.edificio?.nombre} commission to ${cambio.comisionNueva.nombre} (${cambio.comisionNueva.porcentaje}%)`)
        }
        // Caso 2: Cambio de comisión para un tipo de unidad en un edificio específico
        else if (cambio.edificioTipoUnidadId) {
          await prisma.edificioTipoUnidad.update({
            where: { id: cambio.edificioTipoUnidadId },
            data: {
              comisionId: cambio.comisionNuevaId
            }
          })
          console.log(`    ✓ Updated unit type ${cambio.edificioTipoUnidad?.tipoUnidad.nombre} in building ${cambio.edificioTipoUnidad?.edificio.nombre} commission to ${cambio.comisionNueva.nombre} (${cambio.comisionNueva.porcentaje}%)`)
        }
        // Caso 3: Cambio global de comisión (aplicar a todos los edificios sin comisión específica)
        else {
          // Este caso podría implementarse según las necesidades del negocio
          console.log(`    ⚠ Global commission change not implemented yet`)
        }

        // Marcar el cambio como ejecutado
        await prisma.cambioComisionProgramado.update({
          where: { id: cambio.id },
          data: {
            ejecutado: true
          }
        })

        executedCount++
      } catch (error) {
        errorCount++
        console.error(`  ✗ Error executing change #${cambio.id}:`, error)
      }
    }

    console.info(`[execute-commission-changes] Done — processed: ${cambiosPendientes.length} | executed: ${executedCount} | errors: ${errorCount}`)

    // Recalculate commissions for current month after applying scheduled changes
    if (executedCount > 0) {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      await recalculateCommissionsForPeriod(startDate, endDate)
    }

    return {
      success: true,
      totalProcessed: cambiosPendientes.length,
      executed: executedCount,
      errors: errorCount
    }
  } catch (error) {
    console.error('❌ Error executing scheduled commission changes:', error)
    throw error
  }
}
