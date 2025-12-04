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

    // Obtener todos los usuarios admin
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        birthDate: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      usuarios: admins
    })

  } catch (error) {
    console.error('Error al obtener usuarios admin:', error)
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
    const { email, nombre, rut, telefono, birthDate, password } = body

    // Validaciones básicas
    if (!email || !nombre || !rut || !password) {
      return NextResponse.json(
        { error: 'Email, nombre, RUT y contraseña son requeridos' },
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
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      )
    }

    // Verificar si el RUT ya existe
    const existingRut = await prisma.user.findUnique({
      where: { rut }
    })

    if (existingRut) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este RUT' },
        { status: 400 }
      )
    }

    // Crear contraseña hasheada
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear usuario admin
    const newAdmin = await prisma.user.create({
      data: {
        email,
        nombre,
        rut,
        telefono: telefono || undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        password: hashedPassword,
        role: 'ADMIN',
        activo: true,
        mustChangePassword: true,
        lastPasswordChange: null
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        birthDate: true,
        activo: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario admin creado exitosamente',
      usuario: newAdmin
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear usuario admin:', error)

    // Manejar errores específicos de Prisma
    if (error instanceof Error) {
      // Error de constraint único en Prisma
      if (error.message.includes('Unique constraint failed')) {
        if (error.message.includes('email')) {
          return NextResponse.json(
            { error: 'Ya existe un usuario con este email' },
            { status: 400 }
          )
        }
        if (error.message.includes('rut')) {
          return NextResponse.json(
            { error: 'Ya existe un usuario con este RUT' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Ya existe un usuario con estos datos' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}