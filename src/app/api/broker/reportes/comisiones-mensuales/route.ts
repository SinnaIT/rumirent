import { NextRequest, NextResponse } from 'next/server'
import { requireBrokerOrTeamLeader } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireBrokerOrTeamLeader(request)
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const year = searchParams.get('year')

    if (!mes || !year) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 })
    }

    const mesNum = parseInt(mes)
    const yearNum = parseInt(year)

    // Crear fechas de inicio y fin del mes
    const fechaInicio = new Date(yearNum, mesNum, 1)
    const fechaFin = new Date(yearNum, mesNum + 1, 0, 23, 59, 59, 999)

    console.log('Búsqueda de comisiones:', {
      brokerId: user.id,
      fechaInicio,
      fechaFin,
      mes: mesNum,
      year: yearNum
    })

    // Primero verificar si el broker tiene leads en general
    const totalLeads = await prisma.lead.count({
      where: {
        brokerId: user.id,
      },
    })
    console.log(`Total leads del broker: ${totalLeads}`)

    // Buscar leads del broker que tengan fechaPagoReserva O fechaCheckin en el período
    // Excluye rechazados y cancelados
    const leads = await prisma.lead.findMany({
      where: {
        brokerId: user.id,
        OR: [
          {
            fechaPagoReserva: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
          {
            fechaCheckin: {
              gte: fechaInicio,
              lte: fechaFin,
            },
          },
        ],
        estado: {
          notIn: ['RECHAZADO', 'CANCELADO']
        },
      },
      include: {
        cliente: true,
        unidad: {
          include: {
            edificio: true,
            tipoUnidadEdificio: {
              include: {
                comision: true,
              },
            },
          },
        },
      },
      orderBy: [
        { fechaPagoReserva: 'desc' },
        { fechaCheckin: 'desc' },
      ],
    })

    console.log(`Encontrados ${leads.length} leads para el usuario ${user.id}`)

    // Calcular comisiones para cada lead
    const comisionesMensuales = leads.map((lead) => {
      // Verificar si las fechas están en el período consultado
      const reservaEnPeriodo = lead.fechaPagoReserva &&
        lead.fechaPagoReserva >= fechaInicio &&
        lead.fechaPagoReserva <= fechaFin

      const checkinEnPeriodo = lead.fechaCheckin &&
        lead.fechaCheckin >= fechaInicio &&
        lead.fechaCheckin <= fechaFin

      // Comisión proyectada: Basada en la reserva (sin validar estado ni checkin)
      const comisionProyectada = reservaEnPeriodo ? (lead.comision || 0) : 0

      // Comisión confirmada: Solo si tiene checkin en el período y estado DEPARTAMENTO_ENTREGADO
      const comisionConfirmada = (checkinEnPeriodo && lead.estado === 'DEPARTAMENTO_ENTREGADO')
        ? (lead.comision || 0)
        : 0

      // Calcular porcentaje basado en el tipo de unidad si existe
      let porcentajeComision = 0
      if (lead.unidad?.tipoUnidadEdificio?.comision) {
        porcentajeComision = lead.unidad.tipoUnidadEdificio.comision.porcentaje
      } else if (lead.totalLead && lead.comision) {
        // Calcular porcentaje retroactivamente si no hay tipo de unidad
        porcentajeComision = (lead.comision / lead.totalLead) * 100
      }

      return {
        id: lead.id,
        leadId: lead.id,
        clienteNombre: lead.cliente.nombre,
        edificioNombre: lead.edificio?.nombre || 'Sin edificio',
        unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
        totalLead: lead.totalLead,
        comision: lead.comision,
        comisionProyectada,
        comisionConfirmada,
        porcentajeComision: Math.round(porcentajeComision * 100) / 100,
        fechaPagoReserva: lead.fechaPagoReserva?.toISOString() || null,
        fechaCheckin: lead.fechaCheckin?.toISOString() || null,
        reservaEnPeriodo,
        checkinEnPeriodo,
        estadoLead: lead.estado,
      }
    })

    // Calcular totales
    const totales = {
      comisionesProyectadas: comisionesMensuales.reduce((sum, lead) => sum + lead.comisionProyectada, 0),
      comisionesConfirmadas: comisionesMensuales.reduce((sum, lead) => sum + lead.comisionConfirmada, 0),
      totalLeads: comisionesMensuales.length,
      leadsConReservaEnPeriodo: comisionesMensuales.filter(l => l.reservaEnPeriodo).length,
      leadsConCheckinEnPeriodo: comisionesMensuales.filter(l => l.checkinEnPeriodo).length,
    }

    return NextResponse.json({
      leads: comisionesMensuales,
      totales,
    })
  } catch (error) {
    console.error('Error fetching comisiones mensuales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}