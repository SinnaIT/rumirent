import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const caracteristicas = await prisma.caracteristicaEdificio.findMany({
      where: { edificioId: id },
      include: {
        tipoCaracteristica: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      caracteristicas
    })

  } catch (error) {
    console.error('Error al obtener características:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const {
      tipoCaracteristicaId,
      nombre,
      valor,
      mostrarEnResumen,
      icono,
      tipoIcono
    } = body

    // Validaciones
    if (!tipoCaracteristicaId || !nombre || !valor) {
      return NextResponse.json(
        { error: 'Tipo, nombre y valor son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el tipo de característica existe
    const tipoCaracteristica = await prisma.tipoCaracteristica.findUnique({
      where: { id: tipoCaracteristicaId }
    })

    if (!tipoCaracteristica) {
      return NextResponse.json(
        { error: 'Tipo de característica no encontrado' },
        { status: 404 }
      )
    }

    // Crear característica
    const caracteristica = await prisma.caracteristicaEdificio.create({
      data: {
        edificioId: id,
        tipoCaracteristicaId,
        nombre,
        valor,
        mostrarEnResumen: mostrarEnResumen !== undefined ? mostrarEnResumen : true,
        icono: icono || null,
        tipoIcono: tipoIcono || 'LUCIDE'
      },
      include: {
        tipoCaracteristica: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Característica agregada exitosamente',
      caracteristica
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear característica:', error)
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
    const { caracteristicaId, ...updateData } = body

    if (!caracteristicaId) {
      return NextResponse.json(
        { error: 'ID de característica requerido' },
        { status: 400 }
      )
    }

    // Actualizar característica
    const caracteristica = await prisma.caracteristicaEdificio.update({
      where: { id: caracteristicaId },
      data: updateData,
      include: {
        tipoCaracteristica: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Característica actualizada exitosamente',
      caracteristica
    })

  } catch (error) {
    console.error('Error al actualizar característica:', error)
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

    const { searchParams } = new URL(request.url)
    const caracteristicaId = searchParams.get('caracteristicaId')

    if (!caracteristicaId) {
      return NextResponse.json(
        { error: 'ID de característica requerido' },
        { status: 400 }
      )
    }

    // Eliminar característica
    await prisma.caracteristicaEdificio.delete({
      where: { id: caracteristicaId }
    })

    return NextResponse.json({
      success: true,
      message: 'Característica eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar característica:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
