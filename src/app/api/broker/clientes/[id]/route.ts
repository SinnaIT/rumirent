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
      },
      include: {
        leads: {
          select: {
            id: true,
            codigoUnidad: true,
            totalLead: true,
            montoUf: true,
            estado: true,
            comision: true,
            fechaCheckin: true,
            createdAt: true,
            edificio: {
              select: {
                nombre: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
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

    // Format response
    const response = {
      ...cliente,
      leads: cliente.leads.map(lead => ({
        id: lead.id,
        clienteNombre: cliente.nombre,
        clienteRut: cliente.rut,
        edificioNombre: lead.edificio.nombre,
        codigoUnidad: lead.codigoUnidad,
        totalLead: lead.totalLead,
        montoUf: lead.montoUf,
        estado: lead.estado,
        comision: lead.comision,
        fechaCheckin: lead.fechaCheckin,
        createdAt: lead.createdAt
      }))
    }

    return NextResponse.json({
      success: true,
      cliente: response
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
    const { nombre, rut, telefono, email, direccion, fechaNacimiento } = body

    // Validar campos requeridos
    if (!nombre || !telefono) {
      return NextResponse.json(
        { success: false, error: 'Nombre y teléfono (WhatsApp) son requeridos' },
        { status: 400 }
      )
    }

    // Verificar duplicados de RUT si se proporciona y es diferente
    if (rut && rut !== existingCliente.rut) {
      const duplicateRut = await prisma.cliente.findFirst({
        where: {
          rut,
          id: { not: params.id }
        }
      })

      if (duplicateRut) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con este RUT' },
          { status: 400 }
        )
      }
    }

    // Actualizar cliente
    const clienteActualizado = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        nombre,
        rut: rut || null,
        telefono,
        email: email || null,
        direccion: direccion || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null
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
