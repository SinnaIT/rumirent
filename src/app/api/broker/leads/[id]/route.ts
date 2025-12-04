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
      comision?: number
      comisionId?: string | null
    } = {
      estado: estado || leadExistente.estado,
      observaciones: observaciones !== undefined ? observaciones : leadExistente.observaciones
    }

    // Solo permitir actualizar fechas si no han sido previamente guardadas (son null)
    // O si el valor enviado es el mismo que el existente (para permitir actualizaciones parciales)
    if (fechaPagoReserva) {
      const fechaEnviada = new Date(fechaPagoReserva).toISOString().split('T')[0]
      const fechaExistente = leadExistente.fechaPagoReserva?.toISOString().split('T')[0]

      // Validar solo si la fecha existe Y es diferente a la enviada
      if (leadExistente.fechaPagoReserva !== null && fechaEnviada !== fechaExistente) {
        return NextResponse.json(
          { error: 'La fecha de pago de reserva no se puede modificar después de haber sido guardada' },
          { status: 400 }
        )
      }

      // Solo actualizar si realmente cambió o es nueva
      if (fechaEnviada !== fechaExistente) {
        datosActualizacion.fechaPagoReserva = new Date(fechaPagoReserva)
      }
    }

    if (fechaPagoLead) {
      const fechaEnviada = new Date(fechaPagoLead).toISOString().split('T')[0]
      const fechaExistente = leadExistente.fechaPagoLead?.toISOString().split('T')[0]

      if (leadExistente.fechaPagoLead !== null && fechaEnviada !== fechaExistente) {
        return NextResponse.json(
          { error: 'La fecha de pago de lead no se puede modificar después de haber sido guardada' },
          { status: 400 }
        )
      }

      if (fechaEnviada !== fechaExistente) {
        datosActualizacion.fechaPagoLead = new Date(fechaPagoLead)
      }
    }

    if (fechaCheckin) {
      const fechaEnviada = new Date(fechaCheckin).toISOString().split('T')[0]
      const fechaExistente = leadExistente.fechaCheckin?.toISOString().split('T')[0]

      if (leadExistente.fechaCheckin !== null && fechaEnviada !== fechaExistente) {
        return NextResponse.json(
          { error: 'La fecha de check-in no se puede modificar después de haber sido guardada' },
          { status: 400 }
        )
      }

      if (fechaEnviada !== fechaExistente) {
        datosActualizacion.fechaCheckin = new Date(fechaCheckin)
      }
    }

    // Calculate commission if estado is changing to DEPARTAMENTO_ENTREGADO
    if (estado === 'DEPARTAMENTO_ENTREGADO' && leadExistente.estado !== 'DEPARTAMENTO_ENTREGADO') {
      const leadWithRelations = await prisma.lead.findUnique({
        where: { id },
        include: {
          unidad: {
            include: {
              tipoUnidad: {
                include: {
                  comision: true
                }
              }
            }
          },
          edificio: {
            include: {
              comision: true
            }
          },
          tipoUnidadEdificio: {
            include: {
              comision: true
            }
          }
        }
      })

      if (leadWithRelations) {
        let comisionPorcentaje = 0
        let selectedComisionId = null

        // Priority 1: TipoUnidadEdificio commission
        if (leadWithRelations.tipoUnidadEdificio?.comision) {
          comisionPorcentaje = leadWithRelations.tipoUnidadEdificio.comision.porcentaje
          selectedComisionId = leadWithRelations.tipoUnidadEdificio.comision.id
        }
        // Priority 2: Unidad's TipoUnidad commission
        else if (leadWithRelations.unidad?.tipoUnidad?.comision) {
          comisionPorcentaje = leadWithRelations.unidad.tipoUnidad.comision.porcentaje
          selectedComisionId = leadWithRelations.unidad.tipoUnidad.comision.id
        }
        // Priority 3: Edificio commission
        else if (leadWithRelations.edificio?.comision) {
          comisionPorcentaje = leadWithRelations.edificio.comision.porcentaje
          selectedComisionId = leadWithRelations.edificio.comision.id
        }

        // Calculate and add to update data
        const calculatedComision = leadWithRelations.totalLead * comisionPorcentaje
        datosActualizacion.comision = calculatedComision
        datosActualizacion.comisionId = selectedComisionId

        console.log('💰 Comisión calculada automáticamente (broker):', {
          totalLead: leadWithRelations.totalLead,
          porcentaje: comisionPorcentaje,
          comision: calculatedComision,
          comisionId: selectedComisionId
        })
      }
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