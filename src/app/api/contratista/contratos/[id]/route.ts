import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y rol de broker
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      estado,
      fechaPagoReserva,
      fechaPagoLead,
      fechaCheckin,
      observaciones
    } = body

    // Verificar que el lead existe y pertenece al broker
    const leadExistente = await prisma.lead.findFirst({
      where: {
        id,
        brokerId: authResult.user.id
      }
    })

    if (!leadExistente) {
      return NextResponse.json(
        { error: 'Lead no encontrado o no tienes permisos para editarlo' },
        { status: 404 }
      )
    }

    // Actualizar el lead
    const leadActualizado = await prisma.lead.update({
      where: { id },
      data: {
        estado: estado || leadExistente.estado,
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : leadExistente.fechaPagoReserva,
        fechaPagoLead: fechaPagoLead ? new Date(fechaPagoLead) : leadExistente.fechaPagoLead,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : leadExistente.fechaCheckin,
        observaciones: observaciones !== undefined ? observaciones : leadExistente.observaciones
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
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead actualizado exitosamente',
      lead: {
        id: leadActualizado.id,
        codigoUnidad: leadActualizado.codigoUnidad,
        totalLead: leadActualizado.totalLead,
        montoUf: leadActualizado.montoUf,
        comision: leadActualizado.comision,
        estado: leadActualizado.estado,
        fechaPagoReserva: leadActualizado.fechaPagoReserva?.toISOString(),
        fechaPagoLead: leadActualizado.fechaPagoLead?.toISOString(),
        fechaCheckin: leadActualizado.fechaCheckin?.toISOString(),
        observaciones: leadActualizado.observaciones,
        cliente: leadActualizado.cliente,
        unidad: leadActualizado.unidad,
        edificio: leadActualizado.edificio,
        createdAt: leadActualizado.createdAt.toISOString(),
        updatedAt: leadActualizado.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}