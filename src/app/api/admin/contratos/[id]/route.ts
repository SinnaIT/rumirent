import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
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
      }
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    const leadFormatted = {
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
    }

    return NextResponse.json({
      success: true,
      lead: leadFormatted
    })

  } catch (error) {
    console.error('Error al obtener lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
      observaciones
    } = body

    // Verificar que el lead existe
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      include: {
        unidad: true
      }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Validaciones básicas
    if (!numero || !rutCliente || !nombreCliente || !precioPesos || !precioUF || !comisionAsesor) {
      return NextResponse.json(
        { error: 'Los campos requeridos son: numero, rutCliente, nombreCliente, precioPesos, precioUF, comisionAsesor' },
        { status: 400 }
      )
    }

    // Verificar que no existe otro lead con el mismo número (excepto el actual)
    const conflictingLead = await prisma.lead.findFirst({
      where: {
        numero: parseInt(numero),
        id: { not: id }
      }
    })

    if (conflictingLead) {
      return NextResponse.json(
        { error: 'Ya existe otro lead con este número' },
        { status: 400 }
      )
    }

    // Actualizar estado de la unidad si el estado del lead cambió
    const estadoActual = existingLead.estado
    const nuevoEstado = estado || estadoActual

    if (estadoActual !== nuevoEstado) {
      let nuevoEstadoUnidad = 'DISPONIBLE'

      if (nuevoEstado === 'RESERVADO') {
        nuevoEstadoUnidad = 'RESERVADA'
      } else if (nuevoEstado === 'CONTRATADO' || nuevoEstado === 'CHECKIN_REALIZADO') {
        nuevoEstadoUnidad = 'VENDIDA'
      } else if (nuevoEstado === 'CANCELADO') {
        nuevoEstadoUnidad = 'DISPONIBLE'
      }

      await prisma.unidad.update({
        where: { id: existingLead.unidadId },
        data: { estado: nuevoEstadoUnidad as any }
      })
    }

    // Actualizar lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        numero: parseInt(numero),
        prioridad: prioridad || existingLead.prioridad,
        rutCliente,
        nombreCliente,
        precioPesos: parseFloat(precioPesos),
        precioUF: parseFloat(precioUF),
        comisionAsesor: parseFloat(comisionAsesor),
        estado: nuevoEstado,
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : existingLead.fechaPagoReserva,
        fechaPagoLead: fechaPagoLead ? new Date(fechaPagoLead) : existingLead.fechaPagoLead,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : existingLead.fechaCheckin,
        observaciones: observaciones !== undefined ? observaciones : existingLead.observaciones
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

    return NextResponse.json({
      success: true,
      message: 'Lead actualizado exitosamente',
      lead: updatedLead
    })

  } catch (error) {
    console.error('Error al actualizar lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar que el lead existe
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      include: {
        unidad: true
      }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      )
    }

    // Liberar la unidad (volver a DISPONIBLE)
    await prisma.unidad.update({
      where: { id: existingLead.unidadId },
      data: { estado: 'DISPONIBLE' }
    })

    // Eliminar lead
    await prisma.lead.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar lead:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}