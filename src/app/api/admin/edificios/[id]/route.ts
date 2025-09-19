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

    // Obtener edificio con sus unidades
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
            tipo: true,
            precio: true,
            estado: true,
            prioridad: true,
            descripcion: true,
            metros2: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: {
            numero: 'asc'
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

    // Calcular estadísticas
    const unidadesDisponibles = edificio.unidades.filter(u => u.estado === 'DISPONIBLE').length
    const unidadesVendidas = edificio.unidades.filter(u => u.estado === 'VENDIDA').length
    const unidadesReservadas = edificio.unidades.filter(u => u.estado === 'RESERVADA').length

    // Agrupar unidades por tipo
    const tiposUnidad = edificio.unidades.reduce((acc: Record<string, number>, unidad) => {
      acc[unidad.tipo] = (acc[unidad.tipo] || 0) + 1
      return acc
    }, {})

    const edificioFormatted = {
      id: edificio.id,
      nombre: edificio.nombre,
      direccion: edificio.direccion,
      descripcion: edificio.descripcion,
      estado: edificio.estado,
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
        tipo: unidad.tipo,
        precio: unidad.precio,
        estado: unidad.estado,
        prioridad: unidad.prioridad,
        descripcion: unidad.descripcion,
        metros2: unidad.metros2,
        createdAt: unidad.createdAt.toISOString(),
        updatedAt: unidad.updatedAt.toISOString()
      })),
      createdAt: edificio.createdAt.toISOString(),
      updatedAt: edificio.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      edificio: edificioFormatted
    })

  } catch (error) {
    console.error('Error al obtener edificio:', error)
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
    const { nombre, direccion, descripcion, estado } = body

    // Validaciones básicas
    if (!nombre || !direccion) {
      return NextResponse.json(
        { error: 'Nombre y dirección son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el edificio existe
    const existingEdificio = await prisma.edificio.findUnique({
      where: { id }
    })

    if (!existingEdificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe otro edificio con el mismo nombre
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

    // Actualizar edificio
    const updatedEdificio = await prisma.edificio.update({
      where: { id },
      data: {
        nombre,
        direccion,
        descripcion: descripcion || undefined,
        estado: estado || 'PLANIFICACION'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Edificio actualizado exitosamente',
      edificio: updatedEdificio
    })

  } catch (error) {
    console.error('Error al actualizar edificio:', error)
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

    // Verificar si el edificio existe
    const existingEdificio = await prisma.edificio.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            unidades: true
          }
        }
      }
    })

    if (!existingEdificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el edificio tiene unidades
    if (existingEdificio._count.unidades > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un edificio que tiene unidades asociadas' },
        { status: 400 }
      )
    }

    // Eliminar edificio
    await prisma.edificio.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Edificio eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar edificio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}