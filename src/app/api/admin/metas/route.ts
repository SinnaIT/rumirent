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
    const brokerId = searchParams.get('brokerId')
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')

    const where: {
      brokerId?: string
      mes?: number
      anio?: number
    } = {}
    if (brokerId) where.brokerId = brokerId
    if (mes) where.mes = parseInt(mes)
    if (anio) where.anio = parseInt(anio)

    const metas = await prisma.metaMensual.findMany({
      where,
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true,
          },
        },
      },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' },
      ],
    })

    return NextResponse.json(metas)
  } catch (error) {
    console.error('Error fetching metas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { brokerId, mes, anio, montoMeta } = body

    // Validaciones
    if (!mes || !anio || montoMeta === undefined) {
      return NextResponse.json(
        { error: 'Mes, año y monto de meta son requeridos' },
        { status: 400 }
      )
    }

    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: 'El mes debe estar entre 1 y 12' },
        { status: 400 }
      )
    }

    if (montoMeta <= 0) {
      return NextResponse.json(
        { error: 'El monto de la meta debe ser positivo' },
        { status: 400 }
      )
    }

    // Si se especifica un broker, verificar que existe
    if (brokerId) {
      const broker = await prisma.user.findUnique({
        where: { id: brokerId },
      })

      if (!broker) {
        return NextResponse.json(
          { error: 'Broker no encontrado' },
          { status: 404 }
        )
      }

      if (broker.role !== 'BROKER') {
        return NextResponse.json(
          { error: 'El usuario debe tener rol de BROKER' },
          { status: 400 }
        )
      }
    }

    // Crear la meta (general si no hay brokerId, específica si lo hay)
    const meta = await prisma.metaMensual.create({
      data: {
        brokerId: brokerId || null,
        mes: parseInt(mes),
        anio: parseInt(anio),
        montoMeta: parseFloat(montoMeta),
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true,
          },
        },
      },
    })

    return NextResponse.json(meta, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating meta:', error)

    // Manejar error de unique constraint
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una meta para este período' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
