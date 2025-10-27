import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const meta = await prisma.metaMensual.findUnique({
      where: { id },
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

    if (!meta) {
      return NextResponse.json(
        { error: 'Meta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(meta)
  } catch (error) {
    console.error('Error fetching meta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { brokerId, mes, anio, montoMeta } = body

    // Verificar que la meta existe
    const metaExistente = await prisma.metaMensual.findUnique({
      where: { id },
    })

    if (!metaExistente) {
      return NextResponse.json(
        { error: 'Meta no encontrada' },
        { status: 404 }
      )
    }

    // Validaciones
    if (mes && (mes < 1 || mes > 12)) {
      return NextResponse.json(
        { error: 'El mes debe estar entre 1 y 12' },
        { status: 400 }
      )
    }

    if (montoMeta !== undefined && montoMeta <= 0) {
      return NextResponse.json(
        { error: 'El monto de la meta debe ser positivo' },
        { status: 400 }
      )
    }

    // Si se especifica un broker, verificar que existe
    if (brokerId && brokerId !== metaExistente.brokerId) {
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

    // Actualizar la meta
    const dataToUpdate: any = {}
    if (brokerId !== undefined) dataToUpdate.brokerId = brokerId || null
    if (mes) dataToUpdate.mes = parseInt(mes)
    if (anio) dataToUpdate.anio = parseInt(anio)
    if (montoMeta !== undefined) dataToUpdate.montoMeta = parseFloat(montoMeta)

    const meta = await prisma.metaMensual.update({
      where: { id },
      data: dataToUpdate,
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

    return NextResponse.json(meta)
  } catch (error: any) {
    console.error('Error updating meta:', error)

    // Manejar error de unique constraint
    if (error.code === 'P2002') {
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que la meta existe
    const meta = await prisma.metaMensual.findUnique({
      where: { id },
    })

    if (!meta) {
      return NextResponse.json(
        { error: 'Meta no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar la meta
    await prisma.metaMensual.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Meta eliminada exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting meta:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
