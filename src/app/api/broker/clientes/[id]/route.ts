import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const cliente = await prisma.cliente.findUnique({
      where: {
        id: params.id,
        brokerId: authResult.user.id // Solo puede ver sus propios clientes
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      cliente
    })

  } catch (error) {
    console.error('Error al obtener cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el cliente pertenece al broker
    const existingCliente = await prisma.cliente.findUnique({
      where: {
        id: params.id,
        brokerId: authResult.user.id
      }
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { telefono, email, direccion, fechaNacimiento } = body

    // Actualizar solo los campos permitidos
    const clienteActualizado = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        telefono: telefono !== undefined ? telefono : undefined,
        email: email !== undefined ? email : undefined,
        direccion: direccion !== undefined ? direccion : undefined,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      cliente: clienteActualizado
    })

  } catch (error) {
    console.error('Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
