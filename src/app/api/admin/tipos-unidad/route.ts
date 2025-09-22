import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener todos los tipos de unidad de edificio con estadísticas
    const tiposUnidadEdificio = await prisma.tipoUnidadEdificio.findMany({
      include: {
        edificio: {
          select: {
            id: true,
            nombre: true
          }
        },
        comision: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true,
            activa: true
          }
        },
        _count: {
          select: {
            unidades: true
          }
        }
      },
      orderBy: [
        { edificio: { nombre: 'asc' } },
        { nombre: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      tiposUnidad: tiposUnidadEdificio
    })

  } catch (error) {
    console.error('Error al obtener tipos de unidad:', error)
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