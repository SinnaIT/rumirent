import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/edificios/' + id + '/tipos-unidad')

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id: id }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los tipos de unidad del edificio
    const tiposUnidad = await prisma.tipoUnidadEdificio.findMany({
      where: { edificioId: id },
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
        _count: {
          select: {
            unidades: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      tiposUnidad
    })

  } catch (error) {
    console.error('❌ Error al obtener tipos de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('➕ POST /api/admin/edificios/' + id + '/tipos-unidad')

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { nombre, codigo, comisionId } = body

    console.log('📝 Datos del nuevo tipo de unidad:', { nombre, codigo, comisionId })
    console.log('📝 Comisión procesada:', comisionId === 'none' || !comisionId ? null : comisionId)

    // Validaciones básicas
    if (!nombre || !codigo) {
      return NextResponse.json(
        { error: 'Nombre y código son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id: id }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que la comisión existe (si se proporciona)
    if (comisionId && comisionId !== 'none') {
      const comision = await prisma.comision.findUnique({
        where: { id: comisionId }
      })

      if (!comision) {
        return NextResponse.json(
          { error: 'La comisión especificada no existe' },
          { status: 400 }
        )
      }
    }

    // Verificar que no hay otro tipo de unidad con el mismo código en este edificio
    const existingTipoUnidad = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        edificioId: id,
        codigo
      }
    })

    if (existingTipoUnidad) {
      return NextResponse.json(
        { error: 'Ya existe un tipo de unidad con este código en este edificio' },
        { status: 400 }
      )
    }

    // Crear tipo de unidad
    const nuevoTipoUnidad = await prisma.tipoUnidadEdificio.create({
      data: {
        nombre,
        codigo,
        comisionId: comisionId === 'none' || !comisionId ? null : comisionId,
        edificioId: id
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
        _count: {
          select: {
            unidades: true
          }
        }
      }
    })

    console.log('✅ Tipo de unidad creado exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Tipo de unidad creado exitosamente',
      tipoUnidad: nuevoTipoUnidad
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error al crear tipo de unidad:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}