import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const brokerId = searchParams.get('brokerId')
    const edificioId = searchParams.get('edificioId')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Construir filtros
    const whereClause: any = {}
    if (estado) whereClause.estado = estado
    if (brokerId) whereClause.brokerId = brokerId
    if (edificioId) {
      whereClause.unidad = {
        edificioId: edificioId
      }
    }

    // Obtener leads con relaciones
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true
          }
        },
        unidad: {
          include: {
            edificio: {
              select: {
                id: true,
                nombre: true,
                direccion: true
              }
            },
            tipoUnidad: {
              include: {
                comision: true
              }
            }
          }
        }
      },
      orderBy: [
        { numero: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
    })

    const leadsFormatted = leads.map(lead => ({
      id: lead.id,
      numero: lead.numero,
      prioridad: lead.prioridad,
      rutCliente: lead.rutCliente,
      nombreCliente: lead.nombreCliente,
      precioPesos: lead.precioPesos,
      precioUF: lead.precioUF,
      comisionAsesor: lead.comisionAsesor,
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva?.toISOString(),
      fechaPagoLead: lead.fechaPagoLead?.toISOString(),
      fechaCheckin: lead.fechaCheckin?.toISOString(),
      observaciones: lead.observaciones,
      broker: lead.broker,
      unidad: {
        id: lead.unidad.id,
        numero: lead.unidad.numero,
        precio: lead.unidad.precio,
        estado: lead.unidad.estado,
        edificio: lead.unidad.edificio,
        tipoUnidad: {
          id: lead.unidad.tipoUnidad.id,
          nombre: lead.unidad.tipoUnidad.nombre,
          codigo: lead.unidad.tipoUnidad.codigo,
          comision: lead.unidad.tipoUnidad.comision
        }
      },
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString()
    }))

    // Obtener totales para estadísticas
    const totalLeads = await prisma.lead.count({ where: whereClause })
    const estadisticas = await prisma.lead.groupBy({
      by: ['estado'],
      where: whereClause,
      _count: true,
      _sum: {
        precioPesos: true,
        comisionAsesor: true
      }
    })

    return NextResponse.json({
      success: true,
      leads: leadsFormatted,
      pagination: {
        total: totalLeads,
        limit: limit ? parseInt(limit) : totalLeads,
        offset: offset ? parseInt(offset) : 0
      },
      estadisticas: estadisticas.map(stat => ({
        estado: stat.estado,
        cantidad: stat._count,
        valorTotal: stat._sum.precioPesos || 0,
        comisionTotal: stat._sum.comisionAsesor || 0
      }))
    })

  } catch (error) {
    console.error('Error al obtener leads:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      numero,
      prioridad,
      rutCliente,
      nombreCliente,
      precioPesos,
      precioUF,
      comisionAsesor,
      estado,
      fechaPagoReserva,
      fechaPagoLead,
      fechaCheckin,
      observaciones,
      brokerId,
      unidadId
    } = body

    // Validaciones básicas
    if (!numero || !rutCliente || !nombreCliente || !precioPesos || !precioUF || !comisionAsesor || !brokerId || !unidadId) {
      return NextResponse.json(
        { error: 'Los campos requeridos son: numero, rutCliente, nombreCliente, precioPesos, precioUF, comisionAsesor, brokerId, unidadId' },
        { status: 400 }
      )
    }

    // Verificar que no existe otro lead con el mismo número
    const existingLead = await prisma.lead.findFirst({
      where: { numero: parseInt(numero) }
    })

    if (existingLead) {
      return NextResponse.json(
        { error: 'Ya existe un lead con este número' },
        { status: 400 }
      )
    }

    // Verificar que el broker existe
    const broker = await prisma.user.findUnique({
      where: { id: brokerId }
    })

    if (!broker) {
      return NextResponse.json(
        { error: 'broker no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la unidad existe y está disponible
    const unidad = await prisma.unidad.findUnique({
      where: { id: unidadId },
      include: {
        leads: true
      }
    })

    if (!unidad) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      )
    }

    if (unidad.leads.length > 0) {
      return NextResponse.json(
        { error: 'Esta unidad ya tiene un lead asociado' },
        { status: 400 }
      )
    }

    // Crear lead
    const newLead = await prisma.lead.create({
      data: {
        numero: parseInt(numero),
        prioridad: prioridad || 'BAJA',
        rutCliente,
        nombreCliente,
        precioPesos: parseFloat(precioPesos),
        precioUF: parseFloat(precioUF),
        comisionAsesor: parseFloat(comisionAsesor),
        estado: estado || 'POSTULACION',
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : undefined,
        fechaPagoLead: fechaPagoLead ? new Date(fechaPagoLead) : undefined,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : undefined,
        observaciones,
        brokerId,
        unidadId
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true
          }
        },
        unidad: {
          include: {
            edificio: {
              select: {
                id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    // Actualizar estado de la unidad según el estado del lead
    let nuevoEstadoUnidad = 'DISPONIBLE'
    if (estado === 'RESERVADO') nuevoEstadoUnidad = 'RESERVADA'
    else if (estado === 'CONTRATADO' || estado === 'CHECKIN_REALIZADO') nuevoEstadoUnidad = 'VENDIDA'

    await prisma.unidad.update({
      where: { id: unidadId },
      data: { estado: nuevoEstadoUnidad as any }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead creado exitosamente',
      lead: newLead
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}