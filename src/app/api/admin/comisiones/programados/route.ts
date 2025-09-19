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

    // Obtener todos los cambios programados
    const cambiosProgramados = await prisma.cambioComisionProgramado.findMany({
      include: {
        comision: true,
        edificio: true
      },
      orderBy: [
        { ejecutado: 'asc' },
        { fechaCambio: 'asc' }
      ]
    })

    const cambiosFormatted = cambiosProgramados.map(cambio => ({
      id: cambio.id,
      fechaCambio: cambio.fechaCambio.toISOString(),
      comision: {
        id: cambio.comision.id,
        nombre: cambio.comision.nombre,
        codigo: cambio.comision.codigo,
        porcentaje: cambio.comision.porcentaje,
        activa: cambio.comision.activa
      },
      edificio: {
        id: cambio.edificio.id,
        nombre: cambio.edificio.nombre
      },
      ejecutado: cambio.ejecutado,
      createdAt: cambio.createdAt.toISOString(),
      updatedAt: cambio.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      cambiosProgramados: cambiosFormatted
    })

  } catch (error) {
    console.error('Error al obtener cambios programados:', error)
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
    const { fechaCambio, comisionId, edificioId } = body

    // Validaciones básicas
    if (!fechaCambio || !comisionId || !edificioId) {
      return NextResponse.json(
        { error: 'Fecha de cambio, comisión y edificio son requeridos' },
        { status: 400 }
      )
    }

    const fechaCambioDate = new Date(fechaCambio)
    if (fechaCambioDate <= new Date()) {
      return NextResponse.json(
        { error: 'La fecha de cambio debe ser futura' },
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
        { error: 'No se puede programar una comisión inactiva' },
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

    // Crear nuevo cambio programado
    const newCambioProgramado = await prisma.cambioComisionProgramado.create({
      data: {
        fechaCambio: fechaCambioDate,
        comisionId,
        edificioId
      },
      include: {
        comision: true,
        edificio: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cambio de comisión programado exitosamente',
      cambioProgramado: newCambioProgramado
    }, { status: 201 })

  } catch (error) {
    console.error('Error al programar cambio de comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para ejecutar cambios programados manualmente
export async function PATCH(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Buscar cambios programados que ya deberían ejecutarse
    const cambiosPendientes = await prisma.cambioComisionProgramado.findMany({
      where: {
        ejecutado: false,
        fechaCambio: {
          lte: new Date()
        }
      },
      include: {
        comision: true,
        edificio: true
      }
    })

    let cambiosEjecutados = 0

    for (const cambio of cambiosPendientes) {
      try {
        // Actualizar la comisión del edificio directamente
        await prisma.edificio.update({
          where: { id: cambio.edificioId },
          data: { comisionId: cambio.comisionId }
        })

        // Marcar el cambio como ejecutado
        await prisma.cambioComisionProgramado.update({
          where: { id: cambio.id },
          data: { ejecutado: true }
        })

        cambiosEjecutados++
      } catch (error) {
        console.error(`Error ejecutando cambio ${cambio.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${cambiosEjecutados} cambios de comisión ejecutados`,
      cambiosEjecutados
    })

  } catch (error) {
    console.error('Error al ejecutar cambios programados:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}