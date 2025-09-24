import { NextRequest, NextResponse } from 'next/server'
import { comparePasswords, generateToken } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generate JWT token
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'ADMIN' | 'BROKER'
    })

    console.log('Generated token:', token.substring(0, 50) + '...')
    console.log('NODE_ENV:', process.env.NODE_ENV)

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role
      },
      token: token // Also return token for manual cookie setting
    })

    // Set auth cookie with simpler options for development
    console.log('Setting cookie with token')
    response.cookies.set('auth-token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
      // Remove httpOnly and secure for development testing
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}