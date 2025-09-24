import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  email: string
  role: 'ADMIN' | 'BROKER'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET)
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    console.log('[AUTH] Verifying token:', token.substring(0, 50) + '...')
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const jwtPayload = payload as JWTPayload
    console.log('[AUTH] Token payload:', jwtPayload)

    // Verificar que el usuario aún existe en la base de datos
    console.log('[AUTH] Checking user exists in DB:', jwtPayload.userId)
    const userExists = await prisma.user.findUnique({
      where: { id: jwtPayload.userId }
    })
    console.log('[AUTH] User exists:', !!userExists)

    if (!userExists) {
      console.log('[AUTH] User not found in DB')
      return null
    }

    console.log('[AUTH] Token verification successful')
    return jwtPayload
  } catch (error) {
    console.log('[AUTH] Token verification failed:', error)
    return null
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')
  return token?.value || null
}

export async function removeAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth-token')
}

export async function getCurrentUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken()
  if (!token) return null

  return await verifyToken(token)
}

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email: string
    role: 'ADMIN' | 'BROKER'
  }
  error?: string
}

export async function verifyAuth(request: Request): Promise<AuthResult> {
  try {
    const token = await getAuthToken()

    if (!token) {
      return {
        success: false,
        error: 'Token no encontrado'
      }
    }

    const user = await verifyToken(token)

    if (!user) {
      return {
        success: false,
        error: 'Token inválido'
      }
    }

    return {
      success: true,
      user: {
        id: user.userId,
        email: user.email,
        role: user.role
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error de autenticación'
    }
  }
}