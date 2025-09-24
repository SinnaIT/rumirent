import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener todos los edificios con sus comisiones asignadas
    const edificios = await prisma.edificio.findMany({
      include: {
        comision: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    const asignacionesFormatted = edificios.map(edificio => ({
      id: edificio.id,
      edificio: {
        id: edificio.id,
        nombre: edificio.nombre,
        direccion: edificio.direccion
      },
      comision: edificio.comision ? {
        id: edificio.comision.id,
        nombre: edificio.comision.nombre,
        codigo: edificio.comision.codigo,
        porcentaje: edificio.comision.porcentaje,
        activa: edificio.comision.activa
      } : null,
      createdAt: edificio.createdAt.toISOString(),
      updatedAt: edificio.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      asignaciones: asignacionesFormatted
    })

  } catch (error) {
    console.error('Error al obtener asignaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { comisionId, edificioId } = body

    // Validaciones básicas
    if (!comisionId || !edificioId) {
      return NextResponse.json(
        { error: 'Comisión y edificio son requeridos' },
        { status: 400 }
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

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id: edificioId }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el edificio con la nueva comisión
    const updatedEdificio = await prisma.edificio.update({
      where: { id: edificioId },
      data: { comisionId },
      include: {
        comision: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comisión asignada al proyecto exitosamente',
      edificio: updatedEdificio
    }, { status: 200 })

  } catch (error) {
    console.error('Error al asignar comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}