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
    const period = searchParams.get('period') || 'mes'
    const mes = searchParams.get('mes')
    const year = searchParams.get('year')

    let fechaInicio: Date
    let fechaFin: Date

    // Configurar fechas según el período
    const currentDate = new Date()
    const yearNum = year ? parseInt(year) : currentDate.getFullYear()

    switch (period) {
      case 'mes':
        const mesNum = mes ? parseInt(mes) : currentDate.getMonth()
        fechaInicio = new Date(yearNum, mesNum, 1)
        fechaFin = new Date(yearNum, mesNum + 1, 0, 23, 59, 59, 999)
        break
      case 'año':
        fechaInicio = new Date(yearNum, 0, 1)
        fechaFin = new Date(yearNum, 11, 31, 23, 59, 59, 999)
        break
      case 'trimestre':
        const currentQuarter = Math.floor(currentDate.getMonth() / 3)
        fechaInicio = new Date(yearNum, currentQuarter * 3, 1)
        fechaFin = new Date(yearNum, (currentQuarter + 1) * 3, 0, 23, 59, 59, 999)
        break
      default:
        fechaInicio = new Date(yearNum, currentDate.getMonth(), 1)
        fechaFin = new Date(yearNum, currentDate.getMonth() + 1, 0, 23, 59, 59, 999)
    }

    console.log('Performance query:', { period, fechaInicio, fechaFin })

    // Obtener todos los contratistas
    const contratistas = await prisma.user.findMany({
      where: {
        role: 'CONTRATISTA',
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        contratos: {
          include: {
            cliente: true,
            unidad: {
              include: {
                edificio: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    console.log(`Found ${contratistas.length} contratistas`)

    // Calcular métricas para cada contratista
    const contratistasPerformance = contratistas.map((contratista) => {
      // Filtrar contratos del período actual
      const contratosDelPeriodo = contratista.contratos.filter(
        (contrato) => contrato.createdAt >= fechaInicio && contrato.createdAt <= fechaFin
      )

      // Calcular métricas totales (todos los contratos)
      const totalVentas = contratista.contratos.length
      const totalComisiones = contratista.contratos.reduce(
        (sum, contrato) => sum + (contrato.comision || 0),
        0
      )

      // Métricas del período actual
      const ventasEsteMes = contratosDelPeriodo.length
      const comisionesEsteMes = contratosDelPeriodo.reduce(
        (sum, contrato) => sum + (contrato.comision || 0),
        0
      )

      // Calcular promedio mensual (últimos 12 meses)
      const hace12Meses = new Date()
      hace12Meses.setMonth(hace12Meses.getMonth() - 12)

      const contratosUltimos12Meses = contratista.contratos.filter(
        (contrato) => contrato.createdAt >= hace12Meses
      )
      const promedioVentaMes = contratosUltimos12Meses.length / 12

      // Última venta
      const ultimaVenta = contratista.contratos.length > 0
        ? contratista.contratos[0].createdAt.toISOString()
        : null

      // Tiempo promedio de venta (simulado - en un sistema real se calcularía desde lead a contrato)
      const tiempoPromedioVenta = Math.floor(Math.random() * 30) + 15 // 15-45 días

      // Tasa de conversión (simulada - en un sistema real se calcularía con leads)
      const tasaConversion = ventasEsteMes > 0 ? Math.floor(Math.random() * 50) + 20 : 0

      // Ventas por mes (últimos 6 meses para tendencias)
      const ventasPorMes = []
      for (let i = 5; i >= 0; i--) {
        const mesDate = new Date()
        mesDate.setMonth(mesDate.getMonth() - i)
        const inicioMes = new Date(mesDate.getFullYear(), mesDate.getMonth(), 1)
        const finMes = new Date(mesDate.getFullYear(), mesDate.getMonth() + 1, 0, 23, 59, 59, 999)

        const contratosMes = contratista.contratos.filter(
          (contrato) => contrato.createdAt >= inicioMes && contrato.createdAt <= finMes
        )

        ventasPorMes.push({
          mes: mesDate.toLocaleDateString('es-CL', { month: 'short' }),
          ventas: contratosMes.length,
          comisiones: contratosMes.reduce((sum, contrato) => sum + (contrato.comision || 0), 0),
        })
      }

      return {
        id: contratista.id,
        nombre: contratista.nombre,
        email: contratista.email,
        totalVentas,
        totalComisiones,
        ventasEsteMes,
        comisionesEsteMes,
        promedioVentaMes: Math.round(promedioVentaMes * 10) / 10,
        rankingVentas: 0, // Se calculará después
        rankingComisiones: 0, // Se calculará después
        ventasPorMes,
        ultimaVenta,
        tiempoPromedioVenta,
        tasaConversion,
      }
    })

    // Ordenar por ventas del período y asignar rankings
    const sortedByVentas = [...contratistasPerformance].sort((a, b) => b.ventasEsteMes - a.ventasEsteMes)
    sortedByVentas.forEach((contratista, index) => {
      const original = contratistasPerformance.find(c => c.id === contratista.id)
      if (original) original.rankingVentas = index + 1
    })

    // Ordenar por comisiones del período y asignar rankings
    const sortedByComisiones = [...contratistasPerformance].sort((a, b) => b.comisionesEsteMes - a.comisionesEsteMes)
    sortedByComisiones.forEach((contratista, index) => {
      const original = contratistasPerformance.find(c => c.id === contratista.id)
      if (original) original.rankingComisiones = index + 1
    })

    // Calcular estadísticas generales
    const contratistasActivos = contratistasPerformance.filter(c => c.ventasEsteMes > 0)
    const totalVentasDelPeriodo = contratistasPerformance.reduce((sum, c) => sum + c.ventasEsteMes, 0)
    const totalComisionesDelPeriodo = contratistasPerformance.reduce((sum, c) => sum + c.comisionesEsteMes, 0)
    const mejorVendedor = sortedByVentas[0] || { nombre: 'N/A', ventasEsteMes: 0 }
    const promedioVentasPorContratista = contratistasActivos.length > 0
      ? totalVentasDelPeriodo / contratistasActivos.length
      : 0

    const stats = {
      totalContratistas: contratistasActivos.length,
      totalVentasDelMes: totalVentasDelPeriodo,
      totalComisionesDelMes: totalComisionesDelPeriodo,
      mejorVendedor: {
        nombre: mejorVendedor.nombre,
        ventas: mejorVendedor.ventasEsteMes,
      },
      promedioVentasPorContratista: Math.round(promedioVentasPorContratista * 10) / 10,
    }

    // Ordenar resultado final por ranking de ventas
    const result = sortedByVentas

    console.log('Performance stats:', stats)
    console.log('Top performer:', result[0]?.nombre, 'with', result[0]?.ventasEsteMes, 'sales')

    return NextResponse.json({
      contratistas: result,
      stats,
      period: {
        type: period,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}