import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
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

    // Verificar que el usuario existe y es admin
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN'
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario admin no encontrado' },
        { status: 404 }
      )
    }

    // Prevenir que un admin se desactive a sí mismo
    if (existingUser.id === authResult.user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar el estado de tu propio usuario' },
        { status: 400 }
      )
    }

    // Si se está desactivando, verificar que no sea el último admin activo
    if (existingUser.activo) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: 'ADMIN',
          activo: true
        }
      })

      if (activeAdminCount <= 1) {
        return NextResponse.json(
          { error: 'No se puede desactivar el último usuario administrador activo' },
          { status: 400 }
        )
      }
    }

    // Cambiar estado
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        activo: !existingUser.activo,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Usuario ${updatedUser.activo ? 'activado' : 'desactivado'} exitosamente`,
      usuario: updatedUser
    })

  } catch (error) {
    console.error('Error al cambiar estado del usuario admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}