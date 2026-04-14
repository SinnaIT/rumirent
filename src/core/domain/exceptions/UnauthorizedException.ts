import { DomainException } from './DomainException'

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED')
  }
}
