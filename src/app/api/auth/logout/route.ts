import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Eliminar el token JWT
    cookieStore.delete('auth-token')

    return NextResponse.json(
      { message: 'Sesión cerrada exitosamente' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}