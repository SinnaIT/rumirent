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

    // Obtener todas las comisiones activas
    const comisiones = await prisma.comision.findMany({
      where: {
        activa: true
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        porcentaje: true,
        activa: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      comisiones
    })

  } catch (error) {
    console.error('Error al obtener comisiones:', error)
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
    const { nombre, codigo, porcentaje } = body

    // Validaciones básicas
    if (!nombre || !codigo || porcentaje === undefined) {
      return NextResponse.json(
        { error: 'Nombre, código y porcentaje son requeridos' },
        { status: 400 }
      )
    }

    if (porcentaje < 0 || porcentaje > 1) {
      return NextResponse.json(
        { error: 'El porcentaje debe estar entre 0 y 1' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una comisión con el mismo nombre o código
    const existingComision = await prisma.comision.findFirst({
      where: {
        OR: [
          { nombre },
          { codigo }
        ]
      }
    })

    if (existingComision) {
      return NextResponse.json(
        { error: 'Ya existe una comisión con este nombre o código' },
        { status: 400 }
      )
    }

    // Crear comisión
    const newComision = await prisma.comision.create({
      data: {
        nombre,
        codigo,
        porcentaje,
        activa: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Comisión creada exitosamente',
      comision: newComision
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}