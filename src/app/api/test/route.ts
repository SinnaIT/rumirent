import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connection...')

    // Prueba simple de conexión
    const edificiosCount = await prisma.edificio.count()
    console.log('📊 Edificios count:', edificiosCount)

    // Consulta simple
    const edificios = await prisma.edificio.findMany({
      select: {
        id: true,
        nombre: true,
        direccion: true,
        estado: true
      }
    })
    console.log('🏢 Edificios simple query:', edificios)

    return NextResponse.json({
      success: true,
      message: 'Database connection works!',
      edificiosCount,
      edificios
    })

  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error.message },
      { status: 500 }
    )
  }
}