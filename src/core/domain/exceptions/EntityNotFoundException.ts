import { DomainException } from './DomainException'

export class EntityNotFoundException extends DomainException {
  constructor(message: string = 'Entidad no encontrada') {
    super(message, 404, 'ENTITY_NOT_FOUND')
  }
}
