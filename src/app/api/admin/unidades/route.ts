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
    const edificioId = searchParams.get('edificioId')
    const tipo = searchParams.get('tipo')

    // Construir filtros
    const whereClause: any = {}
    if (edificioId) whereClause.edificioId = edificioId
    if (tipo) whereClause.tipo = tipo

    // Obtener todas las unidades
    const unidades = await prisma.unidad.findMany({
      where: whereClause,
      include: {
        edificio: {
          select: {
            id: true,
            nombre: true,
            direccion: true
          }
        }
      },
      orderBy: [
        { edificio: { nombre: 'asc' } },
        { numero: 'asc' }
      ]
    })

    const unidadesFormatted = unidades.map(unidad => ({
      id: unidad.id,
      numero: unidad.numero,
      tipo: unidad.tipo,
      precio: unidad.precio,
      estado: unidad.estado,
      prioridad: unidad.prioridad,
      descripcion: unidad.descripcion,
      metros2: unidad.metros2,
      edificioId: unidad.edificioId,
      edificio: unidad.edificio,
      createdAt: unidad.createdAt.toISOString(),
      updatedAt: unidad.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      unidades: unidadesFormatted
    })

  } catch (error) {
    console.error('Error al obtener unidades:', error)
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
    const { numero, tipo, precio, estado, prioridad, descripcion, metros2, edificioId } = body

    // Validaciones básicas
    if (!numero || !tipo || !precio || !edificioId) {
      return NextResponse.json(
        { error: 'Número, tipo, precio y edificio son requeridos' },
        { status: 400 }
      )
    }

    if (precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (metros2 && metros2 <= 0) {
      return NextResponse.json(
        { error: 'Los metros cuadrados deben ser mayor a 0' },
        { status: 400 }
      )
    }

    // Validar tipo de unidad
    const tiposValidos = ['STUDIO', 'UN_DORMITORIO', 'DOS_DORMITORIOS', 'TRES_DORMITORIOS', 'PENTHOUSE']
    if (!tiposValidos.includes(tipo)) {
      return NextResponse.json(
        { error: 'Tipo de unidad no válido' },
        { status: 400 }
      )
    }

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id: edificioId }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe una unidad con el mismo número en el edificio
    const existingUnidad = await prisma.unidad.findFirst({
      where: {
        edificioId,
        numero
      }
    })

    if (existingUnidad) {
      return NextResponse.json(
        { error: 'Ya existe una unidad con este número en el edificio' },
        { status: 400 }
      )
    }

    // Crear nueva unidad
    const newUnidad = await prisma.unidad.create({
      data: {
        numero,
        tipo,
        precio,
        estado: estado || 'DISPONIBLE',
        prioridad: prioridad || 'BAJA',
        descripcion: descripcion || undefined,
        metros2: metros2 || undefined,
        edificioId
      },
      include: {
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
      message: 'Unidad creada exitosamente',
      unidad: newUnidad
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}