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

    console.log('Buscando leads pendientes:', {
      fechaInicio,
      fechaFin,
      mes: mesNum,
      year: yearNum
    })

    // Buscar leads del período que NO estén conciliados
    const leads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        conciliado: false, // Solo leads no conciliados
      },
      include: {
        cliente: {
          select: {
            nombre: true,
          },
        },
        broker: {
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

    console.log(`Encontrados ${leads.length} leads pendientes`)

    // Formatear datos para el frontend
    const leadsPendientes = leads.map((lead) => ({
      id: lead.id,
      fechaLead: lead.createdAt.toISOString(),
      totalLead: lead.totalLead,
      edificioNombre: lead.edificio.nombre,
      unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
      clienteNombre: lead.cliente.nombre,
      brokerNombre: lead.broker.nombre,
      comision: lead.comision || 0,
      conciliado: lead.conciliado,
    }))

    return NextResponse.json({
      leads: leadsPendientes,
      count: leadsPendientes.length,
      period: {
        mes: mesNum,
        year: yearNum,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching leads pendientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}