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

    const contrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        contratista: {
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

    if (!contrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      )
    }

    const contratoFormatted = {
      id: contrato.id,
      numero: contrato.numero,
      prioridad: contrato.prioridad,
      rutCliente: contrato.rutCliente,
      nombreCliente: contrato.nombreCliente,
      precioPesos: contrato.precioPesos,
      precioUF: contrato.precioUF,
      comisionAsesor: contrato.comisionAsesor,
      estado: contrato.estado,
      fechaPagoReserva: contrato.fechaPagoReserva?.toISOString(),
      fechaPagoContrato: contrato.fechaPagoContrato?.toISOString(),
      fechaCheckin: contrato.fechaCheckin?.toISOString(),
      observaciones: contrato.observaciones,
      contratista: contrato.contratista,
      unidad: {
        id: contrato.unidad.id,
        numero: contrato.unidad.numero,
        precio: contrato.unidad.precio,
        estado: contrato.unidad.estado,
        edificio: contrato.unidad.edificio,
        tipoUnidad: {
          id: contrato.unidad.tipoUnidad.id,
          nombre: contrato.unidad.tipoUnidad.nombre,
          codigo: contrato.unidad.tipoUnidad.codigo,
          comision: contrato.unidad.tipoUnidad.comision
        }
      },
      createdAt: contrato.createdAt.toISOString(),
      updatedAt: contrato.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      contrato: contratoFormatted
    })

  } catch (error) {
    console.error('Error al obtener contrato:', error)
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
      fechaPagoContrato,
      fechaCheckin,
      observaciones
    } = body

    // Verificar que el contrato existe
    const existingContrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        unidad: true
      }
    })

    if (!existingContrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
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

    // Verificar que no existe otro contrato con el mismo número (excepto el actual)
    const conflictingContrato = await prisma.contrato.findFirst({
      where: {
        numero: parseInt(numero),
        id: { not: id }
      }
    })

    if (conflictingContrato) {
      return NextResponse.json(
        { error: 'Ya existe otro contrato con este número' },
        { status: 400 }
      )
    }

    // Actualizar estado de la unidad si el estado del contrato cambió
    const estadoActual = existingContrato.estado
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
        where: { id: existingContrato.unidadId },
        data: { estado: nuevoEstadoUnidad as any }
      })
    }

    // Actualizar contrato
    const updatedContrato = await prisma.contrato.update({
      where: { id },
      data: {
        numero: parseInt(numero),
        prioridad: prioridad || existingContrato.prioridad,
        rutCliente,
        nombreCliente,
        precioPesos: parseFloat(precioPesos),
        precioUF: parseFloat(precioUF),
        comisionAsesor: parseFloat(comisionAsesor),
        estado: nuevoEstado,
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : existingContrato.fechaPagoReserva,
        fechaPagoContrato: fechaPagoContrato ? new Date(fechaPagoContrato) : existingContrato.fechaPagoContrato,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : existingContrato.fechaCheckin,
        observaciones: observaciones !== undefined ? observaciones : existingContrato.observaciones
      },
      include: {
        contratista: {
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
      message: 'Contrato actualizado exitosamente',
      contrato: updatedContrato
    })

  } catch (error) {
    console.error('Error al actualizar contrato:', error)
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

    // Verificar que el contrato existe
    const existingContrato = await prisma.contrato.findUnique({
      where: { id },
      include: {
        unidad: true
      }
    })

    if (!existingContrato) {
      return NextResponse.json(
        { error: 'Contrato no encontrado' },
        { status: 404 }
      )
    }

    // Liberar la unidad (volver a DISPONIBLE)
    await prisma.unidad.update({
      where: { id: existingContrato.unidadId },
      data: { estado: 'DISPONIBLE' }
    })

    // Eliminar contrato
    await prisma.contrato.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Contrato eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar contrato:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}