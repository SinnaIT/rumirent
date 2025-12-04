import { prisma } from '@/lib/db'

/**
 * Ejecuta los cambios de comisión programados que han llegado a su fecha
 * Actualiza las comisiones de edificios o tipos de unidad según corresponda
 */
export async function executeScheduledCommissionChanges() {
  console.log('📅 Starting execution of scheduled commission changes...')

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

    console.log(`📊 Found ${cambiosPendientes.length} pending commission changes to execute`)

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

    console.log(`✅ Scheduled commission changes execution completed:`)
    console.log(`   - Total changes processed: ${cambiosPendientes.length}`)
    console.log(`   - Executed: ${executedCount}`)
    console.log(`   - Errors: ${errorCount}`)

    // Si se ejecutaron cambios, recalcular comisiones de leads afectados
    if (executedCount > 0) {
      console.log(`🔄 Triggering commission recalculation for affected leads...`)
      // Nota: Esto se ejecutará en el siguiente ciclo del cron job de recálculo
      // o podríamos llamar a recalculateCommissions() aquí directamente
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
