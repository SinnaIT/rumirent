import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('🔍 GET /api/admin/comisiones/reglas/' + id)

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

    const regla = await prisma.reglaComision.findUnique({
      where: { id },
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

    if (!regla) {
      return NextResponse.json(
        { error: 'Regla de comisión no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      regla
    })

  } catch (error) {
    console.error('❌ Error al obtener regla de comisión:', error)
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
    console.log('🔄 PUT /api/admin/comisiones/reglas/' + id)

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

    console.log('📝 Datos a actualizar:', body)

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

    // Verificar que la regla existe
    const existingRule = await prisma.reglaComision.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Regla de comisión no encontrada' },
        { status: 404 }
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

    // Verificar solapamiento de rangos para la misma comisión (excluyendo la regla actual)
    const existingRules = await prisma.reglaComision.findMany({
      where: {
        comisionId,
        id: { not: id } // Excluir la regla actual
      }
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

    // Actualizar regla
    const updatedRegla = await prisma.reglaComision.update({
      where: { id },
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

    console.log('✅ Regla de comisión actualizada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Regla de comisión actualizada exitosamente',
      regla: updatedRegla
    })

  } catch (error) {
    console.error('❌ Error al actualizar regla de comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
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
    console.log('🗑️ DELETE /api/admin/comisiones/reglas/' + id)

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

    // Verificar que la regla existe
    const existingRule = await prisma.reglaComision.findUnique({
      where: { id }
    })

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Regla de comisión no encontrada' },
        { status: 404 }
      )
    }

    // Eliminar regla
    await prisma.reglaComision.delete({
      where: { id }
    })

    console.log('✅ Regla de comisión eliminada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Regla de comisión eliminada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error al eliminar regla de comisión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}