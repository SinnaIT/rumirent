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

    // Obtener leads del broker
    const leads = await prisma.lead.findMany({
      where: {
        brokerId: authResult.user.id
      },
      include: {
        cliente: true,
        unidad: {
          include: {
            edificio: {
              select: {
                id: true,
                nombre: true,
                direccion: true
              }
            },
            tipoUnidadEdificio: {
              include: {
                comision: true
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
        },
        reglaComision: {
          include: {
            comision: {
              select: {
                id: true,
                nombre: true,
                codigo: true
              }
            }
          }
        },
        comisionBase: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const leadsFormatted = leads.map(lead => ({
      id: lead.id,
      codigoUnidad: lead.codigoUnidad,
      totalLead: lead.totalLead,
      montoUf: lead.montoUf,
      comision: lead.comision,
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva?.toISOString(),
      fechaPagoLead: lead.fechaPagoLead?.toISOString(),
      fechaCheckin: lead.fechaCheckin?.toISOString(),
      observaciones: lead.observaciones,
      cliente: lead.cliente ? {
        id: lead.cliente.id,
        nombre: lead.cliente.nombre,
        rut: lead.cliente.rut,
        email: lead.cliente.email,
        telefono: lead.cliente.telefono
      } : null,
      unidad: lead.unidad ? {
        id: lead.unidad.id,
        numero: lead.unidad.numero,
        descripcion: lead.unidad.descripcion,
        metros2: lead.unidad.metros2,
        edificio: lead.unidad.edificio,
        tipoUnidad: {
          id: lead.unidad.tipoUnidadEdificio.id,
          nombre: lead.unidad.tipoUnidadEdificio.nombre,
          codigo: lead.unidad.tipoUnidadEdificio.codigo,
          comision: lead.unidad.tipoUnidadEdificio.comision ? {
            id: lead.unidad.tipoUnidadEdificio.comision.id,
            nombre: lead.unidad.tipoUnidadEdificio.comision.nombre,
            codigo: lead.unidad.tipoUnidadEdificio.comision.codigo,
            porcentaje: lead.unidad.tipoUnidadEdificio.comision.porcentaje,
            activa: lead.unidad.tipoUnidadEdificio.comision.activa
          } : null
        }
      } : null,
      edificio: lead.edificio ? {
        id: lead.edificio.id,
        nombre: lead.edificio.nombre,
        direccion: lead.edificio.direccion
      } : null,
      reglaComision: lead.reglaComision ? {
        id: lead.reglaComision.id,
        cantidadMinima: lead.reglaComision.cantidadMinima,
        cantidadMaxima: lead.reglaComision.cantidadMaxima,
        porcentaje: lead.reglaComision.porcentaje,
        comision: {
          id: lead.reglaComision.comision.id,
          nombre: lead.reglaComision.comision.nombre,
          codigo: lead.reglaComision.comision.codigo
        }
      } : null,
      comisionBase: lead.comisionBase ? {
        id: lead.comisionBase.id,
        nombre: lead.comisionBase.nombre,
        codigo: lead.comisionBase.codigo,
        porcentaje: lead.comisionBase.porcentaje
      } : null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString()
    }))

    // Calcular estadísticas
    const stats = {
      totalLeads: leads.length,
      entregados: leads.filter(c => c.estado === 'ENTREGADO').length,
      reservaPagada: leads.filter(c => c.estado === 'RESERVA_PAGADA').length,
      aprobados: leads.filter(c => c.estado === 'APROBADO').length,
      rechazados: leads.filter(c => c.estado === 'RECHAZADO').length,
      totalComisionesEsperadas: leads
        .filter(c => c.estado !== 'RECHAZADO')
        .reduce((sum, c) => sum + (c.comision || 0), 0),
      totalComisionesAprobadas: leads
        .filter(c => c.estado === 'APROBADO')
        .reduce((sum, c) => sum + (c.comision || 0), 0)
    }

    return NextResponse.json({
      success: true,
      leads: leadsFormatted,
      estadisticas: stats
    })

  } catch (error) {
    console.error('Error al obtener leads:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}