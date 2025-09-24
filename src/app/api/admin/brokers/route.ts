import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Iniciando GET /api/admin/brokers')

    // En desarrollo, omitir verificación de autenticación por ahora
    if (process.env.NODE_ENV === 'development') {
      console.log('🛠️ Modo desarrollo - omitiendo autenticación')
    } else {
      // Verificar autenticación y rol de administrador
      const authResult = await verifyAuth(request)
      console.log('🔐 Resultado de autenticación:', authResult)

      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        console.log('❌ No autorizado')
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    console.log('✅ Usuario autorizado, consultando brokers...')

    // Obtener brokers activos
    const brokers = await prisma.user.findMany({
      where: {
        role: 'CONTRATISTA',
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rut: true
      },
      orderBy: {
        nombre: 'asc'
      }
    })

    console.log('👥 Brokers encontrados:', brokers.length)

    return NextResponse.json({
      success: true,
      brokers
    })

  } catch (error) {
    console.error('❌ Error al obtener brokers:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}