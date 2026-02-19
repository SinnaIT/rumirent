import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const taxTypeId = searchParams.get('taxTypeId')

    const taxRates = await prisma.taxRate.findMany({
      where: taxTypeId ? { taxTypeId } : undefined,
      orderBy: { validFrom: 'desc' },
      include: {
        taxType: {
          select: { id: true, name: true, nature: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: taxRates })
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json({ error: 'Error al obtener tasas de impuesto' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request)
  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { taxTypeId, rate, validFrom, active } = body

    if (!taxTypeId || rate === undefined || rate === null || !validFrom) {
      return NextResponse.json(
        { error: 'Tipo de impuesto, tasa y fecha de validez son requeridos' },
        { status: 400 }
      )
    }

    if (typeof rate !== 'number' || rate < 0 || rate > 1) {
      return NextResponse.json(
        { error: 'La tasa debe ser un número entre 0 y 1 (ej: 0.19 para 19%)' },
        { status: 400 }
      )
    }

    const taxTypeExists = await prisma.taxType.findUnique({ where: { id: taxTypeId } })
    if (!taxTypeExists) {
      return NextResponse.json({ error: 'Tipo de impuesto no encontrado' }, { status: 404 })
    }

    const taxRate = await prisma.taxRate.create({
      data: {
        taxTypeId,
        rate,
        validFrom: new Date(validFrom),
        active: active ?? true,
      },
      include: {
        taxType: {
          select: { id: true, name: true, nature: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: taxRate }, { status: 201 })
  } catch (error) {
    console.error('Error creating tax rate:', error)
    return NextResponse.json({ error: 'Error al crear tasa de impuesto' }, { status: 500 })
  }
}
