import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de broker
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener proyectos con unidades disponibles
    const proyectos = await prisma.edificio.findMany({
      where: {
        unidades: {
          some: {
            estado: 'DISPONIBLE'
          }
        }
      },
      include: {
        comision: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true,
            activa: true
          }
        },
        unidades: {
          where: {
            estado: 'DISPONIBLE'
          },
          include: {
            tipoUnidadEdificio: {
              include: {
                comision: true
              }
            }
          },
          orderBy: {
            numero: 'asc'
          }
        },
        _count: {
          select: {
            unidades: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    const proyectosFormatted = proyectos.map(proyecto => ({
      id: proyecto.id,
      nombre: proyecto.nombre,
      direccion: proyecto.direccion,
      descripcion: proyecto.descripcion,
      estado: proyecto.estado,
      comision: proyecto.comision,
      totalUnidades: proyecto._count.unidades,
      unidadesDisponibles: proyecto.unidades.length,
      unidades: proyecto.unidades.map(unidad => ({
        id: unidad.id,
        numero: unidad.numero,
        estado: unidad.estado,
        descripcion: unidad.descripcion,
        metros2: unidad.metros2,
        tipoUnidad: {
          id: unidad.tipoUnidadEdificio.id,
          nombre: unidad.tipoUnidadEdificio.nombre,
          codigo: unidad.tipoUnidadEdificio.codigo,
          comision: unidad.tipoUnidadEdificio.comision ? {
            id: unidad.tipoUnidadEdificio.comision.id,
            nombre: unidad.tipoUnidadEdificio.comision.nombre,
            codigo: unidad.tipoUnidadEdificio.comision.codigo,
            porcentaje: unidad.tipoUnidadEdificio.comision.porcentaje,
            activa: unidad.tipoUnidadEdificio.comision.activa
          } : null
        },
        createdAt: unidad.createdAt.toISOString(),
        updatedAt: unidad.updatedAt.toISOString()
      })),
      createdAt: proyecto.createdAt.toISOString(),
      updatedAt: proyecto.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      proyectos: proyectosFormatted
    })

  } catch (error) {
    console.error('Error al obtener proyectos:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}