import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de contratista
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'CONTRATISTA') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener contratos del contratista
    const contratos = await prisma.contrato.findMany({
      where: {
        contratistaId: authResult.user.id
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const contratosFormatted = contratos.map(contrato => ({
      id: contrato.id,
      codigoUnidad: contrato.codigoUnidad,
      totalContrato: contrato.totalContrato,
      montoUf: contrato.montoUf,
      comision: contrato.comision,
      estado: contrato.estado,
      fechaPagoReserva: contrato.fechaPagoReserva?.toISOString(),
      fechaPagoContrato: contrato.fechaPagoContrato?.toISOString(),
      fechaCheckin: contrato.fechaCheckin?.toISOString(),
      observaciones: contrato.observaciones,
      cliente: contrato.cliente ? {
        id: contrato.cliente.id,
        nombre: contrato.cliente.nombre,
        rut: contrato.cliente.rut,
        email: contrato.cliente.email,
        telefono: contrato.cliente.telefono
      } : null,
      unidad: contrato.unidad ? {
        id: contrato.unidad.id,
        numero: contrato.unidad.numero,
        descripcion: contrato.unidad.descripcion,
        metros2: contrato.unidad.metros2,
        edificio: contrato.unidad.edificio,
        tipoUnidad: {
          id: contrato.unidad.tipoUnidadEdificio.id,
          nombre: contrato.unidad.tipoUnidadEdificio.nombre,
          codigo: contrato.unidad.tipoUnidadEdificio.codigo,
          comision: contrato.unidad.tipoUnidadEdificio.comision ? {
            id: contrato.unidad.tipoUnidadEdificio.comision.id,
            nombre: contrato.unidad.tipoUnidadEdificio.comision.nombre,
            codigo: contrato.unidad.tipoUnidadEdificio.comision.codigo,
            porcentaje: contrato.unidad.tipoUnidadEdificio.comision.porcentaje,
            activa: contrato.unidad.tipoUnidadEdificio.comision.activa
          } : null
        }
      } : null,
      edificio: contrato.edificio ? {
        id: contrato.edificio.id,
        nombre: contrato.edificio.nombre,
        direccion: contrato.edificio.direccion
      } : null,
      createdAt: contrato.createdAt.toISOString(),
      updatedAt: contrato.updatedAt.toISOString()
    }))

    // Calcular estadísticas
    const stats = {
      totalContratos: contratos.length,
      entregados: contratos.filter(c => c.estado === 'ENTREGADO').length,
      reservaPagada: contratos.filter(c => c.estado === 'RESERVA_PAGADA').length,
      aprobados: contratos.filter(c => c.estado === 'APROBADO').length,
      rechazados: contratos.filter(c => c.estado === 'RECHAZADO').length,
      totalComisionesEsperadas: contratos
        .filter(c => c.estado !== 'RECHAZADO')
        .reduce((sum, c) => sum + (c.comision || 0), 0),
      totalComisionesAprobadas: contratos
        .filter(c => c.estado === 'APROBADO')
        .reduce((sum, c) => sum + (c.comision || 0), 0)
    }

    return NextResponse.json({
      success: true,
      contratos: contratosFormatted,
      estadisticas: stats
    })

  } catch (error) {
    console.error('Error al obtener contratos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}