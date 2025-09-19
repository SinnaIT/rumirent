import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[MIDDLEWARE] ${request.method} ${pathname}`)

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get auth token from cookies
  const token = request.cookies.get('auth-token')?.value
  console.log(`[MIDDLEWARE] Token presente: ${!!token}`)

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    console.log(`[MIDDLEWARE] Sin token, redirigiendo a login`)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If token exists, verify it
  if (token) {
    console.log(`[MIDDLEWARE] Token recibido: ${token.substring(0, 50)}...`)
    const payload = await verifyToken(token)
    console.log(`[MIDDLEWARE] Token válido: ${!!payload}, Role: ${payload?.role}`)
    if (!payload) {
      console.log(`[MIDDLEWARE] Error al verificar token`)
    }

    // If token is invalid, redirect to login
    if (!payload) {
      console.log(`[MIDDLEWARE] Token inválido, redirigiendo a login`)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth-token')
      return response
    }

    // Strict role-based access control - users can ONLY access their role prefix
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
      console.log(`[MIDDLEWARE] Usuario ${payload.role} intenta acceder a admin`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/contratista') && payload.role !== 'CONTRATISTA') {
      console.log(`[MIDDLEWARE] Usuario ${payload.role} intenta acceder a contratista`)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Ensure users can only access routes that start with their role prefix
    if (!pathname.startsWith('/admin') && !pathname.startsWith('/contratista') && !isPublicRoute && pathname !== '/') {
      const dashboardUrl = payload.role === 'ADMIN' ? '/admin' : '/contratista'
      console.log(`[MIDDLEWARE] Redirigiendo a dashboard: ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // If authenticated user tries to access login, redirect to their dashboard
    if (isPublicRoute) {
      const dashboardUrl = payload.role === 'ADMIN' ? '/admin' : '/contratista'
      console.log(`[MIDDLEWARE] Usuario autenticado en login, redirigiendo a: ${dashboardUrl}`)
      return NextResponse.redirect(new URL(dashboardUrl, request.url))
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