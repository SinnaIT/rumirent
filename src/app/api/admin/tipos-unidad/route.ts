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

    // Los tipos de unidad ahora son un enum, no un modelo
    // Devolver los tipos disponibles del enum
    const tiposUnidadEnum = [
      { valor: 'STUDIO', nombre: 'Studio' },
      { valor: 'UN_DORMITORIO', nombre: '1 Dormitorio' },
      { valor: 'DOS_DORMITORIOS', nombre: '2 Dormitorios' },
      { valor: 'TRES_DORMITORIOS', nombre: '3 Dormitorios' },
      { valor: 'PENTHOUSE', nombre: 'Penthouse' }
    ]

    // Opcional: obtener estadísticas de uso de cada tipo
    const estadisticas = await prisma.unidad.groupBy({
      by: ['tipo'],
      _count: {
        tipo: true
      }
    })

    const tiposConEstadisticas = tiposUnidadEnum.map(tipo => ({
      ...tipo,
      cantidadUnidades: estadisticas.find(est => est.tipo === tipo.valor)?._count.tipo || 0
    }))

    return NextResponse.json({
      success: true,
      tiposUnidad: tiposConEstadisticas
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
    // Los tipos de unidad ahora son un enum, no se pueden crear dinámicamente
    return NextResponse.json(
      { error: 'Los tipos de unidad están predefinidos como enum y no se pueden crear dinámicamente' },
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