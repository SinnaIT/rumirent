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

    // Obtener comisión con sus asignaciones
    const comision = await prisma.comision.findUnique({
      where: { id },
      include: {
        tiposUnidad: {
          include: {
            edificio: true
          }
        },
        cambiosProgramados: {
          include: {
            edificio: true
          },
          where: {
            ejecutado: false
          }
        }
      }
    })

    if (!comision) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      comision
    })

  } catch (error) {
    console.error('Error al obtener comisión:', error)
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
    const { nombre, codigo, porcentaje, activa } = body

    // Validaciones básicas
    if (!nombre || !codigo || porcentaje === undefined) {
      return NextResponse.json(
        { error: 'Nombre, código y porcentaje son requeridos' },
        { status: 400 }
      )
    }

    if (porcentaje < 0 || porcentaje > 1) {
      return NextResponse.json(
        { error: 'El porcentaje debe estar entre 0 y 1 (0% - 100%)' },
        { status: 400 }
      )
    }

    // Verificar si la comisión existe
    const existingComision = await prisma.comision.findUnique({
      where: { id }
    })

    if (!existingComision) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si ya existe otra comisión con el mismo nombre o código
    const duplicateComision = await prisma.comision.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { nombre },
              { codigo }
            ]
          }
        ]
      }
    })

    if (duplicateComision) {
      return NextResponse.json(
        { error: 'Ya existe otra comisión con este nombre o código' },
        { status: 400 }
      )
    }

    // Actualizar comisión
    const updatedComision = await prisma.comision.update({
      where: { id },
      data: {
        nombre,
        codigo,
        porcentaje,
        activa: activa !== undefined ? activa : true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comisión actualizada exitosamente',
      comision: updatedComision
    })

  } catch (error) {
    console.error('Error al actualizar comisión:', error)
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

    // Verificar si la comisión existe
    const existingComision = await prisma.comision.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tiposUnidad: true,
            cambiosProgramados: true
          }
        }
      }
    })

    if (!existingComision) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si la comisión tiene asignaciones o cambios programados
    if (existingComision._count.tiposUnidad > 0 || existingComision._count.cambiosProgramados > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una comisión que tiene asignaciones o cambios programados. Desactívala en su lugar.' },
        { status: 400 }
      )
    }

    // Eliminar comisión
    await prisma.comision.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Comisión eliminada exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}