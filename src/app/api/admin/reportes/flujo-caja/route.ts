import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    if (!year) {
      return NextResponse.json({ error: 'Año es requerido' }, { status: 400 })
    }

    const yearNum = parseInt(year)

    console.log('Flujo caja query for year:', yearNum)

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    // Obtener todos los leads del año
    const fechaInicioAño = new Date(yearNum, 0, 1)
    const fechaFinAño = new Date(yearNum, 11, 31, 23, 59, 59, 999)

    const leadsDelAño = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: fechaInicioAño,
          lte: fechaFinAño,
        },
        estado: {
          not: 'RECHAZADO'
        }
      },
      include: {
        cliente: true,
        broker: true,
        unidad: {
          include: {
            edificio: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    console.log(`Found ${leadsDelAño.length} contracts for year ${yearNum}`)

    // Generar datos mensuales
    const flujoCajaData = meses.map((nombreMes, index) => {
      // Fechas del mes
      const fechaInicio = new Date(yearNum, index, 1)
      const fechaFin = new Date(yearNum, index + 1, 0, 23, 59, 59, 999)

      // Filtrar leads del mes
      const leadsDelMes = leadsDelAño.filter(
        (lead) => lead.createdAt >= fechaInicio && lead.createdAt <= fechaFin
      )

      // Calcular métricas del mes (con soporte para estados antiguos y nuevos)
      const reservas = leadsDelMes
        .filter(c => c.estado === 'ENTREGADO' || c.estado === 'DEPARTAMENTO_ENTREGADO' || c.estado === 'RESERVA_PAGADA')
        .reduce((sum, lead) => {
          // Simular valor de reserva (10% del total)
          return sum + (lead.totalLead * 0.1)
        }, 0)

      const checkin = leadsDelMes
        .filter(c => c.estado === 'APROBADO')
        .reduce((sum, lead) => {
          // Simular valor de checkin (20% del total)
          return sum + (lead.totalLead * 0.2)
        }, 0)

      const cobro = leadsDelMes
        .reduce((sum, lead) => sum + lead.totalLead, 0)

      const bruto = leadsDelMes
        .reduce((sum, lead) => {
          // Ingresos brutos incluyen total del lead más comisiones
          return sum + lead.totalLead + (lead.comision || 0)
        }, 0)

      // Líquido = Bruto - gastos (simulamos 15% de gastos operativos)
      const liquido = bruto * 0.85

      return {
        mes: nombreMes,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        reservas: Math.round(reservas),
        checkin: Math.round(checkin),
        cobro: Math.round(cobro),
        bruto: Math.round(bruto),
        liquido: Math.round(liquido),
      }
    })

    // Calcular estadísticas anuales
    const totalReservas = flujoCajaData.reduce((sum, mes) => sum + mes.reservas, 0)
    const totalCheckin = flujoCajaData.reduce((sum, mes) => sum + mes.checkin, 0)
    const totalCobro = flujoCajaData.reduce((sum, mes) => sum + mes.cobro, 0)
    const totalBruto = flujoCajaData.reduce((sum, mes) => sum + mes.bruto, 0)
    const totalLiquido = flujoCajaData.reduce((sum, mes) => sum + mes.liquido, 0)

    // Encontrar el mejor mes
    const mejorMes = flujoCajaData.reduce((mejor, mes) =>
      mes.liquido > mejor.liquido ? mes : mejor
    )

    // Calcular crecimiento mensual promedio
    let crecimientoMensual = 0
    if (flujoCajaData.length > 1) {
      const mesesConDatos = flujoCajaData.filter(mes => mes.liquido > 0)
      if (mesesConDatos.length > 1) {
        const primerMes = mesesConDatos[0]
        const ultimoMes = mesesConDatos[mesesConDatos.length - 1]
        if (primerMes.liquido > 0) {
          crecimientoMensual = ((ultimoMes.liquido - primerMes.liquido) / primerMes.liquido) * 100 / mesesConDatos.length
        }
      }
    }

    const stats = {
      totalReservas,
      totalCheckin,
      totalCobro,
      totalBruto,
      totalLiquido,
      mejorMes: mejorMes.mes,
      crecimientoMensual: Math.round(crecimientoMensual * 10) / 10,
    }

    console.log('Flujo caja stats:', stats)

    return NextResponse.json({
      flujoCaja: flujoCajaData,
      stats,
      year: yearNum,
    })
  } catch (error) {
    console.error('Error fetching flujo caja data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}