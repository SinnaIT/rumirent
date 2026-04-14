import { UserRepository } from '@/core/application/ports/UserRepository'
import { ValidationException } from '@/core/domain/exceptions'
import { CreateTeamLeaderDto } from '@/core/application/dto/team-leader.dto'

export class CreateTeamLeaderUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(dto: CreateTeamLeaderDto) {
    const [emailExists, rutExists] = await Promise.all([
      this.userRepo.existsByEmail(dto.email),
      this.userRepo.existsByRut(dto.rut),
    ])

    if (emailExists) {
      throw new ValidationException('Ya existe un usuario con este email')
    }
    if (rutExists) {
      throw new ValidationException('Ya existe un usuario con este RUT')
    }

    const teamLeader = await this.userRepo.create({
      email: dto.email,
      nombre: dto.nombre,
      rut: dto.rut,
      password: dto.password,
      role: 'TEAM_LEADER',
      telefono: dto.telefono,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      mustChangePassword: true,
      commissionTaxTypeId: dto.taxTypeId,
    })

    return teamLeader
  }
}
