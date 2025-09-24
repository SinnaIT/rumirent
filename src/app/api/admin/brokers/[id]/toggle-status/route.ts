import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verificar que el broker existe
    const existingbroker = await prisma.user.findUnique({
      where: {
        id,
        role: 'BROKER'
      }
    })

    if (!existingbroker) {
      return NextResponse.json(
        { error: 'broker no encontrado' },
        { status: 404 }
      )
    }

    // Cambiar el estado activo
    const updatedbroker = await prisma.user.update({
      where: { id },
      data: {
        activo: !existingbroker.activo
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        activo: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `broker ${updatedbroker.activo ? 'activado' : 'desactivado'} exitosamente`,
      broker: updatedbroker
    })

  } catch (error) {
    console.error('Error al cambiar estado del broker:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}