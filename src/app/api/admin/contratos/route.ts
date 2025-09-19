import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const estado = searchParams.get('estado')
    const contratistaId = searchParams.get('contratistaId')
    const edificioId = searchParams.get('edificioId')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Construir filtros
    const whereClause: any = {}
    if (estado) whereClause.estado = estado
    if (contratistaId) whereClause.contratistaId = contratistaId
    if (edificioId) {
      whereClause.unidad = {
        edificioId: edificioId
      }
    }

    // Obtener contratos con relaciones
    const contratos = await prisma.contrato.findMany({
      where: whereClause,
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
      },
      orderBy: [
        { numero: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined,
      skip: offset ? parseInt(offset) : undefined
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
    }))

    // Obtener totales para estadísticas
    const totalContratos = await prisma.contrato.count({ where: whereClause })
    const estadisticas = await prisma.contrato.groupBy({
      by: ['estado'],
      where: whereClause,
      _count: true,
      _sum: {
        precioPesos: true,
        comisionAsesor: true
      }
    })

    return NextResponse.json({
      success: true,
      contratos: contratosFormatted,
      pagination: {
        total: totalContratos,
        limit: limit ? parseInt(limit) : totalContratos,
        offset: offset ? parseInt(offset) : 0
      },
      estadisticas: estadisticas.map(stat => ({
        estado: stat.estado,
        cantidad: stat._count,
        valorTotal: stat._sum.precioPesos || 0,
        comisionTotal: stat._sum.comisionAsesor || 0
      }))
    })

  } catch (error) {
    console.error('Error al obtener contratos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      observaciones,
      contratistaId,
      unidadId
    } = body

    // Validaciones básicas
    if (!numero || !rutCliente || !nombreCliente || !precioPesos || !precioUF || !comisionAsesor || !contratistaId || !unidadId) {
      return NextResponse.json(
        { error: 'Los campos requeridos son: numero, rutCliente, nombreCliente, precioPesos, precioUF, comisionAsesor, contratistaId, unidadId' },
        { status: 400 }
      )
    }

    // Verificar que no existe otro contrato con el mismo número
    const existingContrato = await prisma.contrato.findFirst({
      where: { numero: parseInt(numero) }
    })

    if (existingContrato) {
      return NextResponse.json(
        { error: 'Ya existe un contrato con este número' },
        { status: 400 }
      )
    }

    // Verificar que el contratista existe
    const contratista = await prisma.user.findUnique({
      where: { id: contratistaId }
    })

    if (!contratista) {
      return NextResponse.json(
        { error: 'Contratista no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la unidad existe y está disponible
    const unidad = await prisma.unidad.findUnique({
      where: { id: unidadId },
      include: {
        contratos: true
      }
    })

    if (!unidad) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      )
    }

    if (unidad.contratos.length > 0) {
      return NextResponse.json(
        { error: 'Esta unidad ya tiene un contrato asociado' },
        { status: 400 }
      )
    }

    // Crear contrato
    const newContrato = await prisma.contrato.create({
      data: {
        numero: parseInt(numero),
        prioridad: prioridad || 'BAJA',
        rutCliente,
        nombreCliente,
        precioPesos: parseFloat(precioPesos),
        precioUF: parseFloat(precioUF),
        comisionAsesor: parseFloat(comisionAsesor),
        estado: estado || 'POSTULACION',
        fechaPagoReserva: fechaPagoReserva ? new Date(fechaPagoReserva) : undefined,
        fechaPagoContrato: fechaPagoContrato ? new Date(fechaPagoContrato) : undefined,
        fechaCheckin: fechaCheckin ? new Date(fechaCheckin) : undefined,
        observaciones,
        contratistaId,
        unidadId
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

    // Actualizar estado de la unidad según el estado del contrato
    let nuevoEstadoUnidad = 'DISPONIBLE'
    if (estado === 'RESERVADO') nuevoEstadoUnidad = 'RESERVADA'
    else if (estado === 'CONTRATADO' || estado === 'CHECKIN_REALIZADO') nuevoEstadoUnidad = 'VENDIDA'

    await prisma.unidad.update({
      where: { id: unidadId },
      data: { estado: nuevoEstadoUnidad as any }
    })

    return NextResponse.json({
      success: true,
      message: 'Contrato creado exitosamente',
      contrato: newContrato
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear contrato:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}