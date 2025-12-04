import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
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

// Lightweight token verification for middleware (no DB access - Edge Runtime compatible)
export async function verifyTokenLight(token: string): Promise<JWTPayload | null> {
  try {
    console.log('[AUTH] Verifying token (light):', token.substring(0, 50) + '...')
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const jwtPayload = payload as JWTPayload
    console.log('[AUTH] Token payload:', jwtPayload)
    console.log('[AUTH] Token verification successful')
    return jwtPayload
  } catch (error) {
    console.log('[AUTH] Token verification failed:', error)
    return null
  }
}

// Full token verification with DB check (for API routes - Node.js runtime)
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    console.log('[AUTH] Verifying token:', token.substring(0, 50) + '...')
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    const jwtPayload = payload as JWTPayload

    // Verificar que el usuario aún existe en la base de datos
    console.log('[AUTH] Checking user exists in DB:', jwtPayload.userId)
    const userExists = await prisma.user.findUnique({
      where: { id: jwtPayload.userId }
    })

    if (!userExists) {
      console.log('[AUTH] User not found in DB')
      return null
    }

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

/**
 * Gets the current authenticated user from API routes.
 * Assumes middleware has already validated authentication and role.
 * Use this in API route handlers after middleware has run.
 *
 * @returns The authenticated user or null if not found
 *
 * @example
 * export async function POST(request: Request) {
 *   const user = await getAuthenticatedUser()
 *   // user.userId, user.email, user.role
 * }
 */
export async function getAuthenticatedUser(): Promise<JWTPayload | null> {
  const token = await getAuthToken()
  if (!token) return null

  // Use light verification since middleware already validated everything
  return await verifyTokenLight(token)
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

// ============================================================================
// API Route Auth Helpers - Simplify authentication in route handlers
// ============================================================================

export type AuthUser = {
  id: string
  email: string
  role: 'ADMIN' | 'BROKER'
}

export type AuthError = NextResponse<{ error: string }>

/**
 * Requires authentication. Returns user or error response.
 * Usage: const user = await requireAuth(request); if (user instanceof NextResponse) return user;
 */
export async function requireAuth(request: Request): Promise<AuthUser | AuthError> {
  const authResult = await verifyAuth(request)

  if (!authResult.success || !authResult.user) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  return authResult.user
}

/**
 * Requires ADMIN role. Returns user or error response.
 * Usage: const admin = await requireAdmin(request); if (admin instanceof NextResponse) return admin;
 */
export async function requireAdmin(request: Request): Promise<AuthUser | AuthError> {
  const authResult = await verifyAuth(request)

  if (!authResult.success || authResult.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  return authResult.user
}

/**
 * Requires BROKER role. Returns user or error response.
 * Usage: const broker = await requireBroker(request); if (broker instanceof NextResponse) return broker;
 */
export async function requireBroker(request: Request): Promise<AuthUser | AuthError> {
  const authResult = await verifyAuth(request)

  if (!authResult.success || authResult.user?.role !== 'BROKER') {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  return authResult.user
}

/**
 * Requires specific role. Returns user or error response.
 * Usage: const user = await requireRole(request, 'ADMIN'); if (user instanceof NextResponse) return user;
 */
export async function requireRole(request: Request, role: 'ADMIN' | 'BROKER'): Promise<AuthUser | AuthError> {
  const authResult = await verifyAuth(request)

  if (!authResult.success || authResult.user?.role !== role) {
    return NextResponse.json(
      { error: 'No autorizado' },
      { status: 401 }
    )
  }

  return authResult.user
}

// ============================================================================
// Higher Order Function Wrappers - Automatic auth for entire route handlers
// ============================================================================

type RouteHandler<T = NextRouteContext> = (
  request: Request,
  context: T,
  user: AuthUser
) => Promise<NextResponse> | NextResponse

type NextRouteContext = { params: Record<string, string> }

/**
 * Wraps a route handler to require authentication.
 * The authenticated user is automatically passed as the third parameter.
 *
 * @example
 * export const GET = withAuth(async (request, context, user) => {
 *   // user.id, user.email, user.role are available
 *   return NextResponse.json({ data: 'protected' })
 * })
 */
export function withAuth<T = NextRouteContext>(
  handler: RouteHandler<T>
): (request: Request, context: T) => Promise<NextResponse> {
  return async (request: Request, context: T) => {
    const authorized = await requireAuth(request)
    if (authorized instanceof NextResponse) return authorized
    return handler(request, context, authorized)
  }
}

/**
 * Wraps a route handler to require ADMIN role.
 * The authenticated admin user is automatically passed as the third parameter.
 *
 * @example
 * export const GET = withAdmin(async (request, { params }, user) => {
 *   // user is guaranteed to be ADMIN
 *   return NextResponse.json({ data: 'admin only' })
 * })
 */
export function withAdmin<T = NextRouteContext>(
  handler: RouteHandler<T>
): (request: Request, context: T) => Promise<NextResponse> {
  return async (request: Request, context: T) => {
    const authorized = await requireAdmin(request)
    if (authorized instanceof NextResponse) return authorized
    return handler(request, context, authorized)
  }
}

/**
 * Wraps a route handler to require BROKER role.
 * The authenticated broker user is automatically passed as the third parameter.
 *
 * @example
 * export const POST = withBroker(async (request, { params }, user) => {
 *   // user is guaranteed to be BROKER
 *   // Use user.id for brokerId in database operations
 *   return NextResponse.json({ data: 'broker only' })
 * })
 */
export function withBroker<T = NextRouteContext>(
  handler: RouteHandler<T>
): (request: Request, context: T) => Promise<NextResponse> {
  return async (request: Request, context: T) => {
    const authorized = await requireBroker(request)
    if (authorized instanceof NextResponse) return authorized
    return handler(request, context, authorized)
  }
}

/**
 * Wraps a route handler to require a specific role.
 * The authenticated user is automatically passed as the third parameter.
 *
 * @example
 * export const DELETE = withRole('ADMIN', async (request, { params }, user) => {
 *   return NextResponse.json({ deleted: true })
 * })
 */
export function withRole<T = NextRouteContext>(
  role: 'ADMIN' | 'BROKER',
  handler: RouteHandler<T>
): (request: Request, context: T) => Promise<NextResponse> {
  return async (request: Request, context: T) => {
    const authorized = await requireRole(request, role)
    if (authorized instanceof NextResponse) return authorized
    return handler(request, context, authorized)
  }
}