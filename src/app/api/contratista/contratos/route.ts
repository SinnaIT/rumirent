import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación y rol de contratista
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'CONTRATISTA') {
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
      totalContrato,
      montoUf,
      comision,
      fechaPagoReserva,
      fechaPagoContrato,
      fechaCheckin,
      estado,
      observaciones,
      clienteId,
      edificioId
    } = body

    // Validaciones básicas - la unidad ahora es completamente opcional
    if (!clienteId || !totalContrato || !montoUf || !edificioId) {
      return NextResponse.json(
        { error: 'Cliente, edificio y montos son requeridos' },
        { status: 400 }
      )
    }

    if (totalContrato <= 0 || montoUf <= 0) {
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
          contratos: true
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

      // Verificar que no hay un contrato activo para esta unidad
      const contratoActivo = unidad.contratos.find(c =>
        c.estado !== 'CANCELADO'
      )

      if (contratoActivo) {
        return NextResponse.json(
          { error: 'La unidad ya tiene un contrato activo' },
          { status: 400 }
        )
      }
    }

    // Crear el contrato en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear contrato
      const nuevoContrato = await tx.contrato.create({
        data: {
          codigoUnidad: codigoUnidad || undefined,
          totalContrato,
          montoUf,
          comision,
          estado: estado || 'ENTREGADO',
          fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : null,
          fechaPagoContrato: fechaPagoContrato ? new Date(fechaPagoContrato) : null,
          fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : null,
          observaciones: observaciones || undefined,
          contratistaId: authResult.user.id,
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

      return nuevoContrato
    })

    const contratoFormatted = {
      id: resultado.id,
      codigoUnidad: resultado.codigoUnidad,
      totalContrato: resultado.totalContrato,
      montoUf: resultado.montoUf,
      comision: resultado.comision,
      estado: resultado.estado,
      fechaPagoReserva: resultado.fechaPagoReserva?.toISOString(),
      fechaPagoContrato: resultado.fechaPagoContrato?.toISOString(),
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
      message: 'Contrato generado exitosamente',
      contrato: contratoFormatted
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear contrato:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}