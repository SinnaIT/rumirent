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
        tiposUnidad: {
          include: {
            comision: true
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
        imagenes: {
          orderBy: {
            orden: 'asc'
          }
        },
        caracteristicas: {
          include: {
            tipoCaracteristica: true
          },
          orderBy: {
            nombre: 'asc'
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
      urlGoogleMaps: proyecto.urlGoogleMaps,
      telefono: proyecto.telefono,
      email: proyecto.email,
      comision: proyecto.comision,
      totalUnidades: proyecto._count.unidades,
      unidadesDisponibles: proyecto.unidades.length,
      imagenes: proyecto.imagenes.map(img => ({
        id: img.id,
        url: img.url,
        descripcion: img.descripcion,
        orden: img.orden
      })),
      caracteristicas: proyecto.caracteristicas.map(car => ({
        id: car.id,
        nombre: car.nombre,
        valor: car.valor,
        icono: car.icono,
        tipoIcono: car.tipoIcono,
        mostrarEnResumen: car.mostrarEnResumen,
        tipoCaracteristica: {
          id: car.tipoCaracteristica.id,
          nombre: car.tipoCaracteristica.nombre,
          descripcion: car.tipoCaracteristica.descripcion
        }
      })),
      tiposUnidad: proyecto.tiposUnidad.map(tipo => ({
        id: tipo.id,
        nombre: tipo.nombre,
        codigo: tipo.codigo,
        bedrooms: tipo.bedrooms,
        bathrooms: tipo.bathrooms,
        comision: tipo.comision ? {
          id: tipo.comision.id,
          nombre: tipo.comision.nombre,
          codigo: tipo.comision.codigo,
          porcentaje: tipo.comision.porcentaje,
          activa: tipo.comision.activa
        } : null
      })),
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