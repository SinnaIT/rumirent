import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const taxType = await prisma.taxType.findUnique({
      where: { id },
      include: {
        taxRates: {
          orderBy: { validFrom: 'desc' },
        },
        _count: {
          select: { brokers: true },
        },
      },
    })

    if (!taxType) {
      return NextResponse.json({ error: 'Tipo de impuesto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: taxType })
  } catch (error) {
    console.error('Error fetching tax type:', error)
    return NextResponse.json({ error: 'Error al obtener tipo de impuesto' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { name, nature, active } = body

    const existing = await prisma.taxType.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tipo de impuesto no encontrado' }, { status: 404 })
    }

    if (nature && !['ADDITIVE', 'DEDUCTIVE'].includes(nature)) {
      return NextResponse.json(
        { error: 'Naturaleza inválida. Use ADDITIVE o DEDUCTIVE' },
        { status: 400 }
      )
    }

    if (name && name !== existing.name) {
      const nameConflict = await prisma.taxType.findUnique({ where: { name } })
      if (nameConflict) {
        return NextResponse.json(
          { error: 'Ya existe un tipo de impuesto con ese nombre' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.taxType.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(nature !== undefined && { nature }),
        ...(active !== undefined && { active }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating tax type:', error)
    return NextResponse.json({ error: 'Error al actualizar tipo de impuesto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const existing = await prisma.taxType.findUnique({
      where: { id },
      include: { _count: { select: { brokers: true } } },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Tipo de impuesto no encontrado' }, { status: 404 })
    }

    if (existing._count.brokers > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Hay ${existing._count.brokers} broker(s) asignados a este tipo de impuesto.`,
        },
        { status: 409 }
      )
    }

    await prisma.taxType.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Tipo de impuesto eliminado' })
  } catch (error) {
    console.error('Error deleting tax type:', error)
    return NextResponse.json({ error: 'Error al eliminar tipo de impuesto' }, { status: 500 })
  }
}
