import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { verifyAuth } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Buscar usuario admin
    const admin = await prisma.user.findFirst({
      where: {
        id,
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
      }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Usuario admin no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: admin
    })

  } catch (error) {
    console.error('Error al obtener usuario admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { email, nombre, rut, telefono, birthDate, password } = body

    // Validaciones básicas
    if (!nombre || !rut || !email) {
      return NextResponse.json(
        { error: 'Nombre, RUT y email son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe y es admin
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN'
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario admin no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el email ya existe en otro usuario
    if (email !== existingUser.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      })

      if (existingEmail) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este email' },
          { status: 400 }
        )
      }
    }

    // Verificar si el RUT ya existe en otro usuario
    if (rut !== existingUser.rut) {
      const existingRut = await prisma.user.findFirst({
        where: {
          rut,
          id: { not: id }
        }
      })

      if (existingRut) {
        return NextResponse.json(
          { error: 'Ya existe un usuario con este RUT' },
          { status: 400 }
        )
      }
    }

    // Preparar datos de actualización
    const updateData: {
      email: string
      nombre: string
      rut: string
      telefono: string | null
      birthDate: Date | null
      updatedAt: Date
      password?: string
      mustChangePassword?: boolean
      lastPasswordChange?: Date
    } = {
      email,
      nombre,
      rut,
      telefono: telefono || null,
      birthDate: birthDate ? new Date(birthDate) : null,
      updatedAt: new Date()
    }

    // Si se proporciona contraseña, hashearla y forzar cambio
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12)
      // Cuando admin cambia password, forzar cambio en próximo login
      updateData.mustChangePassword = true
      updateData.lastPasswordChange = new Date()
    }

    // Actualizar usuario
    const updatedAdmin = await prisma.user.update({
      where: { id },
      data: updateData,
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
      message: 'Usuario admin actualizado exitosamente',
      usuario: updatedAdmin
    })

  } catch (error) {
    console.error('Error al actualizar usuario admin:', error)

    // Manejar errores específicos de Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint failed')) {
        if (error.message.includes('rut')) {
          return NextResponse.json(
            { error: 'Ya existe un usuario con este RUT' },
            { status: 400 }
          )
        }
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { id } = params

    // Verificar que el usuario existe y es admin
    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        role: 'ADMIN'
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario admin no encontrado' },
        { status: 404 }
      )
    }

    // Prevenir que un admin se elimine a sí mismo
    if (existingUser.id === authResult.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propio usuario' },
        { status: 400 }
      )
    }

    // Verificar que no sea el último admin
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    })

    if (adminCount <= 1) {
      return NextResponse.json(
        { error: 'No se puede eliminar el último usuario administrador' },
        { status: 400 }
      )
    }

    // Eliminar usuario
    await prisma.user.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Usuario admin eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error al eliminar usuario admin:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}