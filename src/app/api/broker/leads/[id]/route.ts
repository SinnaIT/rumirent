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

    // Validar inmutabilidad de fechas - una vez guardadas, no se pueden modificar
    const datosActualizacion: {
      estado: string
      observaciones: string | null
      fechaPagoReserva?: Date
      fechaPagoLead?: Date
      fechaCheckin?: Date
    } = {
      estado: estado || leadExistente.estado,
      observaciones: observaciones !== undefined ? observaciones : leadExistente.observaciones
    }

    // Solo permitir actualizar fechas si no han sido previamente guardadas (son null)
    if (fechaPagoReserva) {
      if (leadExistente.fechaPagoReserva !== null) {
        return NextResponse.json(
          { error: 'La fecha de pago de reserva no se puede modificar después de haber sido guardada' },
          { status: 400 }
        )
      }
      datosActualizacion.fechaPagoReserva = new Date(fechaPagoReserva)
    }

    if (fechaPagoLead) {
      if (leadExistente.fechaPagoLead !== null) {
        return NextResponse.json(
          { error: 'La fecha de pago de lead no se puede modificar después de haber sido guardada' },
          { status: 400 }
        )
      }
      datosActualizacion.fechaPagoLead = new Date(fechaPagoLead)
    }

    if (fechaCheckin) {
      if (leadExistente.fechaCheckin !== null) {
        return NextResponse.json(
          { error: 'La fecha de check-in no se puede modificar después de haber sido guardada' },
          { status: 400 }
        )
      }
      datosActualizacion.fechaCheckin = new Date(fechaCheckin)
    }

    // Actualizar el lead
    const leadActualizado = await prisma.lead.update({
      where: { id },
      data: datosActualizacion,
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