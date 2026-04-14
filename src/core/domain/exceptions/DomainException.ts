/**
 * Base class for all domain exceptions.
 * Provides structured error handling with HTTP status mapping.
 */
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message)
    this.name = this.constructor.name
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    }
  }
}
