import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/clientes/' + id)

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true
          }
        },
        _count: {
          select: {
            leads: true // BD field name, but we'll map to totalLeads
          }
        }
      }
    })

    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const clienteFormatted = {
      id: cliente.id,
      nombre: cliente.nombre,
      rut: cliente.rut,
      email: cliente.email,
      telefono: cliente.telefono,
      broker: cliente.broker,
      totalLeads: cliente._count.leads, // BD field name, mapped to totalLeads
      createdAt: cliente.createdAt.toISOString(),
      updatedAt: cliente.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      cliente: clienteFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener cliente:', error)
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
    console.log('🔄 PUT /api/admin/clientes/' + id)

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { nombre, rut, email, telefono, brokerId } = body

    console.log('📝 Datos a actualizar:', { nombre, rut, email, telefono, brokerId })

    // Validaciones básicas
    if (!nombre || !rut || !brokerId) {
      return NextResponse.json(
        { error: 'Nombre, RUT y broker son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el cliente existe
    const existingCliente = await prisma.cliente.findUnique({
      where: { id }
    })

    if (!existingCliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que no hay otro cliente con el mismo RUT (excluyendo el actual)
    const duplicateCliente = await prisma.cliente.findFirst({
      where: {
        rut,
        id: { not: id }
      }
    })

    if (duplicateCliente) {
      return NextResponse.json(
        { error: 'Ya existe otro cliente con este RUT' },
        { status: 400 }
      )
    }

    // Verificar que el broker existe
    const brokerExists = await prisma.user.findUnique({
      where: {
        id: brokerId,
        role: 'BROKER'
      }
    })

    if (!brokerExists) {
      return NextResponse.json(
        { error: 'El broker especificado no existe o no es válido' },
        { status: 400 }
      )
    }

    // Actualizar cliente
    const updatedCliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre,
        rut,
        email: email || null,
        telefono: telefono || null,
        brokerId
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true
          }
        },
        _count: {
          select: {
            leads: true // BD field name, but we'll map to totalLeads
          }
        }
      }
    })

    console.log('✅ Cliente actualizado exitosamente')

    const clienteFormatted = {
      id: updatedCliente.id,
      nombre: updatedCliente.nombre,
      rut: updatedCliente.rut,
      email: updatedCliente.email,
      telefono: updatedCliente.telefono,
      broker: updatedCliente.broker,
      totalLeads: updatedCliente._count.leads, // BD field name, mapped to totalLeads
      createdAt: updatedCliente.createdAt.toISOString(),
      updatedAt: updatedCliente.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      cliente: clienteFormatted
    })

  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}