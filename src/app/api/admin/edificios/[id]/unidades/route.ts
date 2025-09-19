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

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Obtener unidades del edificio
    const unidades = await prisma.unidad.findMany({
      where: { edificioId: id },
      orderBy: [
        { tipo: 'asc' },
        { numero: 'asc' }
      ]
    })

    // Obtener estadísticas por tipo de unidad
    const estadisticasPorTipo = await prisma.unidad.groupBy({
      by: ['tipo', 'estado'],
      where: { edificioId: id },
      _count: {
        id: true
      },
      _sum: {
        precio: true
      }
    })

    // Formatear estadísticas
    const resumenTipos: Record<string, any> = {}

    estadisticasPorTipo.forEach(stat => {
      if (!resumenTipos[stat.tipo]) {
        resumenTipos[stat.tipo] = {
          tipo: stat.tipo,
          total: 0,
          disponibles: 0,
          vendidas: 0,
          reservadas: 0,
          valorTotal: 0
        }
      }

      resumenTipos[stat.tipo].total += stat._count.id
      resumenTipos[stat.tipo].valorTotal += stat._sum.precio || 0

      switch (stat.estado) {
        case 'DISPONIBLE':
          resumenTipos[stat.tipo].disponibles = stat._count.id
          break
        case 'VENDIDA':
          resumenTipos[stat.tipo].vendidas = stat._count.id
          break
        case 'RESERVADA':
          resumenTipos[stat.tipo].reservadas = stat._count.id
          break
      }
    })

    return NextResponse.json({
      success: true,
      edificio,
      unidades,
      resumenTipos: Object.values(resumenTipos)
    })

  } catch (error) {
    console.error('Error al obtener unidades del edificio:', error)
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

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { numero, tipo, precio, descripcion, metros2, prioridad } = body

    // Validaciones básicas
    if (!numero || !tipo || !precio) {
      return NextResponse.json(
        { error: 'Número, tipo y precio son requeridos' },
        { status: 400 }
      )
    }

    if (precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Verificar que el edificio existe
    const edificio = await prisma.edificio.findUnique({
      where: { id }
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Edificio no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe una unidad con el mismo número en el edificio
    const existingUnidad = await prisma.unidad.findUnique({
      where: {
        edificioId_numero: {
          edificioId: id,
          numero
        }
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
        descripcion: descripcion || undefined,
        metros2: metros2 || undefined,
        prioridad: prioridad || 'BAJA',
        edificioId: id
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