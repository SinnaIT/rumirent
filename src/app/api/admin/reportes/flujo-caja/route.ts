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

    // Obtener todos los contratos del año
    const fechaInicioAño = new Date(yearNum, 0, 1)
    const fechaFinAño = new Date(yearNum, 11, 31, 23, 59, 59, 999)

    const contratosDelAño = await prisma.contrato.findMany({
      where: {
        createdAt: {
          gte: fechaInicioAño,
          lte: fechaFinAño,
        },
      },
      include: {
        cliente: true,
        contratista: true,
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

    console.log(`Found ${contratosDelAño.length} contracts for year ${yearNum}`)

    // Generar datos mensuales
    const flujoCajaData = meses.map((nombreMes, index) => {
      // Fechas del mes
      const fechaInicio = new Date(yearNum, index, 1)
      const fechaFin = new Date(yearNum, index + 1, 0, 23, 59, 59, 999)

      // Filtrar contratos del mes
      const contratosDelMes = contratosDelAño.filter(
        (contrato) => contrato.createdAt >= fechaInicio && contrato.createdAt <= fechaFin
      )

      // Calcular métricas del mes
      const reservas = contratosDelMes
        .filter(c => c.estado === 'ENTREGADO' || c.estado === 'RESERVA_PAGADA')
        .reduce((sum, contrato) => {
          // Simular valor de reserva (10% del total)
          return sum + (contrato.totalContrato * 0.1)
        }, 0)

      const checkin = contratosDelMes
        .filter(c => c.estado === 'APROBADO')
        .reduce((sum, contrato) => {
          // Simular valor de checkin (20% del total)
          return sum + (contrato.totalContrato * 0.2)
        }, 0)

      const cobro = contratosDelMes
        .reduce((sum, contrato) => sum + contrato.totalContrato, 0)

      const bruto = contratosDelMes
        .reduce((sum, contrato) => {
          // Ingresos brutos incluyen total del contrato más comisiones
          return sum + contrato.totalContrato + (contrato.comision || 0)
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