import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/tipos-unidad')
    // Obtener todos los tipos de unidad activos con su edificio asociado
    const tiposUnidad = await prisma.tipoUnidadEdificio.findMany({
      where: {
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        edificioId: true,
        bedrooms: true,
        bathrooms: true,
        descripcion: true,
        activo: true,
        _count: {
          select: {
            unidades: true
          }
        }
      },
      orderBy: [
        {
          edificioId: 'asc'
        },
        {
          nombre: 'asc'
        }
      ]
    })

    return NextResponse.json({
      success: true,
      tiposUnidad
    })

  } catch (error) {
    console.error('❌ Error al obtener tipos de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Los tipos de unidad de edificio se crean específicamente por edificio
    // Usa el endpoint /api/admin/edificios/[id]/tipos-unidad para crear tipos específicos por edificio
    return NextResponse.json(
      { error: 'Los tipos de unidad se crean específicamente por edificio. Use /api/admin/edificios/[id]/tipos-unidad' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error en POST tipos de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}