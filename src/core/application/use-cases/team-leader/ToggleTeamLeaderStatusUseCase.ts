import { UserRepository } from '@/core/application/ports/UserRepository'
import { EntityNotFoundException, ValidationException } from '@/core/domain/exceptions'

export class ToggleTeamLeaderStatusUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(id: string) {
    const existing = await this.userRepo.findById(id)
    if (!existing) {
      throw new EntityNotFoundException('Líder de equipo no encontrado')
    }
    if (existing.role !== 'TEAM_LEADER') {
      throw new ValidationException('El usuario no es un líder de equipo')
    }

    return this.userRepo.toggleActive(id)
  }
}
