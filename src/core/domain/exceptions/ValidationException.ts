import { DomainException } from './DomainException'

export class ValidationException extends DomainException {
  constructor(message: string = 'Error de validación') {
    super(message, 400, 'VALIDATION_ERROR')
  }
}
