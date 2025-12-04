import { prisma } from '@/lib/db'

/**
 * Recalcula las comisiones de todos los leads en estado DEPARTAMENTO_ENTREGADO
 * Solo los leads entregados generan comisiones pagables
 * Esto asegura que si hay cambios en las reglas de comisión o configuraciones,
 * los leads existentes se actualicen automáticamente
 */
export async function recalculateCommissions() {
  console.log('💰 Starting commission recalculation for delivered leads...')

  try {
    // Obtener todos los leads en estado DEPARTAMENTO_ENTREGADO
    const leads = await prisma.lead.findMany({
      where: {
        estado: 'DEPARTAMENTO_ENTREGADO'
      },
      include: {
        tipoUnidadEdificio: {
          include: {
            edificioAsignaciones: {
              where: {
                activo: true
              },
              include: {
                comision: true
              }
            }
          }
        },
        edificio: {
          include: {
            comision: true
          }
        },
        broker: true
      }
    })

    console.log(`📊 Found ${leads.length} delivered leads to recalculate`)

    let updatedCount = 0
    let errorCount = 0

    for (const lead of leads) {
      try {
        // Calcular la comisión según la jerarquía:
        // 1. Comisión del tipo de unidad (si existe)
        // 2. Comisión del edificio (si existe)
        // 3. Comisión base del lead

        let comisionPorcentaje = 0
        let nuevaComisionId: string | null = null

        // Prioridad 1: Comisión del tipo de unidad
        if (lead.tipoUnidadEdificio?.edificioAsignaciones?.[0]?.comision) {
          const asignacion = lead.tipoUnidadEdificio.edificioAsignaciones[0]
          comisionPorcentaje = asignacion.comision.porcentaje
          nuevaComisionId = asignacion.comision.id
        }
        // Prioridad 2: Comisión del edificio
        else if (lead.edificio?.comision) {
          comisionPorcentaje = lead.edificio.comision.porcentaje
          nuevaComisionId = lead.edificio.comision.id
        }
        // Prioridad 3: Mantener comisión actual del lead
        else if (lead.comisionBase) {
          // No hacer nada, mantener la comisión actual
          continue
        }

        // Calcular el monto de la comisión
        const nuevaComision = (lead.totalLead * comisionPorcentaje) / 100

        // Solo actualizar si hay cambios
        if (Math.abs(nuevaComision - lead.comision) > 0.01 || nuevaComisionId !== lead.comisionBaseId) {
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              comision: nuevaComision,
              comisionBaseId: nuevaComisionId
            }
          })
          updatedCount++
          console.log(`  ✓ Updated lead ${lead.id}: ${lead.comision} → ${nuevaComision} (${comisionPorcentaje}%)`)
        }
      } catch (error) {
        errorCount++
        console.error(`  ✗ Error updating lead ${lead.id}:`, error)
      }
    }

    console.log(`✅ Commission recalculation completed:`)
    console.log(`   - Total leads processed: ${leads.length}`)
    console.log(`   - Updated: ${updatedCount}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - Unchanged: ${leads.length - updatedCount - errorCount}`)

    return {
      success: true,
      totalProcessed: leads.length,
      updated: updatedCount,
      errors: errorCount
    }
  } catch (error) {
    console.error('❌ Error in commission recalculation:', error)
    throw error
  }
}
