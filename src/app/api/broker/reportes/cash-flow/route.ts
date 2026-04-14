import { NextRequest, NextResponse } from 'next/server'
import { requireBrokerOrTeamLeader } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireBrokerOrTeamLeader(request)
    if (user instanceof NextResponse) return user

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

    // Fetch broker with ALL active tax rates (no take:1 — needed for per-month lookup)
    const broker = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        commissionTaxTypeId: true,
        commissionTaxType: {
          select: {
            id: true,
            name: true,
            nature: true,
            taxRates: {
              where: { active: true },
              orderBy: { validFrom: 'desc' }, // newest first — find() will return correct one
            },
          },
        },
      },
    })

    // Returns the tax rate valid as of a given reference date
    // (the first rate whose validFrom <= referenceDate, since rates are sorted desc)
    const getRateForDate = (referenceDate: Date) => {
      if (!broker?.commissionTaxType || !broker.commissionTaxType.taxRates.length) return null
      const validRate = broker.commissionTaxType.taxRates.find(
        (r) => new Date(r.validFrom) <= referenceDate
      )
      if (!validRate) return null
      return {
        taxTypeId: broker.commissionTaxType.id,
        taxTypeName: broker.commissionTaxType.name,
        taxNature: broker.commissionTaxType.nature,
        rate: validRate.rate,
        validFrom: validRate.validFrom,
      }
    }

    // taxInfo for the banner: rate valid as of today
    const taxInfo = getRateForDate(new Date())

    // Buscar leads del broker en el rango de fechas (excluyendo rechazados y cancelados)
    // Traemos leads que tengan fechaPagoReserva O fechaCheckin en el período
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

    // Agrupar por fecha (día)
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
        const fecha = reservaDate.toISOString().split('T')[0]

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
          montoComision: 0,
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
        const fecha = checkinDate.toISOString().split('T')[0]

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

    // Agrupar leads por mes con cálculo de impuesto
    // _lastDate tracks the latest date seen in the month — used to resolve the tax rate
    // for that specific month (instead of using today globally)
    const monthlyData = new Map<string, {
      month: string
      reservas: number
      checkins: number
      brutoReservas: number
      bruto: number
      taxAmount: number
      taxTypeName: string | null
      taxNature: string | null
      liquido: number
      _lastDate: Date | null
    }>()

    const getOrCreateMonth = (monthKey: string) => {
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: monthKey,
          reservas: 0,
          checkins: 0,
          brutoReservas: 0,
          bruto: 0,
          taxAmount: 0,
          taxTypeName: null,
          taxNature: null,
          liquido: 0,
          _lastDate: null,
        })
      }
      return monthlyData.get(monthKey)!
    }

    // Procesar reservas (por fechaPagoReserva)
    leads.forEach((lead) => {
      if (!lead.fechaPagoReserva) return

      const reservaDate = new Date(lead.fechaPagoReserva)
      if (reservaDate >= fechaInicio && reservaDate <= fechaFin) {
        const monthKey = reservaDate.toLocaleDateString('es-CL', { month: 'long' })
        const monthData = getOrCreateMonth(monthKey)
        monthData.reservas += 1
        monthData.brutoReservas += lead.totalLead || 0
        // Track latest date for tax rate resolution
        if (!monthData._lastDate || reservaDate > monthData._lastDate) {
          monthData._lastDate = reservaDate
        }
      }
    })

    // Procesar checkins (por fechaCheckin)
    leads.forEach((lead) => {
      if (!lead.fechaCheckin) return

      const checkinDate = new Date(lead.fechaCheckin)
      if (checkinDate >= fechaInicio && checkinDate <= fechaFin) {
        const monthKey = checkinDate.toLocaleDateString('es-CL', { month: 'long' })
        const monthData = getOrCreateMonth(monthKey)

        if (lead.estado === 'DEPARTAMENTO_ENTREGADO') {
          const comision = lead.comision || 0
          monthData.checkins += 1
          monthData.bruto += comision
        }
        // Track latest date for tax rate resolution (checkins are more relevant for commission)
        if (!monthData._lastDate || checkinDate > monthData._lastDate) {
          monthData._lastDate = checkinDate
        }
      }
    })

    // Apply tax calculation per month using the rate valid at the END of each month
    monthlyData.forEach((monthData) => {
      // Reconstruct a date representing the last day of this month within the report range
      // monthData.month is the locale string (e.g. "enero"), so we find the matching month
      // by scanning leads whose month key matches — use the monthKey's last checkin/reserva date
      const monthLastDate = monthData._lastDate
      const monthTaxInfo = monthLastDate ? getRateForDate(monthLastDate) : null

      if (monthTaxInfo) {
        const tax = monthData.bruto * monthTaxInfo.rate
        monthData.taxAmount = tax
        monthData.taxTypeName = monthTaxInfo.taxTypeName
        monthData.taxNature = monthTaxInfo.taxNature
        monthData.liquido = monthTaxInfo.taxNature === 'ADDITIVE'
          ? monthData.bruto + tax
          : monthData.bruto - tax
      } else {
        monthData.taxAmount = 0
        monthData.liquido = monthData.bruto
      }
    })

    // Strip internal _lastDate field before sending to client
    const monthlyBreakdown = Array.from(monthlyData.values()).map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ _lastDate, ...rest }) => rest
    )

    // Calcular totales
    const totals = {
      reservas: monthlyBreakdown.reduce((sum, m) => sum + m.reservas, 0),
      checkins: monthlyBreakdown.reduce((sum, m) => sum + m.checkins, 0),
      brutoReservas: monthlyBreakdown.reduce((sum, m) => sum + m.brutoReservas, 0),
      bruto: monthlyBreakdown.reduce((sum, m) => sum + m.bruto, 0),
      taxAmount: monthlyBreakdown.reduce((sum, m) => sum + m.taxAmount, 0),
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
      taxInfo,
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
