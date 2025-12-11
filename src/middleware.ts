import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyTokenLight } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[MIDDLEWARE] ${request.method} ${pathname}`)

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ]

  // Routes that require authentication but bypass other checks
  const authOnlyRoutes = [
    '/change-password',
    '/api/auth/change-password',
    '/api/auth/me'
  ]

  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isAuthOnlyRoute = authOnlyRoutes.some(route => pathname.startsWith(route))

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value
  console.log(`[MIDDLEWARE] Token presente en cookies: ${!!token}`)

  // For development, also check Authorization header as fallback
  const authHeader = request.headers.get('Authorization')
  const headerToken = authHeader?.replace('Bearer ', '')
  console.log(`[MIDDLEWARE] Token presente en headers: ${!!headerToken}`)

  const finalToken = token || headerToken
  console.log(`[MIDDLEWARE] Token final: ${!!finalToken}`)

  // If no token and trying to access protected route, redirect to login
  if (!finalToken && !isPublicRoute) {
    console.log(`[MIDDLEWARE] Sin token, redirigiendo a login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, verify it
  if (finalToken) {
    console.log(`[MIDDLEWARE] Token recibido: ${finalToken.substring(0, 50)}...`)
    try {
      const payload = await verifyTokenLight(finalToken)
      console.log(`[MIDDLEWARE] Token válido: ${!!payload}, Role: ${payload?.role}`)

      // If token is invalid, redirect to login
      if (!payload) {
        console.log(`[MIDDLEWARE] Token inválido, redirigiendo a login`)
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('auth-token')
        return response
      }

      // Allow access to auth-only routes (like change-password) for authenticated users
      if (isAuthOnlyRoute) {
        console.log(`[MIDDLEWARE] Permitiendo acceso a ruta auth-only: ${pathname}`)
        return NextResponse.next()
      }

      // Strict role-based access control - users can ONLY access their role prefix
      // This applies to BOTH page routes and API routes

      // Admin routes (pages and APIs)
      if ((pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) && payload.role !== 'ADMIN') {
        console.log(`[MIDDLEWARE] Usuario ${payload.role} intenta acceder a admin: ${pathname}`)
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Broker routes (pages and APIs)
      if ((pathname.startsWith('/broker') || pathname.startsWith('/api/broker')) && payload.role !== 'BROKER') {
        console.log(`[MIDDLEWARE] Usuario ${payload.role} intenta acceder a broker: ${pathname}`)
        if (pathname.startsWith('/api')) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // Redirect root path to appropriate dashboard
      if (pathname === '/') {
        const dashboardUrl = payload.role === 'ADMIN' ? '/admin' : '/broker'
        console.log(`[MIDDLEWARE] Redirigiendo desde root a dashboard: ${dashboardUrl}`)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }

      // If authenticated user tries to access login page specifically, redirect to their dashboard
      if (pathname === '/login') {
        const dashboardUrl = payload.role === 'ADMIN' ? '/admin' : '/broker'
        console.log(`[MIDDLEWARE] Usuario autenticado en login, redirigiendo a: ${dashboardUrl}`)
        return NextResponse.redirect(new URL(dashboardUrl, request.url))
      }

    } catch (error) {
      console.log(`[MIDDLEWARE] Error en verificación de token:`, error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }
  }

  console.log(`[MIDDLEWARE] Permitiendo acceso a ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}