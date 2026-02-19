import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const taxTypes = await prisma.taxType.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        taxRates: {
          orderBy: { validFrom: 'desc' },
        },
        _count: {
          select: { brokers: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: taxTypes })
  } catch (error) {
    console.error('Error fetching tax types:', error)
    return NextResponse.json({ error: 'Error al obtener tipos de impuesto' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, nature, active } = body

    if (!name || !nature) {
      return NextResponse.json(
        { error: 'Nombre y naturaleza son requeridos' },
        { status: 400 }
      )
    }

    if (!['ADDITIVE', 'DEDUCTIVE'].includes(nature)) {
      return NextResponse.json(
        { error: 'Naturaleza inválida. Use ADDITIVE o DEDUCTIVE' },
        { status: 400 }
      )
    }

    const existing = await prisma.taxType.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un tipo de impuesto con ese nombre' },
        { status: 409 }
      )
    }

    const taxType = await prisma.taxType.create({
      data: {
        name,
        nature,
        active: active ?? true,
      },
    })

    return NextResponse.json({ success: true, data: taxType }, { status: 201 })
  } catch (error) {
    console.error('Error creating tax type:', error)
    return NextResponse.json({ error: 'Error al crear tipo de impuesto' }, { status: 500 })
  }
}
