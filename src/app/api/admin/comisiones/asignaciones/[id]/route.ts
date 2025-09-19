import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar si la asignación existe
    const existingAsignacion = await prisma.asignacionComision.findUnique({
      where: { id },
      include: {
        comision: true,
        edificio: true
      }
    })

    if (!existingAsignacion) {
      return NextResponse.json(
        { error: 'Asignación no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar asignación
    await prisma.asignacionComision.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar asignación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}