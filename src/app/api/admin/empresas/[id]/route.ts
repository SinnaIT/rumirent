import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/empresas/' + id)

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

    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            edificios: true
          }
        },
        edificios: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    const empresaFormatted = {
      id: empresa.id,
      nombre: empresa.nombre,
      rut: empresa.rut,
      razonSocial: empresa.razonSocial,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      email: empresa.email,
      activa: empresa.activa,
      totalEdificios: empresa._count.edificios,
      edificios: empresa.edificios,
      createdAt: empresa.createdAt.toISOString(),
      updatedAt: empresa.updatedAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      empresa: empresaFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener empresa:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔄 PUT /api/admin/empresas/' + id)

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
    const {
      nombre,
      rut,
      razonSocial,
      direccion,
      telefono,
      email,
      activa
    } = body

    console.log('📝 Datos a actualizar:', { nombre, rut, razonSocial, direccion, telefono, email, activa })

    // Validaciones básicas
    if (!nombre || !rut || !razonSocial) {
      return NextResponse.json(
        { error: 'Nombre, RUT y razón social son requeridos' },
        { status: 400 }
      )
    }

    // Validar formato de RUT chileno (básico)
    const rutRegex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/
    if (!rutRegex.test(rut)) {
      return NextResponse.json(
        { error: 'Formato de RUT inválido. Debe ser: XX.XXX.XXX-X' },
        { status: 400 }
      )
    }

    // Verificar que la empresa existe
    const existingEmpresa = await prisma.empresa.findUnique({
      where: { id }
    })

    if (!existingEmpresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que no hay otra empresa con el mismo RUT (excluyendo la actual)
    const duplicateEmpresaByRut = await prisma.empresa.findFirst({
      where: {
        rut,
        id: { not: id }
      }
    })

    if (duplicateEmpresaByRut) {
      return NextResponse.json(
        { error: 'Ya existe otra empresa con este RUT' },
        { status: 400 }
      )
    }

    // Verificar que no hay otra empresa con el mismo nombre (excluyendo la actual)
    const duplicateEmpresaByName = await prisma.empresa.findFirst({
      where: {
        nombre,
        id: { not: id }
      }
    })

    if (duplicateEmpresaByName) {
      return NextResponse.json(
        { error: 'Ya existe otra empresa con este nombre' },
        { status: 400 }
      )
    }

    // Validar email si se proporciona
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Formato de email inválido' },
          { status: 400 }
        )
      }
    }

    // Actualizar empresa
    const updatedEmpresa = await prisma.empresa.update({
      where: { id },
      data: {
        nombre,
        rut,
        razonSocial,
        direccion: direccion || null,
        telefono: telefono || null,
        email: email || null,
        activa: activa !== undefined ? activa : true
      }
    })

    console.log('✅ Empresa actualizada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Empresa actualizada exitosamente',
      empresa: updatedEmpresa
    })

  } catch (error) {
    console.error('❌ Error al actualizar empresa:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🗑️ DELETE /api/admin/empresas/' + id)

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

    // Verificar que la empresa existe y obtener información sobre edificios
    const empresa = await prisma.empresa.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            edificios: true
          }
        }
      }
    })

    if (!empresa) {
      return NextResponse.json(
        { error: 'Empresa no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar empresas que tienen edificios asociados
    if (empresa._count.edificios > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una empresa que tiene edificios asociados' },
        { status: 400 }
      )
    }

    // Eliminar empresa
    await prisma.empresa.delete({
      where: { id }
    })

    console.log('✅ Empresa eliminada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Empresa eliminada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar empresa:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
