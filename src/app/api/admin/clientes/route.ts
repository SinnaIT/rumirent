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
      broker: {
        id: cliente.broker.id,
        nombre: cliente.broker.nombre,
        email: cliente.broker.email,
        rut: cliente.broker.rut
      },
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
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}