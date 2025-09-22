import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tipoId: string }> }
) {
  try {
    const { id, tipoId } = await params
    console.log('🔍 GET /api/admin/edificios/' + id + '/tipos-unidad/' + tipoId)

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

    const tipoUnidad = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        id: tipoId,
        edificioId: id
      },
      include: {
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
      }
    })

    if (!tipoUnidad) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      tipoUnidad
    })

  } catch (error) {
    console.error('❌ Error al obtener tipo de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tipoId: string }> }
) {
  try {
    const { id, tipoId } = await params
    console.log('🔄 PUT /api/admin/edificios/' + id + '/tipos-unidad/' + tipoId)

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
    const { nombre, codigo, comisionId } = body

    console.log('📝 Datos a actualizar:', { nombre, codigo, comisionId })
    console.log('📝 Comisión procesada para actualización:', comisionId === 'none' || !comisionId ? null : comisionId)

    // Validaciones básicas
    if (!nombre || !codigo) {
      return NextResponse.json(
        { error: 'Nombre y código son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el tipo de unidad existe y pertenece al edificio
    const existingTipoUnidad = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        id: tipoId,
        edificioId: id
      }
    })

    if (!existingTipoUnidad) {
      return NextResponse.json(
        { error: 'Tipo de unidad no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la comisión existe (si se proporciona)
    if (comisionId && comisionId !== 'none') {
      const comision = await prisma.comision.findUnique({
        where: { id: comisionId }
      })

      if (!comision) {
        return NextResponse.json(
          { error: 'La comisión especificada no existe' },
          { status: 400 }
        )
      }
    }

    // Verificar que no hay otro tipo de unidad con el mismo código en este edificio (excluyendo el actual)
    const duplicateTipoUnidad = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        edificioId: id,
        codigo,
        id: { not: tipoId }
      }
    })

    if (duplicateTipoUnidad) {
      return NextResponse.json(
        { error: 'Ya existe otro tipo de unidad con este código en este edificio' },
        { status: 400 }
      )
    }

    // Actualizar tipo de unidad
    const updatedTipoUnidad = await prisma.tipoUnidadEdificio.update({
      where: { id: tipoId },
      data: {
        nombre,
        codigo,
        comisionId: comisionId === 'none' || !comisionId ? null : comisionId
      },
      include: {
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
      }
    })

    console.log('✅ Tipo de unidad actualizado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Tipo de unidad actualizado exitosamente',
      tipoUnidad: updatedTipoUnidad
    })

  } catch (error) {
    console.error('❌ Error al actualizar tipo de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tipoId: string }> }
) {
  try {
    const { id, tipoId } = await params
    console.log('🗑️ DELETE /api/admin/edificios/' + id + '/tipos-unidad/' + tipoId)

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

    // Verificar que el tipo de unidad existe y pertenece al edificio
    const tipoUnidad = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        id: tipoId,
        edificioId: id
      },
      include: {
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

    // No permitir eliminar tipos de unidad que tienen unidades asociadas
    if (tipoUnidad._count.unidades > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un tipo de unidad que tiene unidades asociadas' },
        { status: 400 }
      )
    }

    // Eliminar tipo de unidad
    await prisma.tipoUnidadEdificio.delete({
      where: { id: tipoId }
    })

    console.log('✅ Tipo de unidad eliminado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Tipo de unidad eliminado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar tipo de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}