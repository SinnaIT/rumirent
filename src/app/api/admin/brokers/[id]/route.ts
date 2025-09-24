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

    // Obtener broker específico con estadísticas detalladas
    const broker = await prisma.user.findUnique({
      where: {
        id,
        role: 'BROKER'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        activo: true,
        createdAt: true,
        leads: {
          select: {
            id: true,
            comision: true,
            totalLead: true,
            unidad: {
              select: {
                numero: true,
                edificio: {
                  select: {
                    nombre: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    if (!broker) {
      return NextResponse.json(
        { error: 'broker no encontrado' },
        { status: 404 }
      )
    }

    // Calcular estadísticas
    const ventasRealizadas = broker._count.leads
    const comisionesTotales = broker.leads.reduce((total, lead) => total + (lead.comision || 0), 0)

    const response = {
      ...broker,
      ventasRealizadas,
      comisionesTotales,
      createdAt: broker.createdAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      broker: response
    })

  } catch (error) {
    console.error('Error al obtener broker:', error)
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
    const { nombre, rut, telefono, password } = body

    // Validaciones básicas
    if (!nombre || !rut) {
      return NextResponse.json(
        { error: 'El nombre y RUT son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el broker existe
    const existingbroker = await prisma.user.findUnique({
      where: {
        id,
        role: 'BROKER'
      }
    })

    if (!existingbroker) {
      return NextResponse.json(
        { error: 'broker no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el RUT ya existe en otro usuario
    if (rut !== existingbroker.rut) {
      const existingRut = await prisma.user.findUnique({
        where: { rut }
      })

      if (existingRut) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este RUT' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: any = {
      nombre,
      rut,
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

    // Actualizar broker
    const updatedbroker = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        activo: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'broker actualizado exitosamente',
      broker: updatedbroker
    })

  } catch (error) {
    console.error('Error al actualizar broker:', error)
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

    // Verificar que el broker existe
    const existingbroker = await prisma.user.findUnique({
      where: {
        id,
        role: 'BROKER'
      },
      include: {
        _count: {
          select: {
            leads: true
          }
        }
      }
    })

    if (!existingbroker) {
      return NextResponse.json(
        { error: 'broker no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el broker tiene ventas asociadas
    if (existingbroker._count.leads > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un broker que tiene ventas registradas. Puede desactivarlo en su lugar.' },
        { status: 400 }
      )
    }

    // Eliminar broker
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'broker eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar broker:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}