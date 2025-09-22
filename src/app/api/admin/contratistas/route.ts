import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
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

    // Obtener todos los contratistas con estadísticas
    const contratistas = await prisma.user.findMany({
      where: {
        role: 'CONTRATISTA'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        activo: true,
        createdAt: true,
        _count: {
          select: {
            contratos: true
          }
        },
        contratos: {
          select: {
            comision: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatear datos con estadísticas calculadas
    const contratistasFormatted = contratistas.map(contratista => ({
      id: contratista.id,
      email: contratista.email,
      nombre: contratista.nombre,
      telefono: contratista.telefono,
      activo: contratista.activo,
      ventasRealizadas: contratista._count.contratos,
      comisionesTotales: contratista.contratos.reduce((total, contrato) => total + (contrato.comision || 0), 0),
      createdAt: contratista.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      contratistas: contratistasFormatted
    })

  } catch (error) {
    console.error('Error al obtener contratistas:', error)
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
    const { email, nombre, telefono, password } = body

    // Validaciones básicas
    if (!email || !nombre || !password) {
      return NextResponse.json(
        { error: 'Email, nombre y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Crear contraseña hasheada
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear contratista
    const newContratista = await prisma.user.create({
      data: {
        email,
        nombre,
        telefono: telefono || undefined,
        password: hashedPassword,
        role: 'CONTRATISTA',
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        activo: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Contratista creado exitosamente',
      contratista: newContratista
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear contratista:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}