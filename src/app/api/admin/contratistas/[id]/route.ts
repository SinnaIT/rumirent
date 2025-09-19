import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyAuth } from '@/lib/auth'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Obtener contratista específico con estadísticas detalladas
    const contratista = await prisma.user.findUnique({
      where: {
        id,
        role: 'CONTRATISTA'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        activo: true,
        createdAt: true,
        contratos: {
          select: {
            id: true,
            fechaVenta: true,
            comisionReal: true,
            unidad: {
              select: {
                nombre: true,
                precio: true,
                edificio: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          },
          orderBy: {
            fechaVenta: 'desc'
          }
        },
        _count: {
          select: {
            contratos: true
          }
        }
      }
    })

    if (!contratista) {
      return NextResponse.json(
        { error: 'Contratista no encontrado' },
        { status: 404 }
      )
    }

    // Calcular estadísticas
    const ventasRealizadas = contratista._count.contratos
    const comisionesTotales = contratista.contratos.reduce((total, contrato) => total + (contrato.comisionReal || 0), 0)

    const response = {
      ...contratista,
      ventasRealizadas,
      comisionesTotales,
      createdAt: contratista.createdAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      contratista: response
    })

  } catch (error) {
    console.error('Error al obtener contratista:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { nombre, telefono, password } = body

    // Validaciones básicas
    if (!nombre) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar que el contratista existe
    const existingContratista = await prisma.user.findUnique({
      where: {
        id,
        role: 'CONTRATISTA'
      }
    })

    if (!existingContratista) {
      return NextResponse.json(
        { error: 'Contratista no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombre,
      telefono: telefono || null
    }

    // Si se proporciona nueva contraseña, hashearla
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 12)
    }

    // Actualizar contratista
    const updatedContratista = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        activo: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Contratista actualizado exitosamente',
      contratista: updatedContratista
    })

  } catch (error) {
    console.error('Error al actualizar contratista:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verificar que el contratista existe
    const existingContratista = await prisma.user.findUnique({
      where: {
        id,
        role: 'CONTRATISTA'
      },
      include: {
        _count: {
          select: {
            contratos: true
          }
        }
      }
    })

    if (!existingContratista) {
      return NextResponse.json(
        { error: 'Contratista no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el contratista tiene ventas asociadas
    if (existingContratista._count.contratos > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un contratista que tiene ventas registradas. Puede desactivarlo en su lugar.' },
        { status: 400 }
      )
    }

    // Eliminar contratista
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Contratista eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar contratista:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}