import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Fecha de inicio y fin son requeridas' },
        { status: 400 }
      )
    }

    const fechaInicio = new Date(startDate)
    const fechaFin = new Date(endDate)
    fechaFin.setHours(23, 59, 59, 999)

    console.log('Búsqueda de flujo de caja:', {
      brokerId: authResult.user.id,
      fechaInicio,
      fechaFin,
    })

    // Buscar leads del broker en el rango de fechas (excluyendo rechazados y cancelados)
    // Traemos leads que tengan fechaPagoReserva O fechaCheckin en el período
    const leads = await prisma.lead.findMany({
      where: {
        brokerId: authResult.user.id,
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
          notIn: ['RECHAZADO', 'CANCELADO'],
        },
      },
      include: {
        cliente: true,
        edificio: true,
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
        { fechaPagoReserva: 'asc' },
        { fechaCheckin: 'asc' },
      ],
    })

    console.log(`Encontrados ${leads.length} leads para flujo de caja`)

    // Agrupar por fecha (día)
    // Agrupa tanto por fechaPagoReserva como por fechaCheckin
    const cashFlowByDate = new Map<string, {
      fecha: string
      totalComisiones: number
      cantidadReservas: number
      cantidadCheckins: number
      leads: Array<{
        id: string
        clienteNombre: string
        edificioNombre: string
        unidadCodigo: string
        montoComision: number
        estado: string
        tipo: 'reserva' | 'checkin'
      }>
    }>()

    // Procesar reservas (por fechaPagoReserva)
    leads.forEach((lead) => {
      if (!lead.fechaPagoReserva) return

      const reservaDate = new Date(lead.fechaPagoReserva)
      if (reservaDate >= fechaInicio && reservaDate <= fechaFin) {
        const fecha = reservaDate.toISOString().split('T')[0] // YYYY-MM-DD

        if (!cashFlowByDate.has(fecha)) {
          cashFlowByDate.set(fecha, {
            fecha,
            totalComisiones: 0,
            cantidadReservas: 0,
            cantidadCheckins: 0,
            leads: [],
          })
        }

        const dayData = cashFlowByDate.get(fecha)!

        dayData.cantidadReservas += 1
        dayData.leads.push({
          id: lead.id,
          clienteNombre: lead.cliente.nombre,
          edificioNombre: lead.edificio?.nombre || 'Sin edificio',
          unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
          montoComision: 0, // Las reservas no generan comisión hasta el checkin
          estado: lead.estado,
          tipo: 'reserva',
        })
      }
    })

    // Procesar checkins (por fechaCheckin)
    leads.forEach((lead) => {
      if (!lead.fechaCheckin) return

      const checkinDate = new Date(lead.fechaCheckin)
      if (checkinDate >= fechaInicio && checkinDate <= fechaFin) {
        const fecha = checkinDate.toISOString().split('T')[0] // YYYY-MM-DD

        if (!cashFlowByDate.has(fecha)) {
          cashFlowByDate.set(fecha, {
            fecha,
            totalComisiones: 0,
            cantidadReservas: 0,
            cantidadCheckins: 0,
            leads: [],
          })
        }

        const dayData = cashFlowByDate.get(fecha)!
        const montoComision = lead.estado === 'DEPARTAMENTO_ENTREGADO' ? (lead.comision || 0) : 0

        dayData.totalComisiones += montoComision
        dayData.cantidadCheckins += 1
        dayData.leads.push({
          id: lead.id,
          clienteNombre: lead.cliente.nombre,
          edificioNombre: lead.edificio?.nombre || 'Sin edificio',
          unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
          montoComision,
          estado: lead.estado,
          tipo: 'checkin',
        })
      }
    })

    // Convertir Map a Array y ordenar por fecha
    const cashFlowData = Array.from(cashFlowByDate.values()).sort(
      (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )

    // Calcular totales generales
    const totalGeneral = cashFlowData.reduce(
      (sum, day) => sum + day.totalComisiones,
      0
    )
    const totalReservas = cashFlowData.reduce(
      (sum, day) => sum + day.cantidadReservas,
      0
    )
    const totalCheckins = cashFlowData.reduce(
      (sum, day) => sum + day.cantidadCheckins,
      0
    )

    // Agrupar leads por mes
    // Las reservas se agrupan por fechaPagoReserva
    // Los checkins se agrupan por fechaCheckin
    const monthlyData = new Map<string, {
      month: string
      reservas: number
      checkins: number
      brutoReservas: number
      bruto: number
      liquido: number
    }>()

    // Primero, procesar reservas (por fechaPagoReserva)
    leads.forEach((lead) => {
      if (!lead.fechaPagoReserva) return

      const reservaDate = new Date(lead.fechaPagoReserva)
      // Verificar que la fecha de pago reserva esté en el rango
      if (reservaDate >= fechaInicio && reservaDate <= fechaFin) {
        const monthKey = reservaDate.toLocaleDateString('es-CL', { month: 'long' })

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthKey,
            reservas: 0,
            checkins: 0,
            brutoReservas: 0,
            bruto: 0,
            liquido: 0,
          })
        }

        const monthData = monthlyData.get(monthKey)!

        // Contar reserva
        monthData.reservas += 1

        // Bruto de reservas: suma del total de los leads
        monthData.brutoReservas += lead.totalLead || 0
      }
    })

    // Segundo, procesar checkins (por fechaCheckin)
    leads.forEach((lead) => {
      if (!lead.fechaCheckin) return

      const checkinDate = new Date(lead.fechaCheckin)
      // Verificar que la fecha de checkin esté en el rango
      if (checkinDate >= fechaInicio && checkinDate <= fechaFin) {
        const monthKey = checkinDate.toLocaleDateString('es-CL', { month: 'long' })

        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthKey,
            reservas: 0,
            checkins: 0,
            brutoReservas: 0,
            bruto: 0,
            liquido: 0,
          })
        }

        const monthData = monthlyData.get(monthKey)!

        // Solo contar checkins de departamentos entregados
        if (lead.estado === 'DEPARTAMENTO_ENTREGADO') {
          monthData.checkins += 1

          // Bruto: suma de las comisiones de checkins confirmados
          monthData.bruto += lead.comision || 0

          // Liquido: por ahora igual al bruto
          monthData.liquido += lead.comision || 0
        }
      }
    })

    const monthlyBreakdown = Array.from(monthlyData.values())

    // Calcular totales
    const totals = {
      reservas: monthlyBreakdown.reduce((sum, m) => sum + m.reservas, 0),
      checkins: monthlyBreakdown.reduce((sum, m) => sum + m.checkins, 0),
      brutoReservas: monthlyBreakdown.reduce((sum, m) => sum + m.brutoReservas, 0),
      bruto: monthlyBreakdown.reduce((sum, m) => sum + m.bruto, 0),
      liquido: monthlyBreakdown.reduce((sum, m) => sum + m.liquido, 0),
    }

    return NextResponse.json({
      data: cashFlowData,
      summary: {
        totalComisiones: totalGeneral,
        totalReservas,
        totalCheckins,
        promedioComision: totalCheckins > 0 ? totalGeneral / totalCheckins : 0,
      },
      monthlyBreakdown,
      totals,
    })
  } catch (error) {
    console.error('Error fetching cash flow:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
