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

    // Buscar leads del broker en el rango de fechas
    const leads = await prisma.lead.findMany({
      where: {
        brokerId: authResult.user.id,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
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
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`Encontrados ${leads.length} leads para flujo de caja`)

    // Agrupar por fecha (día)
    const cashFlowByDate = new Map<string, {
      fecha: string
      totalComisiones: number
      cantidadLeads: number
      leads: Array<{
        id: string
        clienteNombre: string
        edificioNombre: string
        unidadCodigo: string
        montoComision: number
        estado: string
      }>
    }>()

    leads.forEach((lead) => {
      const fecha = lead.createdAt.toISOString().split('T')[0] // YYYY-MM-DD

      if (!cashFlowByDate.has(fecha)) {
        cashFlowByDate.set(fecha, {
          fecha,
          totalComisiones: 0,
          cantidadLeads: 0,
          leads: [],
        })
      }

      const dayData = cashFlowByDate.get(fecha)!
      const montoComision = lead.comision || 0

      dayData.totalComisiones += montoComision
      dayData.cantidadLeads += 1
      dayData.leads.push({
        id: lead.id,
        clienteNombre: lead.cliente.nombre,
        edificioNombre: lead.edificio?.nombre || 'Sin edificio',
        unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
        montoComision,
        estado: lead.estado,
      })
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
    const totalLeads = cashFlowData.reduce(
      (sum, day) => sum + day.cantidadLeads,
      0
    )

    // Agrupar leads por mes
    const monthlyData = new Map<string, {
      month: string
      reservas: number
      checkins: number
      bruto: number
      liquido: number
    }>()

    leads.forEach((lead) => {
      const monthKey = lead.createdAt.toLocaleDateString('es-CL', { month: 'long' })

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          reservas: 0,
          checkins: 0,
          bruto: 0,
          liquido: 0,
        })
      }

      const monthData = monthlyData.get(monthKey)!

      // Contar reservas pagadas
      if (lead.estado === 'RESERVA_PAGADA') {
        monthData.reservas += 1
      }

      // Contar checkins (leads con fecha de checkin)
      if (lead.fechaCheckin) {
        monthData.checkins += 1
      }

      // Sumar bruto (total del lead)
      monthData.bruto += lead.totalLead || 0

      // Sumar liquido (comisión)
      monthData.liquido += lead.comision || 0
    })

    const monthlyBreakdown = Array.from(monthlyData.values())

    // Calcular totales
    const totals = {
      reservas: monthlyBreakdown.reduce((sum, m) => sum + m.reservas, 0),
      checkins: monthlyBreakdown.reduce((sum, m) => sum + m.checkins, 0),
      bruto: monthlyBreakdown.reduce((sum, m) => sum + m.bruto, 0),
      liquido: monthlyBreakdown.reduce((sum, m) => sum + m.liquido, 0),
    }

    return NextResponse.json({
      data: cashFlowData,
      summary: {
        totalComisiones: totalGeneral,
        totalLeads,
        promedioComision: totalLeads > 0 ? totalGeneral / totalLeads : 0,
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
