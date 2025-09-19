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

    const body = await request.json()
    const {
      unidadId,
      unidadManual,
      prioridad,
      rutCliente,
      nombreCliente,
      precioPesos,
      precioUF,
      comisionAsesor,
      fechaPagoReserva,
      fechaPagoContrato,
      fechaCheckin,
      estado,
      observaciones
    } = body

    // Validaciones básicas
    if ((!unidadId && !unidadManual) || !rutCliente || !nombreCliente || !precioPesos || !precioUF) {
      return NextResponse.json(
        { error: 'Unidad (del sistema o manual), datos del cliente y precios son requeridos' },
        { status: 400 }
      )
    }

    if (precioPesos <= 0 || precioUF <= 0) {
      return NextResponse.json(
        { error: 'Los precios deben ser mayor a 0' },
        { status: 400 }
      )
    }

    if (comisionAsesor < 0) {
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

    // Generar número de contrato único
    const ultimoContrato = await prisma.contrato.findFirst({
      orderBy: { numero: 'desc' }
    })
    const nuevoNumero = (ultimoContrato?.numero || 0) + 1

    // Crear el contrato en una transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Crear contrato
      const nuevoContrato = await tx.contrato.create({
        data: {
          numero: nuevoNumero,
          prioridad: prioridad || 'BAJA',
          rutCliente,
          nombreCliente,
          precioPesos,
          precioUF,
          comisionAsesor,
          estado: estado || 'POSTULACION',
          fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : null,
          fechaPagoContrato: fechaPagoContrato ? new Date(fechaPagoContrato) : null,
          fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : null,
          unidadManual: unidadManual || undefined,
          observaciones: observaciones || undefined,
          contratistaId: authResult.user.id,
          unidadId: unidadId || null
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
              tipoUnidad: {
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
      numero: resultado.numero,
      prioridad: resultado.prioridad,
      rutCliente: resultado.rutCliente,
      nombreCliente: resultado.nombreCliente,
      precioPesos: resultado.precioPesos,
      precioUF: resultado.precioUF,
      comisionAsesor: resultado.comisionAsesor,
      estado: resultado.estado,
      fechaPagoReserva: resultado.fechaPagoReserva?.toISOString(),
      fechaPagoContrato: resultado.fechaPagoContrato?.toISOString(),
      fechaCheckin: resultado.fechaCheckin?.toISOString(),
      unidadManual: resultado.unidadManual,
      observaciones: resultado.observaciones,
      unidad: resultado.unidad ? {
        id: resultado.unidad.id,
        numero: resultado.unidad.numero,
        descripcion: resultado.unidad.descripcion,
        metros2: resultado.unidad.metros2,
        edificio: resultado.unidad.edificio,
        tipoUnidad: {
          id: resultado.unidad.tipoUnidad.id,
          nombre: resultado.unidad.tipoUnidad.nombre,
          codigo: resultado.unidad.tipoUnidad.codigo,
          comision: resultado.unidad.tipoUnidad.comision
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