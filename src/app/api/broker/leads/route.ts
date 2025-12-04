import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'
import { commissionRulesCache, formatYearMonth } from '@/lib/cache/commission-rules-cache'

// El middleware ya validó que el usuario es BROKER
export async function POST(request: NextRequest) {
  try {
    // Obtener el usuario autenticado (el middleware ya validó que es BROKER)
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      unidadId,
      codigoUnidad,
      tipoUnidadEdificioId,
      totalLead,
      montoUf,
      comision,
      comisionId,
      reglaComisionId,
      fechaPagoReserva,
      fechaPagoLead,
      fechaCheckin,
      estado,
      observaciones,
      clienteId,
      edificioId
    } = body

    // Validaciones básicas - la unidad ahora es completamente opcional
    if (!clienteId || !totalLead || !edificioId) {
      return NextResponse.json(
        { error: 'Cliente, edificio y total del arriendo son requeridos' },
        { status: 400 }
      )
    }

    if (totalLead <= 0) {
      return NextResponse.json(
        { error: 'El total del arriendo debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (comision < 0) {
      return NextResponse.json(
        { error: 'La comisión debe ser mayor o igual a 0' },
        { status: 400 }
      )
    }

    let unidad = null

    // Solo verificar unidad si se proporcionó unidadId
    if (unidadId) {
      unidad = await prisma.unidad.findUnique({
        where: { id: unidadId },
        include: {
          edificio: true,
          leads: true  // Este es un Lead? (opcional)
        }
      })

      if (!unidad) {
        return NextResponse.json(
          { error: 'Unidad no encontrada' },
          { status: 404 }
        )
      }

      if (unidad.estado !== 'DISPONIBLE') {
        return NextResponse.json(
          { error: 'La unidad no está disponible para la venta' },
          { status: 400 }
        )
      }

      // Verificar que no hay un lead activo para esta unidad
      // En el esquema, leads es Lead? (uno a uno opcional)
      if (unidad.leads && unidad.leads.estado !== 'CANCELADO') {
        return NextResponse.json(
          { error: 'La unidad ya tiene un lead activo' },
          { status: 400 }
        )
      }
    }

    // Crear el lead en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      let finalUnidadId = unidadId

      // Si se proporciona código manual sin unidadId, crear la unidad automáticamente
      if (!unidadId && codigoUnidad && tipoUnidadEdificioId) {
        // Verificar que no exista una unidad con el mismo número en el edificio
        const existingUnit = await tx.unidad.findFirst({
          where: {
            numero: codigoUnidad,
            edificioId: edificioId
          }
        })

        if (existingUnit) {
          throw new Error(`Ya existe una unidad con el código "${codigoUnidad}" en este proyecto`)
        }

        // Crear la nueva unidad
        const nuevaUnidad = await tx.unidad.create({
          data: {
            numero: codigoUnidad,
            edificioId: edificioId,
            tipoUnidadEdificioId: tipoUnidadEdificioId,
            estado: 'RESERVADA',
            descripcion: `Unidad creada automáticamente desde generación de lead`
          }
        })

        finalUnidadId = nuevaUnidad.id
      }

      // Crear lead
      const nuevoLead = await tx.lead.create({
        data: {
          codigoUnidad: codigoUnidad || undefined,
          totalLead,
          montoUf,
          comision,
          comisionId: comisionId || null,
          reglaComisionId: reglaComisionId || null,
          estado: estado || 'INGRESADO', // Changed from 'ENTREGADO' to 'INGRESADO' (new default)
          fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : null,
          fechaPagoLead: fechaPagoLead ? new Date(fechaPagoLead) : null,
          fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : null,
          observaciones: observaciones || undefined,
          brokerId: user.userId,
          clienteId,
          unidadId: finalUnidadId || null,
          edificioId,
          tipoUnidadEdificioId: tipoUnidadEdificioId || null
        },
        include: {
          unidad: finalUnidadId ? {
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
          } : false,
          tipoUnidadEdificio: tipoUnidadEdificioId ? {
            include: {
              comision: true
            }
          } : false
        }
      })

      // Actualizar estado de la unidad a RESERVADA solo si era una unidad preexistente
      if (finalUnidadId && unidadId) {
        // Solo actualizar si era una unidad seleccionada del dropdown (no la que acabamos de crear)
        await tx.unidad.update({
          where: { id: finalUnidadId },
          data: { estado: 'RESERVADA' }
        })
      }

      return nuevoLead
    })

    const leadFormatted = {
      id: resultado.id,
      codigoUnidad: resultado.codigoUnidad,
      totalLead: resultado.totalLead,
      montoUf: resultado.montoUf,
      comision: resultado.comision,
      estado: resultado.estado,
      fechaPagoReserva: resultado.fechaPagoReserva?.toISOString(),
      fechaPagoLead: resultado.fechaPagoLead?.toISOString(),
      fechaCheckin: resultado.fechaCheckin?.toISOString(),
      observaciones: resultado.observaciones,
      unidad: resultado.unidad ? {
        id: resultado.unidad.id,
        numero: resultado.unidad.numero,
        descripcion: resultado.unidad.descripcion,
        metros2: resultado.unidad.metros2,
        edificio: resultado.unidad.edificio,
        tipoUnidadEdificio: {
          id: resultado.unidad.tipoUnidadEdificio.id,
          nombre: resultado.unidad.tipoUnidadEdificio.nombre,
          codigo: resultado.unidad.tipoUnidadEdificio.codigo,
          comision: resultado.unidad.tipoUnidadEdificio.comision
        }
      } : null,
      createdAt: resultado.createdAt.toISOString(),
      updatedAt: resultado.updatedAt.toISOString()
    }

    // Invalidate commission rules cache for this broker and month
    if (resultado.fechaPagoReserva) {
      const yearMonth = formatYearMonth(new Date(resultado.fechaPagoReserva))
      commissionRulesCache.invalidateBrokerMonth(user.userId, yearMonth)
      console.log(`[LeadCreation] Cache invalidated for broker ${user.userId}, month ${yearMonth}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Lead generado exitosamente',
      lead: leadFormatted
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear lead:', error)

    // Proporcionar mensajes de error más específicos
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
