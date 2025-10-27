import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/admin/edificios')

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      // Verificar autenticación y rol de administrador
      const authResult = await verifyAuth(request)
      console.log('🔐 Resultado de autenticación:', authResult)

      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        console.log('❌ No autorizado')
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    console.log('✅ Usuario autorizado, consultando edificios...')

    // Obtener edificios con estadísticas de unidades, comisión y empresa
    const edificios = await prisma.edificio.findMany({
      include: {
        _count: {
          select: {
            unidades: true
          }
        },
        unidades: {
          select: {
            estado: true,
            tipoUnidadEdificio: {
              select: {
                nombre: true,
                codigo: true
              }
            }
          }
        },
        comision: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true,
            activa: true
          }
        },
        empresa: {
          select: {
            id: true,
            nombre: true,
            rut: true,
            razonSocial: true,
            activa: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('🏢 Edificios encontrados:', edificios.length)

    // Formatear datos con estadísticas calculadas
    const edificiosFormatted = edificios.map(edificio => {
      const unidadesDisponibles = edificio.unidades.filter(u => u.estado === 'DISPONIBLE').length
      const unidadesVendidas = edificio.unidades.filter(u => u.estado === 'VENDIDA').length
      const unidadesReservadas = edificio.unidades.filter(u => u.estado === 'RESERVADA').length

      // Agrupar unidades por tipo
      const tiposUnidad = edificio.unidades.reduce((acc: Record<string, number>, unidad) => {
        const tipoNombre = unidad.tipoUnidadEdificio?.nombre || 'Sin tipo'
        acc[tipoNombre] = (acc[tipoNombre] || 0) + 1
        return acc
      }, {})

      return {
        id: edificio.id,
        nombre: edificio.nombre,
        direccion: edificio.direccion,
        comuna: edificio.comuna,
        ciudad: edificio.ciudad,
        region: edificio.region,
        codigoPostal: edificio.codigoPostal,
        descripcion: edificio.descripcion,
        comision: edificio.comision,
        empresa: edificio.empresa,
        totalUnidades: edificio._count.unidades,
        unidadesDisponibles,
        unidadesVendidas,
        unidadesReservadas,
        tiposUnidad: Object.entries(tiposUnidad).map(([tipo, cantidad]) => ({
          tipo,
          cantidad
        })),
        createdAt: edificio.createdAt.toISOString(),
        updatedAt: edificio.updatedAt.toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      edificios: edificiosFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener edificios:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación para POST')
    } else {
      // Verificar autenticación y rol de administrador
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const {
      nombre,
      direccion,
      comuna,
      ciudad,
      region,
      codigoPostal,
      urlGoogleMaps,
      telefono,
      email,
      descripcion,
      comisionId,
      empresaId
    } = body

    // Validaciones básicas
    if (!nombre || !direccion || !comuna || !ciudad || !region) {
      return NextResponse.json(
        { error: 'Nombre, dirección, comuna, ciudad y región son requeridos' },
        { status: 400 }
      )
    }

    if (!comisionId) {
      return NextResponse.json(
        { error: 'ID de comisión es requerido' },
        { status: 400 }
      )
    }

    if (!empresaId) {
      return NextResponse.json(
        { error: 'ID de empresa es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un edificio con el mismo nombre
    const existingEdificio = await prisma.edificio.findFirst({
      where: { nombre }
    })

    if (existingEdificio) {
      return NextResponse.json(
        { error: 'Ya existe un edificio con este nombre' },
        { status: 400 }
      )
    }

    // Crear edificio
    const newEdificio = await prisma.edificio.create({
      data: {
        nombre,
        direccion,
        comuna,
        ciudad,
        region,
        codigoPostal: codigoPostal || null,
        urlGoogleMaps: urlGoogleMaps || null,
        telefono: telefono || null,
        email: email || null,
        descripcion: descripcion || null,
        comisionId,
        empresaId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Edificio creado exitosamente',
      edificio: newEdificio
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear edificio:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}