import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/admin/comisiones/reglas')

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

    const { searchParams } = new URL(request.url)
    const comisionId = searchParams.get('comisionId')

    let whereClause = {}
    if (comisionId) {
      whereClause = { comisionId }
    }

    const reglasComision = await prisma.reglaComision.findMany({
      where: whereClause,
      include: {
        comision: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        }
      },
      orderBy: [
        { cantidadMinima: 'asc' }
      ]
    })

    console.log(`✅ Found ${reglasComision.length} reglas de comisión`)

    return NextResponse.json({
      success: true,
      reglas: reglasComision
    })

  } catch (error) {
    console.error('❌ Error al obtener reglas de comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/admin/comisiones/reglas')

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
    const { cantidadMinima, cantidadMaxima, porcentaje, comisionId } = body

    console.log('📋 Datos recibidos:', body)

    // Validaciones básicas
    if (!cantidadMinima || !porcentaje || !comisionId) {
      return NextResponse.json(
        { error: 'Cantidad mínima, porcentaje y comisión son requeridos' },
        { status: 400 }
      )
    }

    if (cantidadMinima < 0) {
      return NextResponse.json(
        { error: 'La cantidad mínima debe ser mayor o igual a 0' },
        { status: 400 }
      )
    }

    if (cantidadMaxima && cantidadMaxima <= cantidadMinima) {
      return NextResponse.json(
        { error: 'La cantidad máxima debe ser mayor que la cantidad mínima' },
        { status: 400 }
      )
    }

    if (porcentaje < 0 || porcentaje > 1) {
      return NextResponse.json(
        { error: 'El porcentaje debe estar entre 0 y 1' },
        { status: 400 }
      )
    }

    // Verificar que la comisión existe
    const comisionExists = await prisma.comision.findUnique({
      where: { id: comisionId }
    })

    if (!comisionExists) {
      return NextResponse.json(
        { error: 'La comisión especificada no existe' },
        { status: 400 }
      )
    }

    // Verificar solapamiento de rangos para la misma comisión
    const existingRules = await prisma.reglaComision.findMany({
      where: { comisionId }
    })

    for (const rule of existingRules) {
      const ruleMax = rule.cantidadMaxima || Infinity
      const newMax = cantidadMaxima || Infinity

      // Verificar solapamiento
      const overlap = (cantidadMinima < ruleMax) && (newMax > rule.cantidadMinima)

      if (overlap) {
        return NextResponse.json(
          { error: 'Los rangos de cantidad no pueden solaparse con reglas existentes' },
          { status: 400 }
        )
      }
    }

    // Crear regla de comisión
    const newRegla = await prisma.reglaComision.create({
      data: {
        cantidadMinima: parseFloat(cantidadMinima),
        cantidadMaxima: cantidadMaxima ? parseFloat(cantidadMaxima) : null,
        porcentaje: parseFloat(porcentaje),
        comisionId
      },
      include: {
        comision: {
          select: {
            id: true,
            nombre: true,
            codigo: true
          }
        }
      }
    })

    console.log('✅ Regla de comisión creada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Regla de comisión creada exitosamente',
      regla: newRegla
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Error al crear regla de comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}