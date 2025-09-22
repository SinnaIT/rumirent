import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/edificios/' + id)

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

    const edificio = await prisma.edificio.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            unidades: true
          }
        },
        unidades: {
          select: {
            id: true,
            numero: true,
            estado: true,
            descripcion: true,
            metros2: true,
            tipoUnidadEdificioId: true,
            tipoUnidadEdificio: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
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
        }
      }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Formatear datos con estadísticas calculadas
    const unidadesDisponibles = edificio.unidades.filter(u => u.estado === 'DISPONIBLE').length
    const unidadesVendidas = edificio.unidades.filter(u => u.estado === 'VENDIDA').length
    const unidadesReservadas = edificio.unidades.filter(u => u.estado === 'RESERVADA').length

    // Agrupar unidades por tipo
    const tiposUnidad = edificio.unidades.reduce((acc: Record<string, number>, unidad) => {
      const tipoNombre = unidad.tipoUnidadEdificio?.nombre || 'Sin tipo'
      acc[tipoNombre] = (acc[tipoNombre] || 0) + 1
      return acc
    }, {})

    const edificioFormatted = {
      id: edificio.id,
      nombre: edificio.nombre,
      direccion: edificio.direccion,
      descripcion: edificio.descripcion,
      estado: edificio.estado,
      comision: edificio.comision,
      totalUnidades: edificio._count.unidades,
      unidadesDisponibles,
      unidadesVendidas,
      unidadesReservadas,
      tiposUnidad: Object.entries(tiposUnidad).map(([tipo, cantidad]) => ({
        tipo,
        cantidad
      })),
      unidades: edificio.unidades.map(unidad => ({
        id: unidad.id,
        numero: unidad.numero,
        estado: unidad.estado,
        tipoUnidadEdificioId: unidad.tipoUnidadEdificioId,
        tipoUnidadEdificio: unidad.tipoUnidadEdificio,
        descripcion: unidad.descripcion,
        metros2: unidad.metros2
      })),
      createdAt: edificio.createdAt.toISOString(),
      updatedAt: edificio.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      edificio: edificioFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener edificio:', error)
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
    console.log('🔄 PUT /api/admin/edificios/' + id)

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
    const { nombre, direccion, descripcion, estado, comisionId } = body

    console.log('📝 Datos a actualizar:', { nombre, direccion, descripcion, estado, comisionId })

    // Validaciones básicas
    if (!nombre || !direccion) {
      return NextResponse.json(
        { error: 'Nombre y dirección son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el edificio existe
    const existingEdificio = await prisma.edificio.findUnique({
      where: { id: params.id }
    })

    if (!existingEdificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no hay otro edificio con el mismo nombre (excluyendo el actual)
    const duplicateEdificio = await prisma.edificio.findFirst({
      where: {
        nombre,
        id: { not: params.id }
      }
    })

    if (duplicateEdificio) {
      return NextResponse.json(
        { error: 'Ya existe otro edificio con este nombre' },
        { status: 400 }
      )
    }

    // Si se proporciona comisionId, verificar que existe
    if (comisionId && comisionId !== 'none') {
      const comisionExists = await prisma.comision.findUnique({
        where: { id: comisionId }
      })

      if (!comisionExists) {
        return NextResponse.json(
          { error: 'La comisión especificada no existe' },
          { status: 400 }
        )
      }
    }

    // Actualizar edificio
    const updatedEdificio = await prisma.edificio.update({
      where: { id },
      data: {
        nombre,
        direccion,
        descripcion: descripcion || null,
        estado: estado || 'PLANIFICACION',
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
        }
      }
    })

    console.log('✅ Edificio actualizado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Edificio actualizado exitosamente',
      edificio: updatedEdificio
    })

  } catch (error) {
    console.error('❌ Error al actualizar edificio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
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
    console.log('🗑️ DELETE /api/admin/edificios/' + id)

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

    // Verificar que el edificio existe y obtener información sobre unidades
    const edificio = await prisma.edificio.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            unidades: true
          }
        }
      }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // No permitir eliminar edificios que tienen unidades
    if (edificio._count.unidades > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un edificio que tiene unidades asociadas' },
        { status: 400 }
      )
    }

    // Eliminar edificio
    await prisma.edificio.delete({
      where: { id: params.id }
    })

    console.log('✅ Edificio eliminado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Edificio eliminado exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar edificio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}