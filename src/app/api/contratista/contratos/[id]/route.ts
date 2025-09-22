import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación y rol de contratista
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'CONTRATISTA') {
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
      fechaPagoContrato,
      fechaCheckin,
      observaciones
    } = body

    // Verificar que el contrato existe y pertenece al contratista
    const contratoExistente = await prisma.contrato.findFirst({
      where: {
        id,
        contratistaId: authResult.user.id
      }
    })

    if (!contratoExistente) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o no tienes permisos para editarlo' },
        { status: 404 }
      )
    }

    // Actualizar el contrato
    const contratoActualizado = await prisma.contrato.update({
      where: { id },
      data: {
        estado: estado || contratoExistente.estado,
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : contratoExistente.fechaPagoReserva,
        fechaPagoContrato: fechaPagoContrato ? new Date(fechaPagoContrato) : contratoExistente.fechaPagoContrato,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : contratoExistente.fechaCheckin,
        observaciones: observaciones !== undefined ? observaciones : contratoExistente.observaciones
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
      message: 'Contrato actualizado exitosamente',
      contrato: {
        id: contratoActualizado.id,
        codigoUnidad: contratoActualizado.codigoUnidad,
        totalContrato: contratoActualizado.totalContrato,
        montoUf: contratoActualizado.montoUf,
        comision: contratoActualizado.comision,
        estado: contratoActualizado.estado,
        fechaPagoReserva: contratoActualizado.fechaPagoReserva?.toISOString(),
        fechaPagoContrato: contratoActualizado.fechaPagoContrato?.toISOString(),
        fechaCheckin: contratoActualizado.fechaCheckin?.toISOString(),
        observaciones: contratoActualizado.observaciones,
        cliente: contratoActualizado.cliente,
        unidad: contratoActualizado.unidad,
        edificio: contratoActualizado.edificio,
        createdAt: contratoActualizado.createdAt.toISOString(),
        updatedAt: contratoActualizado.updatedAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Error al actualizar contrato:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}