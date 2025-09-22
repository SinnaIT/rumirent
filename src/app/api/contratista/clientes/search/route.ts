import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y rol de contratista
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'CONTRATISTA') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const rut = searchParams.get('rut')

    if (!rut) {
      return NextResponse.json(
        { error: 'RUT es requerido' },
        { status: 400 }
      )
    }

    // Buscar cliente por RUT (solo clientes del contratista actual)
    const cliente = await prisma.cliente.findFirst({
      where: {
        rut: rut.trim(),
        contratistaId: authResult.user.id
      }
    })

    if (cliente) {
      return NextResponse.json({
        success: true,
        cliente
      })
    } else {
      return NextResponse.json({
        success: true,
        cliente: null,
        message: 'Cliente no encontrado'
      })
    }

  } catch (error) {
    console.error('Error al buscar cliente:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}