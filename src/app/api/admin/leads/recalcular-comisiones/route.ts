import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/admin/leads/recalcular-comisiones')

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener parámetros del cuerpo de la petición
    const body = await request.json().catch(() => ({}))
    const { mes, año } = body

    // Determinar el período a procesar (SOLO el mes especificado, no mes anterior)
    let firstDay: Date
    let lastDay: Date

    if (mes && año) {
      // Usar mes y año específicos
      const mesNumero = parseInt(mes) - 1 // JavaScript months are 0-indexed
      const añoNumero = parseInt(año)

      if (mesNumero < 0 || mesNumero > 11) {
        return NextResponse.json(
          { error: 'El mes debe estar entre 1 y 12' },
          { status: 400 }
        )
      }

      if (añoNumero < 2020 || añoNumero > 2030) {
        return NextResponse.json(
          { error: 'El año debe estar entre 2020 y 2030' },
          { status: 400 }
        )
      }

      firstDay = new Date(añoNumero, mesNumero, 1)
      lastDay = new Date(añoNumero, mesNumero + 1, 0, 23, 59, 59)
    } else {
      // Usar mes actual si no se especifican parámetros
      const now = new Date()
      firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    console.log(`📅 Recalculando comisiones para el período: ${firstDay.toISOString()} - ${lastDay.toISOString()}`)

    // Obtener leads del mes filtrados por fecha de reserva
    // Excluir RECHAZADO y CANCELADO
    const leadsDelMes = await prisma.lead.findMany({
      where: {
        fechaPagoReserva: {
          gte: firstDay,
          lte: lastDay
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
        },
        unidad: {
          include: {
            tipoUnidadEdificio: {
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
        }
      }
    })

    console.log(`📊 Encontrados ${leadsDelMes.length} leads con comisión base en el período`)

    if (leadsDelMes.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No se encontraron leads con comisión base asignada para el período especificado`,
        estadisticas: {
          leadsEncontrados: 0,
          leadsActualizados: 0,
          periodo: {
            desde: firstDay.toISOString(),
            hasta: lastDay.toISOString(),
            mes: firstDay.getMonth() + 1,
            año: firstDay.getFullYear(),
            mesNombre: firstDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
          },
          gruposProcesados: 0
        }
      })
    }

    let leadsActualizados = 0
    const resultados = []

    // Agrupar leads por BROKER + MES + COMISIÓN BASE
    // Estructura: Map<brokerId, Map<comisionId, leads[]>>
    const groupedLeads = new Map()

    for (const lead of leadsDelMes) {
      if (!lead.comisionBase) {
        console.log(`⚠️ Lead ${lead.id} no tiene comisión base asignada, saltando...`)
        continue
      }

      const brokerId = lead.brokerId
      const comisionId = lead.comisionBase.id

      // Inicializar estructura si no existe
      if (!groupedLeads.has(brokerId)) {
        groupedLeads.set(brokerId, new Map())
      }
      if (!groupedLeads.get(brokerId).has(comisionId)) {
        groupedLeads.get(brokerId).set(comisionId, {
          commission: lead.comisionBase,
          broker: lead.broker,
          leads: []
        })
      }

      // Agregar lead al grupo
      groupedLeads.get(brokerId).get(comisionId).leads.push(lead)
    }

    console.log(`📋 Agrupados en ${groupedLeads.size} brokers`)

    // Procesar cada grupo (broker + comisión)
    let totalGroups = 0
    for (const [brokerId, commissionsMap] of groupedLeads) {
      for (const [comisionId, group] of commissionsMap) {
        totalGroups++
        const { commission, broker, leads: leadsGrupo } = group
        const cantidadLeads = leadsGrupo.length

        console.log(`🎯 [${totalGroups}] Broker: ${broker.nombre} | Commission: ${commission.nombre} (${commission.codigo}) - ${(commission.porcentaje * 100).toFixed(1)}% | Leads: ${cantidadLeads}`)

        // Buscar regla de comisión aplicable
        const reglasComision = await prisma.reglaComision.findMany({
          where: {
            comisionId: commission.id,
            cantidadMinima: { lte: cantidadLeads },
            OR: [
              { cantidadMaxima: null },
              { cantidadMaxima: { gte: cantidadLeads } }
            ]
          },
          orderBy: { cantidadMinima: 'desc' },
          take: 1
        })

        const reglaAplicable = reglasComision[0]

        console.log(`🔍 Reglas encontradas para ${cantidadLeads} leads:`, reglasComision)
        console.log(`reglaAplicable:`, reglaAplicable)

        if (reglaAplicable) {
          console.log(`✅ Aplicando regla: ${(reglaAplicable.porcentaje * 100).toFixed(1)}% para ${cantidadLeads} leads (rango: ${reglaAplicable.cantidadMinima}-${reglaAplicable.cantidadMaxima || '∞'})`)

          // Actualizar todos los leads del grupo
          for (const lead of leadsGrupo) {
            console.log(`  📝 Actualizando lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> comisión nueva: ${(reglaAplicable.porcentaje * 100).toFixed(1)}%`)
            const nuevaComision = lead.totalLead * reglaAplicable.porcentaje

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                comision: nuevaComision,
                reglaComisionId: reglaAplicable.id,
                comisionId: commission.id // Asegurar que la comisión base se mantenga
              }
            })

            leadsActualizados++
            resultados.push({
              leadId: lead.id,
              brokerId: broker.id,
              brokerNombre: broker.nombre,
              comisionAnterior: lead.comision,
              comisionNueva: nuevaComision,
              reglaAplicada: {
                id: reglaAplicable.id,
                porcentaje: reglaAplicable.porcentaje,
                cantidadMinima: reglaAplicable.cantidadMinima,
                cantidadMaxima: reglaAplicable.cantidadMaxima
              }
            })
          }
        } else {
          console.log(`⚠️  No se encontró regla aplicable para ${cantidadLeads} leads de la comisión ${commission.nombre}. Aplicando comisión base: ${(commission.porcentaje * 100).toFixed(1)}%`)

          // Mantener comisión base pero limpiar regla
          for (const lead of leadsGrupo) {
            console.log(`  📝 Aplicando comisión base a lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> ${(commission.porcentaje * 100).toFixed(1)}%`)
            const comisionBase = lead.totalLead * commission.porcentaje

            await prisma.lead.update({
              where: { id: lead.id },
              data: {
                comision: comisionBase,
                reglaComisionId: null,
                comisionId: commission.id // Asegurar que la comisión base se mantenga
              }
            })

            leadsActualizados++
            resultados.push({
              leadId: lead.id,
              brokerId: broker.id,
              brokerNombre: broker.nombre,
              comisionAnterior: lead.comision,
              comisionNueva: comisionBase,
              reglaAplicada: null,
              comisionBase: commission.porcentaje
            })
          }
        }
      }
    }

    console.log(`✅ Proceso completado: ${leadsActualizados} leads actualizados`)

    const mesNombre = firstDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

    return NextResponse.json({
      success: true,
      message: `Comisiones recalculadas exitosamente para ${leadsActualizados} leads de ${mesNombre}`,
      estadisticas: {
        leadsEncontrados: leadsDelMes.length,
        leadsActualizados,
        periodo: {
          desde: firstDay.toISOString(),
          hasta: lastDay.toISOString(),
          mes: firstDay.getMonth() + 1,
          año: firstDay.getFullYear(),
          mesNombre
        },
        gruposProcesados: totalGroups,
        brokersAfectados: groupedLeads.size
      },
      resultados
    })

  } catch (error) {
    console.error('❌ Error al recalcular comisiones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
