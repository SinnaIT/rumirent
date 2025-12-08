import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('[API /broker/clientes] GET request received')

    // Verificar autenticación y rol de broker
    const authResult = await verifyAuth(request)
    console.log('[API /broker/clientes] Auth result:', authResult)

    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      console.log('[API /broker/clientes] Unauthorized - success:', authResult.success, 'role:', authResult.user?.role)
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    console.log('[API /broker/clientes] Broker ID:', authResult.user.id)

    // Calcular fecha límite para leads activos (30 días atrás)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Obtener clientes del broker actual con información de leads activos
    const clientes = await prisma.cliente.findMany({
      where: {
        brokerId: authResult.user.id
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
    const existingCliente = await prisma.cliente.findFirst({
      where: { 
        OR: [
          { rut: rut },
          { email: email },
          { telefono: telefono }
        ]
       }
    })

    if (existingCliente) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este RUT, email o telefono' },
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