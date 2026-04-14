import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/admin/empresas')
    // Get tipo filter from query params
    const { searchParams } = new URL(request.url)
    const tipoParam = searchParams.get('tipo')

    // Obtener empresas con estadísticas de edificios
    const empresas = await prisma.empresa.findMany({
      where: tipoParam ? { tipoEntidad: tipoParam as 'CONSTRUCTORA' | 'INMOBILIARIA' | 'GESTORA' } : undefined,
      include: {
        _count: {
          select: {
            edificios: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('🏢 Empresas encontradas:', empresas.length)

    // Formatear datos con estadísticas calculadas
    const empresasFormatted = empresas.map(empresa => ({
      id: empresa.id,
      nombre: empresa.nombre,
      rut: empresa.rut,
      razonSocial: empresa.razonSocial,
      tipoEntidad: empresa.tipoEntidad,
      direccion: empresa.direccion,
      telefono: empresa.telefono,
      email: empresa.email,
      activa: empresa.activa,
      totalEdificios: empresa._count.edificios,
      createdAt: empresa.createdAt.toISOString(),
      updatedAt: empresa.updatedAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      empresas: empresasFormatted
    })

  } catch (error) {
    console.error('❌ Error al obtener empresas:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : '')
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      rut,
      razonSocial,
      tipoEntidad = 'COMPANY',
      direccion,
      telefono,
      email,
      activa = true
    } = body

    // Validaciones básicas
    if (!nombre || !rut || !razonSocial) {
      return NextResponse.json(
        { error: 'Nombre, RUT y razón social son requeridos' },
        { status: 400 }
      )
    }

    // Validar tipoEntidad
    if (tipoEntidad && !['COMPANY', 'INVESTOR'].includes(tipoEntidad)) {
      return NextResponse.json(
        { error: 'Tipo de entidad inválido. Debe ser COMPANY o INVESTOR' },
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

    // Verificar si ya existe una empresa con el mismo RUT
    const existingEmpresaByRut = await prisma.empresa.findUnique({
      where: { rut }
    })

    if (existingEmpresaByRut) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con este RUT' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una empresa con el mismo nombre
    const existingEmpresaByName = await prisma.empresa.findFirst({
      where: { nombre }
    })

    if (existingEmpresaByName) {
      return NextResponse.json(
        { error: 'Ya existe una empresa con este nombre' },
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

    // Crear empresa
    const newEmpresa = await prisma.empresa.create({
      data: {
        nombre,
        rut,
        razonSocial,
        tipoEntidad,
        direccion: direccion || null,
        telefono: telefono || null,
        email: email || null,
        activa
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Empresa creada exitosamente',
      empresa: newEmpresa
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear empresa:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
