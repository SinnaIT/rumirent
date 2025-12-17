import { prisma } from '@/lib/db'

/**
 * Recalcula las comisiones de todos los leads válidos del mes actual y mes anterior
 * Aplica las reglas de comisión por cantidad agrupadas por comisión base
 * Excluye solo leads RECHAZADOS y CANCELADOS
 *
 * Este proceso asegura que:
 * - Los cambios en reglas de comisión se apliquen automáticamente
 * - Las comisiones se calculen según la cantidad de leads del broker
 * - Se mantengan actualizados los leads de los últimos 2 meses
 */
export async function recalculateCommissions() {
  console.log('💰 Starting commission recalculation for active leads...')

  try {
    // Determinar el período: mes actual + mes anterior
    const now = new Date()

    // Primer día del mes anterior
    const firstDayPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    // Último día del mes actual
    const lastDayCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    console.log(`📅 Recalculating for period: ${firstDayPreviousMonth.toISOString()} - ${lastDayCurrentMonth.toISOString()}`)

    // Obtener leads del período filtrados por fecha de reserva
    // Excluir solo RECHAZADO y CANCELADO (todos los demás estados son válidos)
    const leads = await prisma.lead.findMany({
      where: {
        fechaPagoReserva: {
          gte: firstDayPreviousMonth,
          lte: lastDayCurrentMonth
        },
        estado: {
          notIn: ['RECHAZADO', 'CANCELADO']
        },
        // Solo procesar leads que tienen una comisión base asignada
        comisionId: {
          not: null
        }
      },
      include: {
        comisionBase: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true
          }
        },
        tipoUnidadEdificio: {
          include: {
            comision: true
          }
        },
        edificio: {
          include: {
            comision: true
          }
        }
      }
    })

    console.log(`📊 Found ${leads.length} active leads with commission in the last 2 months`)

    if (leads.length === 0) {
      console.log('ℹ️ No leads to recalculate')
      return {
        success: true,
        totalProcessed: 0,
        updated: 0,
        errors: 0
      }
    }

    let updatedCount = 0
    let errorCount = 0

    // Agrupar leads por comisión base asignada para aplicar reglas
    const leadsByCommission = new Map()

    for (const lead of leads) {
      const commission = lead.comisionBase

      if (commission) {
        if (!leadsByCommission.has(commission.id)) {
          leadsByCommission.set(commission.id, {
            commission,
            leads: []
          })
        }
        leadsByCommission.get(commission.id).leads.push(lead)
      } else {
        console.log(`⚠️ Lead ${lead.id} has no commission base assigned, skipping...`)
      }
    }

    console.log(`📋 Grouped leads into ${leadsByCommission.size} commission groups`)

    // Procesar cada grupo de comisión
    for (const [, group] of leadsByCommission) {
      const { commission, leads: groupLeads } = group
      const leadsCount = groupLeads.length

      console.log(`🎯 Processing ${leadsCount} leads for commission: ${commission.nombre} (${commission.codigo}) - ${(commission.porcentaje * 100).toFixed(1)}%`)

      // Buscar regla de comisión aplicable según cantidad de leads
      const applicableRules = await prisma.reglaComision.findMany({
        where: {
          comisionId: commission.id,
          cantidadMinima: { lte: leadsCount },
          OR: [
            { cantidadMaxima: null },
            { cantidadMaxima: { gte: leadsCount } }
          ]
        },
        orderBy: { cantidadMinima: 'desc' },
        take: 1
      })

      const applicableRule = applicableRules[0]

      if (applicableRule) {
        console.log(`✅ Applying rule: ${(applicableRule.porcentaje * 100).toFixed(1)}% for ${leadsCount} leads (range: ${applicableRule.cantidadMinima}-${applicableRule.cantidadMaxima || '∞'})`)

        // Actualizar todos los leads del grupo con la regla
        for (const lead of groupLeads) {
          try {
            const newCommission = lead.totalLead * applicableRule.porcentaje

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                comision: newCommission,
                reglaComisionId: applicableRule.id,
                comisionId: commission.id // Ensure commission base is maintained
              }
            })

            updatedCount++
            console.log(`  ✓ Updated lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> ${(applicableRule.porcentaje * 100).toFixed(1)}%`)
          } catch (error) {
            errorCount++
            console.error(`  ✗ Error updating lead ${lead.id}:`, error)
          }
        }
      } else {
        console.log(`⚠️ No applicable rule for ${leadsCount} leads of commission ${commission.nombre}. Applying base commission: ${(commission.porcentaje * 100).toFixed(1)}%`)

        // Aplicar comisión base y limpiar regla
        for (const lead of groupLeads) {
          try {
            const baseCommission = lead.totalLead * commission.porcentaje

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                comision: baseCommission,
                reglaComisionId: null,
                comisionId: commission.id // Ensure commission base is maintained
              }
            })

            updatedCount++
            console.log(`  ✓ Applied base commission to lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> ${(commission.porcentaje * 100).toFixed(1)}%`)
          } catch (error) {
            errorCount++
            console.error(`  ✗ Error updating lead ${lead.id}:`, error)
          }
        }
      }
    }

    console.log(`✅ Commission recalculation completed:`)
    console.log(`   - Period: Current month + Previous month`)
    console.log(`   - Total leads processed: ${leads.length}`)
    console.log(`   - Commission groups: ${leadsByCommission.size}`)
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
