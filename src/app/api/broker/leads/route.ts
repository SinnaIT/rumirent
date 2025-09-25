import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

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

    // Verificar que tenemos el ID del usuario
    if (!authResult.user?.id) {
      return NextResponse.json(
        { error: 'Error de autenticación: ID de usuario no encontrado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      unidadId,
      codigoUnidad,
      totalLead,
      montoUf,
      comision,
      fechaPagoReserva,
      fechaPagoLead,
      fechaCheckin,
      estado,
      observaciones,
      clienteId,
      edificioId
    } = body

    // Validaciones básicas - la unidad ahora es completamente opcional
    if (!clienteId || !totalLead || !montoUf || !edificioId) {
      return NextResponse.json(
        { error: 'Cliente, edificio y montos son requeridos' },
        { status: 400 }
      )
    }

    if (totalLead <= 0 || montoUf <= 0) {
      return NextResponse.json(
        { error: 'Los montos deben ser mayor a 0' },
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
      // Crear lead
      const nuevoLead = await tx.lead.create({
        data: {
          codigoUnidad: codigoUnidad || undefined,
          totalLead,
          montoUf,
          comision,
          estado: estado || 'ENTREGADO',
          fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : null,
          fechaPagoLead: fechaPagoLead ? new Date(fechaPagoLead) : null,
          fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : null,
          observaciones: observaciones || undefined,
          brokerId: authResult.user.id,
          clienteId,
          unidadId: unidadId || null,
          edificioId
        },
        include: {
          unidad: unidadId ? {
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
          } : false
        }
      })

      // Actualizar estado de la unidad a RESERVADA solo si hay unidadId
      if (unidadId) {
        await tx.unidad.update({
          where: { id: unidadId },
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

    return NextResponse.json({
      success: true,
      message: 'Lead generado exitosamente',
      lead: leadFormatted
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}