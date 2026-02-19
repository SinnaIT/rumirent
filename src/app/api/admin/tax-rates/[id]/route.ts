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

    const taxRate = await prisma.taxRate.findUnique({
      where: { id },
      include: {
        taxType: {
          select: { id: true, name: true, nature: true },
        },
      },
    })

    if (!taxRate) {
      return NextResponse.json({ error: 'Tasa de impuesto no encontrada' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: taxRate })
  } catch (error) {
    console.error('Error fetching tax rate:', error)
    return NextResponse.json({ error: 'Error al obtener tasa de impuesto' }, { status: 500 })
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
    const { taxTypeId, rate, validFrom, active } = body

    const existing = await prisma.taxRate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tasa de impuesto no encontrada' }, { status: 404 })
    }

    if (rate !== undefined && (typeof rate !== 'number' || rate < 0 || rate > 1)) {
      return NextResponse.json(
        { error: 'La tasa debe ser un número entre 0 y 1 (ej: 0.19 para 19%)' },
        { status: 400 }
      )
    }

    if (taxTypeId) {
      const taxTypeExists = await prisma.taxType.findUnique({ where: { id: taxTypeId } })
      if (!taxTypeExists) {
        return NextResponse.json({ error: 'Tipo de impuesto no encontrado' }, { status: 404 })
      }
    }

    const updated = await prisma.taxRate.update({
      where: { id },
      data: {
        ...(taxTypeId !== undefined && { taxTypeId }),
        ...(rate !== undefined && { rate }),
        ...(validFrom !== undefined && { validFrom: new Date(validFrom) }),
        ...(active !== undefined && { active }),
      },
      include: {
        taxType: {
          select: { id: true, name: true, nature: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating tax rate:', error)
    return NextResponse.json({ error: 'Error al actualizar tasa de impuesto' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params

    const existing = await prisma.taxRate.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Tasa de impuesto no encontrada' }, { status: 404 })
    }

    await prisma.taxRate.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Tasa de impuesto eliminada' })
  } catch (error) {
    console.error('Error deleting tax rate:', error)
    return NextResponse.json({ error: 'Error al eliminar tasa de impuesto' }, { status: 500 })
  }
}
