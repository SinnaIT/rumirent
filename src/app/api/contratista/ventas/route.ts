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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const contratosFormatted = contratos.map(contrato => ({
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
      unidadManual: contrato.unidadManual,
      observaciones: contrato.observaciones,
      unidad: contrato.unidad ? {
        id: contrato.unidad.id,
        numero: contrato.unidad.numero,
        descripcion: contrato.unidad.descripcion,
        metros2: contrato.unidad.metros2,
        edificio: contrato.unidad.edificio,
        tipoUnidad: {
          id: contrato.unidad.tipoUnidad.id,
          nombre: contrato.unidad.tipoUnidad.nombre,
          codigo: contrato.unidad.tipoUnidad.codigo,
          comision: {
            id: contrato.unidad.tipoUnidad.comision.id,
            nombre: contrato.unidad.tipoUnidad.comision.nombre,
            codigo: contrato.unidad.tipoUnidad.comision.codigo,
            porcentaje: contrato.unidad.tipoUnidad.comision.porcentaje,
            activa: contrato.unidad.tipoUnidad.comision.activa
          }
        }
      } : null,
      createdAt: contrato.createdAt.toISOString(),
      updatedAt: contrato.updatedAt.toISOString()
    }))

    // Calcular estadísticas
    const stats = {
      totalContratos: contratos.length,
      postulaciones: contratos.filter(c => c.estado === 'POSTULACION').length,
      reservados: contratos.filter(c => c.estado === 'RESERVADO').length,
      contratados: contratos.filter(c => c.estado === 'CONTRATADO').length,
      checkinRealizados: contratos.filter(c => c.estado === 'CHECKIN_REALIZADO').length,
      cancelados: contratos.filter(c => c.estado === 'CANCELADO').length,
      totalComisionesEsperadas: contratos
        .filter(c => c.estado !== 'CANCELADO')
        .reduce((sum, c) => sum + c.comisionAsesor, 0),
      totalComisionesRealizadas: contratos
        .filter(c => c.estado === 'CHECKIN_REALIZADO')
        .reduce((sum, c) => sum + c.comisionAsesor, 0)
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