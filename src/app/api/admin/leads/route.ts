import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/admin/leads')

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

    const { searchParams } = new URL(request.url)
    const brokerId = searchParams.get('brokerId')
    const clienteId = searchParams.get('clienteId')
    const estado = searchParams.get('estado')

    console.log('✅ Usuario autorizado, consultando leads...')
    console.log('🔍 Filtros aplicados:', { brokerId, clienteId, estado })

    // Construir filtros dinámicos
    const whereClause: any = {}

    if (brokerId && brokerId !== 'todos') {
      whereClause.brokerId = brokerId
    }

    if (clienteId && clienteId !== 'todos') {
      whereClause.clienteId = clienteId
    }

    if (estado && estado !== 'todos') {
      whereClause.estado = estado
    }

    // Obtener leads con información relacionada
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            email: true,
            telefono: true
          }
        },
        unidad: {
          select: {
            id: true,
            numero: true,
            descripcion: true,
            metros2: true,
            edificio: {
              select: {
                id: true,
                nombre: true,
                direccion: true
              }
            },
            tipoUnidadEdificio: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        reglaComision: {
          select: {
            id: true,
            cantidadMinima: true,
            cantidadMaxima: true,
            porcentaje: true,
            comision: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('📄 Leads encontrados:', leads.length)

    // Formatear datos
    const leadsFormatted = leads.map(lead => ({
      id: lead.id,
      codigoUnidad: lead.codigoUnidad,
      totalLead: lead.totalLead,
      montoUf: lead.montoUf,
      comision: lead.comision,
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva?.toISOString() || null,
      fechaPagoLead: lead.fechaPagoLead?.toISOString() || null,
      fechaCheckin: lead.fechaCheckin?.toISOString() || null,
      postulacion: lead.postulacion,
      observaciones: lead.observaciones,
      conciliado: lead.conciliado,
      fechaConciliacion: lead.fechaConciliacion?.toISOString() || null,
      broker: {
        id: lead.broker.id,
        nombre: lead.broker.nombre,
        email: lead.broker.email,
        rut: lead.broker.rut
      },
      cliente: lead.cliente,
      unidad: lead.unidad,
      edificio: lead.edificio,
      reglaComision: lead.reglaComision,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      leads: leadsFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener leads:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}