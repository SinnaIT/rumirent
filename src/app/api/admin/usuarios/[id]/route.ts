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
    const { nombre, rut, telefono, password } = body

    // Validaciones básicas
    if (!nombre || !rut) {
      return NextResponse.json(
        { error: 'Nombre y RUT son requeridos' },
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

    // Prevenir que un admin se elimine a sí mismo
    if (existingUser.id === authResult.user.id) {
      return NextResponse.json(
        { error: 'No puedes modificar tu propio usuario desde esta pantalla' },
        { status: 400 }
      )
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
    const updateData: any = {
      nombre,
      rut,
      telefono: telefono || null,
      updatedAt: new Date()
    }

    // Si se proporciona contraseña, hashearla
    if (password && password.length >= 6) {
      updateData.password = await bcrypt.hash(password, 12)
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