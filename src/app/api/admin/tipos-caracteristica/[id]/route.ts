import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tipoCaracteristica = await prisma.tipoCaracteristica.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { caracteristicas: true }
        }
      }
    })

    if (!tipoCaracteristica) {
      return NextResponse.json(
        { error: 'Tipo de característica no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tipoCaracteristica
    })

  } catch (error) {
    console.error('Error al obtener tipo de característica:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { nombre, descripcion, activo } = body

    // Verificar que existe
    const existing = await prisma.tipoCaracteristica.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Tipo de característica no encontrado' },
        { status: 404 }
      )
    }

    // Verificar nombre único si cambió
    if (nombre && nombre !== existing.nombre) {
      const duplicado = await prisma.tipoCaracteristica.findUnique({
        where: { nombre }
      })

      if (duplicado) {
        return NextResponse.json(
          { error: 'Ya existe un tipo de característica con este nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar
    const tipoCaracteristica = await prisma.tipoCaracteristica.update({
      where: { id: params.id },
      data: {
        nombre: nombre || existing.nombre,
        descripcion: descripcion !== undefined ? descripcion : existing.descripcion,
        activo: activo !== undefined ? activo : existing.activo
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipo de característica actualizado exitosamente',
      tipoCaracteristica
    })

  } catch (error) {
    console.error('Error al actualizar tipo de característica:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticación
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    // Verificar si tiene características asociadas
    const count = await prisma.caracteristicaEdificio.count({
      where: { tipoCaracteristicaId: params.id }
    })

    if (count > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Hay ${count} característica(s) usando este tipo`,
          count
        },
        { status: 400 }
      )
    }

    // Eliminar
    await prisma.tipoCaracteristica.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipo de característica eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar tipo de característica:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
