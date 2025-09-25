import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de broker
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener clientes del broker actual
    const clientes = await prisma.cliente.findMany({
      where: {
        brokerId: authResult.user.id
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      clientes
    })

  } catch (error) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de broker
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { nombre, rut, email, telefono } = body

    // Validaciones básicas
    if (!nombre || !rut) {
      return NextResponse.json(
        { error: 'Nombre y RUT son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que no exista un cliente con el mismo RUT
    const existingCliente = await prisma.cliente.findUnique({
      where: { rut }
    })

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este RUT' },
        { status: 400 }
      )
    }

    // Crear cliente
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        rut,
        email: email || undefined,
        telefono: telefono || undefined,
        brokerId: authResult.user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}