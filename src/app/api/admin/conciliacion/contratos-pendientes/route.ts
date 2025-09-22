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

    console.log('Buscando contratos pendientes:', {
      fechaInicio,
      fechaFin,
      mes: mesNum,
      year: yearNum
    })

    // Buscar contratos del período que NO estén conciliados
    const contratos = await prisma.contrato.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        conciliado: false, // Solo contratos no conciliados
      },
      include: {
        cliente: {
          select: {
            nombre: true,
          },
        },
        contratista: {
          select: {
            nombre: true,
          },
        },
        edificio: {
          select: {
            nombre: true,
          },
        },
        unidad: {
          select: {
            numero: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Encontrados ${contratos.length} contratos pendientes`)

    // Formatear datos para el frontend
    const contratosPendientes = contratos.map((contrato) => ({
      id: contrato.id,
      fechaContrato: contrato.createdAt.toISOString(),
      totalContrato: contrato.totalContrato,
      edificioNombre: contrato.edificio.nombre,
      unidadCodigo: contrato.unidad?.numero || contrato.codigoUnidad || 'Sin código',
      clienteNombre: contrato.cliente.nombre,
      contratistaNombre: contrato.contratista.nombre,
      comision: contrato.comision || 0,
      conciliado: contrato.conciliado,
    }))

    return NextResponse.json({
      contratos: contratosPendientes,
      count: contratosPendientes.length,
      period: {
        mes: mesNum,
        year: yearNum,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching contratos pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}