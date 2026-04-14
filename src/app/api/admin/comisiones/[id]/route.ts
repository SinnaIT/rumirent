import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/comisiones/' + id)
    const comision = await prisma.comision.findUnique({
      where: { id },
      include: {
        reglasComision: {
          orderBy: { cantidadMinima: 'asc' }
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
    console.error('❌ Error al obtener comisión:', error)
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
    console.log('🔄 PUT /api/admin/comisiones/' + id)
    const body = await request.json()
    const { nombre, codigo, porcentaje, activa } = body

    console.log('📝 Datos a actualizar:', body)

    // Validaciones básicas
    if (!nombre || !codigo || porcentaje === undefined) {
      return NextResponse.json(
        { error: 'Nombre, código y porcentaje son requeridos' },
        { status: 400 }
      )
    }

    if (porcentaje < 0 || porcentaje > 1) {
      return NextResponse.json(
        { error: 'El porcentaje debe estar entre 0 y 1' },
        { status: 400 }
      )
    }

    // Verificar que la comisión existe
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
        porcentaje: parseFloat(porcentaje),
        activa: activa !== undefined ? activa : existingComision.activa
      }
    })

    console.log('✅ Comisión actualizada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Comisión actualizada exitosamente',
      comision: updatedComision
    })

  } catch (error) {
    console.error('❌ Error al actualizar comisión:', error)
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
    console.log('🗑️ DELETE /api/admin/comisiones/' + id)
    // Verificar que la comisión existe
    const existingComision = await prisma.comision.findUnique({
      where: { id },
      include: {
        edificios: true,
        tiposUnidad: true,
        reglasComision: true
      }
    })

    if (!existingComision) {
      return NextResponse.json(
        { error: 'Comisión no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no esté siendo utilizada
    if (existingComision.edificios.length > 0 || existingComision.tiposUnidad.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar la comisión porque está siendo utilizada por edificios o tipos de unidad' },
        { status: 400 }
      )
    }

    // Eliminar comisión (esto también eliminará las reglas por CASCADE)
    await prisma.comision.delete({
      where: { id }
    })

    console.log('✅ Comisión eliminada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Comisión eliminada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}