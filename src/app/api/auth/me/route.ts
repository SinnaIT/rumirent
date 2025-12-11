import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Check both cookie and Authorization header
    const cookieStore = await cookies()
    const cookieToken = cookieStore.get('auth-token')?.value
    const authHeader = request.headers.get('Authorization')
    const headerToken = authHeader?.replace('Bearer ', '')

    const token = cookieToken || headerToken
    console.log('Cookie token:', !!cookieToken)
    console.log('Header token:', !!headerToken)
    console.log('Final token:', !!token)

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      role: string
    }

    console.log(decoded)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        nombre: true,
        role: true,
        mustChangePassword: true
      }
    })

    console.log(user)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error getting user data:', error)
    return NextResponse.json(
      { error: 'Token inválido' },
      { status: 401 }
    )
  }
}