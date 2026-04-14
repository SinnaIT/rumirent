import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { DomainException } from '@/core/domain/exceptions'

/**
 * Standardized success response.
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, ...data as object }, { status })
}

/**
 * Standardized error response.
 */
export function errorResponse(
  message: string,
  status: number = 400,
  code?: string,
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, ...(code ? { code } : {}) },
    { status },
  )
}

/**
 * Wraps an API route handler with automatic error handling.
 * Catches DomainExceptions, ZodErrors, and unexpected errors,
 * returning standardized responses.
 */
export async function withErrorHandler(
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    if (error instanceof DomainException) {
      return errorResponse(error.message, error.statusCode, error.code)
    }

    if (error instanceof ZodError) {
      const message = error.errors.map(e => e.message).join(', ')
      return errorResponse(message, 400, 'VALIDATION_ERROR')
    }

    console.error('[API Error]', error)
    const message = error instanceof Error ? error.message : 'Error interno del servidor'
    return errorResponse(message, 500, 'INTERNAL_ERROR')
  }
}
