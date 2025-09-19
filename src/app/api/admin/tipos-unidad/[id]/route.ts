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

    const tipoUnidad = await prisma.tipoUnidad.findUnique({
      where: { id },
      include: {
        comision: true,
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        },
        unidades: {
          select: {
            id: true,
            numero: true,
            estado: true,
            precio: true
          }
        },
        _count: {
          select: {
            unidades: true
          }
        }
      }
    })

    if (!tipoUnidad) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado' },
        { status: 404 }
      )
    }

    const tipoUnidadFormatted = {
      id: tipoUnidad.id,
      edificioId: tipoUnidad.edificioId,
      comisionId: tipoUnidad.comisionId,
      nombre: tipoUnidad.nombre,
      codigo: tipoUnidad.codigo,
      edificio: tipoUnidad.edificio,
      comision: {
        id: tipoUnidad.comision.id,
        nombre: tipoUnidad.comision.nombre,
        codigo: tipoUnidad.comision.codigo,
        porcentaje: tipoUnidad.comision.porcentaje,
        activa: tipoUnidad.comision.activa
      },
      cantidadUnidades: tipoUnidad._count.unidades,
      unidades: tipoUnidad.unidades,
      createdAt: tipoUnidad.createdAt.toISOString(),
      updatedAt: tipoUnidad.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      tipoUnidad: tipoUnidadFormatted
    })

  } catch (error) {
    console.error('Error al obtener tipo de unidad:', error)
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
    const { comisionId, nombre, codigo } = body

    // Validaciones básicas
    if (!comisionId || !nombre || !codigo) {
      return NextResponse.json(
        { error: 'Comisión, nombre y código son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el tipo de unidad existe
    const existingTipo = await prisma.tipoUnidad.findUnique({
      where: { id }
    })

    if (!existingTipo) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la comisión existe y está activa
    const comision = await prisma.comision.findUnique({
      where: { id: comisionId }
    })

    if (!comision) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      )
    }

    if (!comision.activa) {
      return NextResponse.json(
        { error: 'No se puede asignar una comisión inactiva' },
        { status: 400 }
      )
    }

    // Verificar que no existe otro tipo con el mismo código en el edificio (excepto el actual)
    const conflictingTipo = await prisma.tipoUnidad.findFirst({
      where: {
        edificioId: existingTipo.edificioId,
        codigo,
        id: { not: id }
      }
    })

    if (conflictingTipo) {
      return NextResponse.json(
        { error: 'Ya existe otro tipo de unidad con este código en el edificio' },
        { status: 400 }
      )
    }

    // Actualizar tipo de unidad
    const updatedTipoUnidad = await prisma.tipoUnidad.update({
      where: { id },
      data: {
        comisionId,
        nombre,
        codigo
      },
      include: {
        comision: true,
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipo de unidad actualizado exitosamente',
      tipoUnidad: updatedTipoUnidad
    })

  } catch (error) {
    console.error('Error al actualizar tipo de unidad:', error)
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

    // Verificar que el tipo de unidad existe
    const existingTipo = await prisma.tipoUnidad.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            unidades: true
          }
        }
      }
    })

    if (!existingTipo) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no tiene unidades asociadas
    if (existingTipo._count.unidades > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el tipo de unidad porque tiene unidades asociadas' },
        { status: 400 }
      )
    }

    // Eliminar tipo de unidad
    await prisma.tipoUnidad.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipo de unidad eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar tipo de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}