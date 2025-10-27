import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación (solo desarrollo, en producción verificar rol ADMIN)
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const tiposCaracteristica = await prisma.tipoCaracteristica.findMany({
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      tiposCaracteristica
    })

  } catch (error) {
    console.error('Error al obtener tipos de característica:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const body = await request.json()
    const { nombre, descripcion, activo } = body

    // Validaciones
    if (!nombre || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe
    const existing = await prisma.tipoCaracteristica.findUnique({
      where: { nombre }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un tipo de característica con este nombre' },
        { status: 400 }
      )
    }

    // Crear tipo de característica
    const tipoCaracteristica = await prisma.tipoCaracteristica.create({
      data: {
        nombre,
        descripcion: descripcion || null,
        activo: activo !== undefined ? activo : true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Tipo de característica creado exitosamente',
      tipoCaracteristica
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear tipo de característica:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
