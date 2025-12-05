import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/admin/clientes')

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      // Verificar autenticación y rol de administrador
      const authResult = await verifyAuth(request)
      console.log('🔐 Resultado de autenticación:', authResult)

      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        console.log('❌ No autorizado')
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    console.log('✅ Usuario autorizado, consultando clientes...')

    // Obtener clientes con información del broker
    const clientes = await prisma.cliente.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('👥 Clientes encontrados:', clientes.length)

    // Formatear datos
    const clientesFormatted = clientes.map(cliente => ({
      id: cliente.id,
      nombre: cliente.nombre,
      rut: cliente.rut,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      fechaNacimiento: cliente.fechaNacimiento?.toISOString(),
      broker: cliente.broker ? {
        id: cliente.broker.id,
        nombre: cliente.broker.nombre,
        email: cliente.broker.email,
        rut: cliente.broker.rut
      } : null,
      totalLeads: cliente._count.leads, // BD field name, mapped to totalLeads
      createdAt: cliente.createdAt.toISOString(),
      updatedAt: cliente.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      clientes: clientesFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener clientes:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando POST /api/admin/clientes')

      // Verificar autenticación y rol de administrador
      const authResult = await verifyAuth(request)
      console.log('🔐 Resultado de autenticación:', authResult)

      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        console.log('❌ No autorizado')
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }

    const body = await request.json()
    const { nombre, rut, email, telefono, direccion, fechaNacimiento, brokerId } = body

    console.log('📝 Datos recibidos:', { nombre, rut, email, telefono, direccion, fechaNacimiento, brokerId })

    // Validaciones
    if (!nombre || !telefono) {
      return NextResponse.json(
        { success: false, error: 'Nombre y Telefono son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si el RUT ya existe (solo si se proporciona)
    if (rut) {
      const existingCliente = await prisma.cliente.findFirst({
  where: {
    OR: [
      {rut},
      {email},
      {telefono}
    ]
  }
});

      if (existingCliente) {
        return NextResponse.json(
          { success: false, error: 'Ya existe un cliente con este RUT, Email o Telefono' },
          { status: 400 }
        )
      }
    }

    // Verificar que el broker existe (solo si se proporciona)
    if (brokerId && brokerId.trim() !== '') {
      const broker = await prisma.user.findUnique({
        where: { id: brokerId }
      })

      if (!broker || broker.role !== 'BROKER') {
        return NextResponse.json(
          { success: false, error: 'Broker no encontrado o inválido' },
          { status: 400 }
        )
      }
    }

    // Crear cliente
    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre,
        rut: rut || null,
        email: email || null,
        telefono: telefono,
        direccion: direccion || null,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        brokerId: (brokerId && brokerId.trim() !== '') ? brokerId : null
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true
          }
        }
      }
    })

    console.log('✅ Cliente creado exitosamente:', nuevoCliente.id)

    return NextResponse.json({
      success: true,
      message: 'Cliente creado exitosamente',
      cliente: nuevoCliente
    })

  } catch (error) {
    console.error('❌ Error al crear cliente:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', details: errorMessage },
      { status: 500 }
    )
  }
}