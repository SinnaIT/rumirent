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
        tipoUnidadEdificio: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            comision: {
              select: {
                id: true,
                nombre: true,
                porcentaje: true
              }
            }
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
      tipoUnidadEdificioId: unidad.tipoUnidadEdificioId,
      estado: unidad.estado,
      descripcion: unidad.descripcion,
      metros2: unidad.metros2,
      edificioId: unidad.edificioId,
      edificio: unidad.edificio,
      tipoUnidadEdificio: unidad.tipoUnidadEdificio,
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

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { numero, tipoUnidadEdificioId, estado, descripcion, metros2, edificioId } = body

    console.log('📝 Datos a actualizar:', { numero, tipoUnidadEdificioId, estado, descripcion, metros2, edificioId })

    // Validaciones básicas
    if (!numero || !tipoUnidadEdificioId) {
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

    // Verificar que el tipo de unidad existe y pertenece al edificio
    const tipoUnidadEdificio = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        id: tipoUnidadEdificioId,
        edificioId: edificioId || existingUnidad.edificioId
      }
    })

    if (!tipoUnidadEdificio) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado o no pertenece a este edificio' },
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
    console.log('🔄 Actualizando unidad con ID:', id)
    console.log('📊 Datos de actualización:', {
      numero,
      tipoUnidadEdificioId,
      estado: estado || 'DISPONIBLE',
      descripcion: descripcion || undefined,
      metros2: metros2 || undefined
    })

    const updatedUnidad = await prisma.unidad.update({
      where: { id },
      data: {
        numero,
        tipoUnidadEdificioId,
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
        tipoUnidadEdificio: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            comision: {
              select: {
                id: true,
                nombre: true,
                porcentaje: true
              }
            }
          }
        }
      }
    })

    console.log('✅ Unidad actualizada exitosamente')
    console.log('📋 Unidad actualizada:', {
      id: updatedUnidad.id,
      numero: updatedUnidad.numero,
      tipoUnidadEdificioId: updatedUnidad.tipoUnidadEdificioId,
      estado: updatedUnidad.estado,
      tipoUnidadEdificio: updatedUnidad.tipoUnidadEdificio
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