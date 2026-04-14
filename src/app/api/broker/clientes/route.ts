import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireBrokerOrTeamLeader } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('[API /broker/clientes] GET request received')

    const user = await requireBrokerOrTeamLeader(request)
    if (user instanceof NextResponse) return user

    console.log('[API /broker/clientes] Broker ID:', user.id)

    // Calcular fecha límite para leads activos (30 días atrás)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Obtener clientes del broker actual con información de leads activos
    const clientes = await prisma.cliente.findMany({
      where: {
        brokerId: user.id
      },
      include: {
        leads: {
          where: {
            createdAt: {
              gte: thirtyDaysAgo
            },
            estado: {
              notIn: ['RECHAZADO', 'CANCELADO', 'DEPARTAMENTO_ENTREGADO']
            }
          },
          select: {
            id: true,
            createdAt: true,
            estado: true,
            edificio: {
              select: {
                nombre: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1 // Solo el más reciente
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log('[API /broker/clientes] Clientes found:', clientes.length)

    // Formatear la respuesta con información de lead activo
    const clientesWithLeadStatus = clientes.map(cliente => {
      const activeLead = cliente.leads[0]
      return {
        ...cliente,
        leads: undefined, // Remover el array completo
        hasActiveLead: !!activeLead,
        activeLead: activeLead ? {
          id: activeLead.id,
          createdAt: activeLead.createdAt.toISOString(),
          estado: activeLead.estado,
          edificio: activeLead.edificio.nombre
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      clientes: clientesWithLeadStatus
    })

  } catch (error) {
    console.error('[API /broker/clientes] Error al obtener clientes:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireBrokerOrTeamLeader(request)
    if (user instanceof NextResponse) return user

    const body = await request.json()
    const { nombre, rut, email, telefono, direccion, fechaNacimiento } = body

    // Validaciones básicas
    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: 'Nombre y teléfono son requeridos' },
        { status: 400 }
      )
    }

    // Verificar duplicados solo para campos con valor
    const orConditions: object[] = [{ telefono }]
    if (rut) orConditions.push({ rut })
    if (email) orConditions.push({ email })

    const existingCliente = await prisma.cliente.findFirst({
      where: { OR: orConditions }
    })

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este RUT, email o teléfono' },
        { status: 400 }
      )
    }

    // Crear cliente
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        rut: rut || null,
        email: email || null,
        telefono,
        direccion: direccion || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        brokerId: user.id
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