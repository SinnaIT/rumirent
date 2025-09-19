import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
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

    // Obtener unidad con sus relaciones
    const unidad = await prisma.unidad.findUnique({
      where: { id },
      include: {
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        },
        tipoUnidad: {
          include: {
            comision: true
          }
        },
        contratos: {
          include: {
            contratista: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!unidad) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      )
    }

    const unidadFormatted = {
      id: unidad.id,
      numero: unidad.numero,
      tipoUnidadId: unidad.tipoUnidadId,
      estado: unidad.estado,
      descripcion: unidad.descripcion,
      metros2: unidad.metros2,
      edificioId: unidad.edificioId,
      edificio: unidad.edificio,
      tipoUnidad: {
        id: unidad.tipoUnidad.id,
        nombre: unidad.tipoUnidad.nombre,
        codigo: unidad.tipoUnidad.codigo,
        comision: {
          id: unidad.tipoUnidad.comision.id,
          nombre: unidad.tipoUnidad.comision.nombre,
          codigo: unidad.tipoUnidad.comision.codigo,
          porcentaje: unidad.tipoUnidad.comision.porcentaje,
          activa: unidad.tipoUnidad.comision.activa
        }
      },
      contratos: unidad.contratos,
      createdAt: unidad.createdAt.toISOString(),
      updatedAt: unidad.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      unidad: unidadFormatted
    })

  } catch (error) {
    console.error('Error al obtener unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const body = await request.json()
    const { numero, tipoUnidadId, estado, descripcion, metros2 } = body

    // Validaciones básicas
    if (!numero || !tipoUnidadId) {
      return NextResponse.json(
        { error: 'Número y tipo de unidad son requeridos' },
        { status: 400 }
      )
    }

    if (metros2 && metros2 <= 0) {
      return NextResponse.json(
        { error: 'Los metros cuadrados deben ser mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar si la unidad existe
    const existingUnidad = await prisma.unidad.findUnique({
      where: { id }
    })

    if (!existingUnidad) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el tipo de unidad existe y pertenece al mismo edificio
    const tipoUnidad = await prisma.tipoUnidad.findUnique({
      where: { id: tipoUnidadId }
    })

    if (!tipoUnidad) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado' },
        { status: 404 }
      )
    }

    if (tipoUnidad.edificioId !== existingUnidad.edificioId) {
      return NextResponse.json(
        { error: 'El tipo de unidad no pertenece al mismo edificio' },
        { status: 400 }
      )
    }

    // Verificar si ya existe otra unidad con el mismo número en el edificio
    const duplicateUnidad = await prisma.unidad.findFirst({
      where: {
        edificioId: existingUnidad.edificioId,
        numero,
        id: { not: id }
      }
    })

    if (duplicateUnidad) {
      return NextResponse.json(
        { error: 'Ya existe otra unidad con este número en el edificio' },
        { status: 400 }
      )
    }

    // Actualizar unidad
    const updatedUnidad = await prisma.unidad.update({
      where: { id },
      data: {
        numero,
        tipoUnidadId,
        estado: estado || 'DISPONIBLE',
        descripcion: descripcion || undefined,
        metros2: metros2 || undefined
      },
      include: {
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        },
        tipoUnidad: {
          include: {
            comision: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Unidad actualizada exitosamente',
      unidad: updatedUnidad
    })

  } catch (error) {
    console.error('Error al actualizar unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

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

    // Verificar si la unidad existe
    const existingUnidad = await prisma.unidad.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            contratos: true
          }
        }
      }
    })

    if (!existingUnidad) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si la unidad tiene contratos asociados
    if (existingUnidad._count.contratos > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una unidad que tiene contratos asociados' },
        { status: 400 }
      )
    }

    // Eliminar unidad
    await prisma.unidad.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Unidad eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}