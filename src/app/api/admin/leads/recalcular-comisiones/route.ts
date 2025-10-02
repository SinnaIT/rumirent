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

    // Determinar el período a procesar
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

    // Obtener leads del mes actual filtrados por fecha de reserva
    const leadsDelMes = await prisma.lead.findMany({
      where: {
        fechaPagoReserva: {
          gte: firstDay,
          lte: lastDay
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
          comisionesUnicas: 0
        }
      })
    }

    let leadsActualizados = 0
    const resultados = []

    // Agrupar leads por comisión base asignada para aplicar reglas
    const leadsPorComision = new Map()

    for (const lead of leadsDelMes) {
      // Usar la comisión base asignada directamente al lead
      const comision = lead.comisionBase

      if (comision) {
        if (!leadsPorComision.has(comision.id)) {
          leadsPorComision.set(comision.id, {
            comision,
            leads: []
          })
        }
        leadsPorComision.get(comision.id).leads.push(lead)
      } else {
        console.log(`⚠️ Lead ${lead.id} no tiene comisión base asignada, saltando...`)
      }
    }

    // Procesar cada grupo de comisión
    for (const [, grupo] of leadsPorComision) {
      const { comision, leads: leadsGrupo } = grupo
      const cantidadLeads = leadsGrupo.length

      console.log(`🎯 Procesando ${cantidadLeads} leads para comisión: ${comision.nombre} (${comision.codigo}) - ${(comision.porcentaje * 100).toFixed(1)}%`)

      // Buscar regla de comisión aplicable
      const reglasComision = await prisma.reglaComision.findMany({
        where: {
          comisionId: comision.id,
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
              comisionId: comision.id // Asegurar que la comisión base se mantenga
            }
          })

          leadsActualizados++
          resultados.push({
            leadId: lead.id,
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
        console.log(`⚠️  No se encontró regla aplicable para ${cantidadLeads} leads de la comisión ${comision.nombre}. Aplicando comisión base: ${(comision.porcentaje * 100).toFixed(1)}%`)

        // Mantener comisión base pero limpiar regla
        for (const lead of leadsGrupo) {
          console.log(`  📝 Aplicando comisión base a lead ${lead.id}: $${lead.totalLead.toLocaleString()} -> ${(comision.porcentaje * 100).toFixed(1)}%`)
          const comisionBase = lead.totalLead * comision.porcentaje

          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              comision: comisionBase,
              reglaComisionId: null,
              comisionId: comision.id // Asegurar que la comisión base se mantenga
            }
          })

          leadsActualizados++
          resultados.push({
            leadId: lead.id,
            comisionAnterior: lead.comision,
            comisionNueva: comisionBase,
            reglaAplicada: null,
            comisionBase: comision.porcentaje
          })
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
        comisionesUnicas: leadsPorComision.size
      },
      resultados
    })

  } catch (error) {
    console.error('❌ Error al recalcular comisiones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}