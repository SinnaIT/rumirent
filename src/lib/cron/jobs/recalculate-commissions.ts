import { prisma } from '@/lib/db'

/**
 * Recalcula las comisiones de todos los leads válidos del mes actual y mes anterior
 * Aplica las reglas de comisión por cantidad agrupadas por BROKER + MES + COMISIÓN BASE
 * Excluye solo leads RECHAZADOS y CANCELADOS
 *
 * Lógica de agrupación:
 * - Cada broker tiene su propio conteo de leads por mes
 * - Cada comisión base se evalúa independientemente
 * - Las reglas se aplican según la cantidad de leads del grupo (broker+mes+comisión)
 *
 * Ejemplo:
 * - Broker A, Sept 2025, Comisión Estándar: 5 leads → Regla 4-10 = 8%
 * - Broker A, Sept 2025, Comisión Premium: 2 leads → Sin regla = % base
 * - Broker B, Sept 2025, Comisión Estándar: 1 lead → Sin regla = % base
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
        broker: {
          select: {
            id: true,
            nombre: true
          }
        },
        comisionBase: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true
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

    // Agrupar leads por BROKER + MES + COMISIÓN BASE
    // Estructura: Map<brokerId, Map<mesAño, Map<comisionId, leads[]>>>
    const groupedLeads = new Map()

    for (const lead of leads) {
      if (!lead.fechaPagoReserva || !lead.comisionBase) {
        console.log(`⚠️ Lead ${lead.id} missing fechaPagoReserva or comisionBase, skipping...`)
        continue
      }

      const brokerId = lead.brokerId
      const mes = lead.fechaPagoReserva.getMonth() + 1
      const año = lead.fechaPagoReserva.getFullYear()
      const mesAño = `${año}-${mes.toString().padStart(2, '0')}`
      const comisionId = lead.comisionBase.id

      // Inicializar estructura si no existe
      if (!groupedLeads.has(brokerId)) {
        groupedLeads.set(brokerId, new Map())
      }
      if (!groupedLeads.get(brokerId).has(mesAño)) {
        groupedLeads.get(brokerId).set(mesAño, new Map())
      }
      if (!groupedLeads.get(brokerId).get(mesAño).has(comisionId)) {
        groupedLeads.get(brokerId).get(mesAño).set(comisionId, {
          commission: lead.comisionBase,
          broker: lead.broker,
          period: mesAño,
          leads: []
        })
      }

      // Agregar lead al grupo
      groupedLeads.get(brokerId).get(mesAño).get(comisionId).leads.push(lead)
    }

    console.log(`📋 Grouped leads by Broker + Month + Commission`)

    // Procesar cada grupo
    let totalGroups = 0
    for (const [brokerId, monthsMap] of groupedLeads) {
      for (const [mesAño, commissionsMap] of monthsMap) {
        for (const [comisionId, group] of commissionsMap) {
          totalGroups++
          const { commission, broker, period, leads: groupLeads } = group
          const leadsCount = groupLeads.length

          console.log(`🎯 [${totalGroups}] Broker: ${broker.nombre} | Period: ${period} | Commission: ${commission.nombre} (${commission.codigo}) | Leads: ${leadsCount}`)

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
            console.log(`   ✅ Applying rule: ${(applicableRule.porcentaje * 100).toFixed(1)}% for ${leadsCount} leads (range: ${applicableRule.cantidadMinima}-${applicableRule.cantidadMaxima || '∞'})`)

            // Actualizar todos los leads del grupo con la regla
            for (const lead of groupLeads) {
              try {
                const newCommission = lead.totalLead * applicableRule.porcentaje

                await prisma.lead.update({
                  where: { id: lead.id },
                  data: {
                    comision: newCommission,
                    reglaComisionId: applicableRule.id,
                    comisionId: commission.id
                  }
                })

                updatedCount++
                console.log(`   ✓ Updated lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> ${(applicableRule.porcentaje * 100).toFixed(1)}% = $${newCommission.toLocaleString()}`)
              } catch (error) {
                errorCount++
                console.error(`   ✗ Error updating lead ${lead.id}:`, error)
              }
            }
          } else {
            console.log(`   ⚠️ No applicable rule for ${leadsCount} leads. Applying base commission: ${(commission.porcentaje * 100).toFixed(1)}%`)

            // Aplicar comisión base y limpiar regla
            for (const lead of groupLeads) {
              try {
                const baseCommission = lead.totalLead * commission.porcentaje

                await prisma.lead.update({
                  where: { id: lead.id },
                  data: {
                    comision: baseCommission,
                    reglaComisionId: null,
                    comisionId: commission.id
                  }
                })

                updatedCount++
                console.log(`   ✓ Applied base commission to lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> ${(commission.porcentaje * 100).toFixed(1)}% = $${baseCommission.toLocaleString()}`)
              } catch (error) {
                errorCount++
                console.error(`   ✗ Error updating lead ${lead.id}:`, error)
              }
            }
          }
        }
      }
    }

    console.log(`✅ Commission recalculation completed:`)
    console.log(`   - Period: Current month + Previous month`)
    console.log(`   - Total leads processed: ${leads.length}`)
    console.log(`   - Groups (Broker+Month+Commission): ${totalGroups}`)
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
