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

    const edificio = await prisma.edificio.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            unidades: true,
            tiposUnidad: true
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
            leads: {
              select: {
                estado: true
              }
            },
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
        },
        empresa: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            razonSocial: true,
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
    const ESTADOS_ARRENDADA = ['DEPARTAMENTO_ENTREGADO']
    const unidadesVendidas = edificio.unidades.filter(u =>
      (u.leads && ESTADOS_ARRENDADA.includes(u.leads.estado))
    ).length
    const unidadesReservadas = edificio.unidades.filter(u =>
      u.estado === 'RESERVADA'
    ).length
    const unidadesDisponibles = edificio.unidades.length - unidadesReservadas

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
      comuna: edificio.comuna,
      ciudad: edificio.ciudad,
      region: edificio.region,
      codigoPostal: edificio.codigoPostal,
      urlGoogleMaps: edificio.urlGoogleMaps,
      telefono: edificio.telefono,
      email: edificio.email,
      descripcion: edificio.descripcion,
      comision: edificio.comision,
      empresa: edificio.empresa,
      totalUnidades: edificio._count.unidades,
      totalTiposUnidad: edificio._count.tiposUnidad,
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
    const body = await request.json()
    const {
      nombre,
      direccion,
      comuna,
      ciudad,
      region,
      codigoPostal,
      urlGoogleMaps,
      telefono,
      email,
      descripcion,
      comisionId,
      empresaId
    } = body

    console.log('📝 Datos a actualizar:', { nombre, direccion, comuna, ciudad, region, codigoPostal, urlGoogleMaps, telefono, email, descripcion, comisionId, empresaId })

    // Validaciones básicas
    if (!nombre || !direccion || !comuna || !ciudad || !region) {
      return NextResponse.json(
        { error: 'Nombre, dirección, comuna, ciudad y región son requeridos' },
        { status: 400 }
      )
    }

    if (empresaId && empresaId !== 'none') {
      const empresaExists = await prisma.empresa.findUnique({
        where: { id: empresaId }
      })

      if (!empresaExists) {
        return NextResponse.json(
          { error: 'La empresa especificada no existe' },
          { status: 400 }
        )
      }
    }

    // Verificar que el edificio existe
    const existingEdificio = await prisma.edificio.findUnique({
      where: { id }
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
        id: { not: id }
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
    const updateData: any = {
      nombre,
      direccion,
      comuna,
      ciudad,
      region,
      codigoPostal: codigoPostal || null,
      urlGoogleMaps: urlGoogleMaps || null,
      telefono: telefono || null,
      email: email || null,
      descripcion: descripcion || null
    }

    // Manejar la relación de comisión
    if (comisionId && comisionId !== 'none') {
      updateData.comision = {
        connect: { id: comisionId }
      }
    }

    // Manejar la relación de empresa
    if (empresaId && empresaId !== 'none') {
      updateData.empresa = {
        connect: { id: empresaId }
      }
    }

    const updatedEdificio = await prisma.edificio.update({
      where: { id },
      data: updateData,
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
        empresa: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            razonSocial: true,
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
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' },
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
      where: { id }
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