import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'CONTRATISTA') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')

    if (!year) {
      return NextResponse.json({ error: 'Año es requerido' }, { status: 400 })
    }

    const yearNum = parseInt(year)

    // Crear fechas de inicio y fin del año
    const fechaInicio = new Date(yearNum, 0, 1)
    const fechaFin = new Date(yearNum, 11, 31, 23, 59, 59, 999)

    // Buscar todos los contratos del contratista en el año
    const contratos = await prisma.contrato.findMany({
      where: {
        contratistaId: authResult.user.id,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        unidad: {
          include: {
            tipoUnidadEdificio: {
              include: {
                comision: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Agrupar por mes y calcular resumen
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    const resumenPorMes = meses.map((nombreMes, index) => {
      // Filtrar contratos del mes actual
      const contratosMes = contratos.filter(contrato => {
        const mesContrato = contrato.createdAt.getMonth()
        return mesContrato === index
      })

      // Calcular totales para el mes
      let totalComisiones = 0
      let cantidadVentas = contratosMes.length

      contratosMes.forEach(contrato => {
        // Usar el campo comision que ya está calculado en la BD
        const montoComision = contrato.comision || 0
        totalComisiones += montoComision
      })

      const promedioComision = cantidadVentas > 0 ? totalComisiones / cantidadVentas : 0

      return {
        mes: nombreMes,
        totalComisiones,
        cantidadVentas,
        promedioComision,
      }
    })

    // Filtrar solo meses con ventas para mostrar datos relevantes
    const resumenConDatos = resumenPorMes.filter(mes => mes.cantidadVentas > 0)

    return NextResponse.json(resumenConDatos)
  } catch (error) {
    console.error('Error fetching resumen anual:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}