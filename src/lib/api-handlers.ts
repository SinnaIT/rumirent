import { withAdmin, withBroker, withTeamLeader, withAuth, type AuthUser } from '@/lib/auth'
import { DomainException } from '@/core/domain/exceptions'
import { ZodError } from 'zod'
import { errorResponse } from '@/lib/api-response'
import { NextResponse } from 'next/server'

type NextRouteContext = { params: Record<string, string> }

type RouteHandler<T = NextRouteContext> = (
  request: Request,
  context: T,
  user: AuthUser
) => Promise<NextResponse> | NextResponse

function withErrorHandling<T>(
  handler: (req: Request, ctx: T) => Promise<NextResponse>
): (req: Request, ctx: T) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      if (error instanceof DomainException) {
        return errorResponse(error.message, error.statusCode, error.code)
      }
      if (error instanceof ZodError) {
        return errorResponse(
          error.errors.map(e => e.message).join(', '),
          400,
          'VALIDATION_ERROR'
        )
      }
      console.error('[API Error]', error)
      return errorResponse(
        error instanceof Error ? error.message : 'Error interno del servidor',
        500,
        'INTERNAL_ERROR'
      )
    }
  }
}

/** Admin route handler with authentication + error handling */
export const adminHandler = <T = NextRouteContext>(handler: RouteHandler<T>) =>
  withErrorHandling(withAdmin<T>(handler))

/** Broker route handler with authentication + error handling */
export const brokerHandler = <T = NextRouteContext>(handler: RouteHandler<T>) =>
  withErrorHandling(withBroker<T>(handler))

/** Team leader route handler with authentication + error handling */
export const teamLeaderHandler = <T = NextRouteContext>(handler: RouteHandler<T>) =>
  withErrorHandling(withTeamLeader<T>(handler))

/** Authenticated route handler (any role) with error handling */
export const authHandler = <T = NextRouteContext>(handler: RouteHandler<T>) =>
  withErrorHandling(withAuth<T>(handler))
