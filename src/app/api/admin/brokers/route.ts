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

    // Obtener todos los brokers con estadísticas
    const brokers = await prisma.user.findMany({
      where: {
        role: 'BROKER'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        activo: true,
        createdAt: true,
        _count: {
          select: {
            leads: true
          }
        },
        leads: {
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
    const brokersFormatted = brokers.map(broker => ({
      id: broker.id,
      email: broker.email,
      nombre: broker.nombre,
      rut: broker.rut,
      telefono: broker.telefono,
      activo: broker.activo,
      ventasRealizadas: broker._count.leads,
      comisionesTotales: broker.leads.reduce((total, lead) => total + (lead.comision || 0), 0),
      createdAt: broker.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      brokers: brokersFormatted
    })

  } catch (error) {
    console.error('Error al obtener brokers:', error)
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
    const { email, nombre, rut, telefono, password } = body

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

    // Crear broker
    const newbroker = await prisma.user.create({
      data: {
        email,
        nombre,
        rut,
        telefono: telefono || undefined,
        password: hashedPassword,
        role: 'BROKER',
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rut: true,
        telefono: true,
        activo: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'broker creado exitosamente',
      broker: newbroker
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear broker:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}