import { PrismaClient } from '@prisma/client'
import { UserRepository } from '@/core/application/ports/UserRepository'
import { EntityNotFoundException, ValidationException } from '@/core/domain/exceptions'
import { UpdateTeamLeaderDto } from '@/core/application/dto/team-leader.dto'

export class UpdateTeamLeaderUseCase {
  constructor(
    private userRepo: UserRepository,
    private prisma?: PrismaClient,
  ) {}

  async execute(id: string, dto: UpdateTeamLeaderDto) {
    const existing = await this.userRepo.findById(id)
    if (!existing) {
      throw new EntityNotFoundException('Líder de equipo no encontrado')
    }
    if (existing.role !== 'TEAM_LEADER') {
      throw new ValidationException('El usuario no es un líder de equipo')
    }

    if (dto.email) {
      const emailExists = await this.userRepo.existsByEmail(dto.email, id)
      if (emailExists) {
        throw new ValidationException('Ya existe un usuario con este email')
      }
    }

    if (dto.rut) {
      const rutExists = await this.userRepo.existsByRut(dto.rut, id)
      if (rutExists) {
        throw new ValidationException('Ya existe un usuario con este RUT')
      }
    }

    // If changing role to BROKER, ensure no assigned brokers
    if (dto.role === 'BROKER' && this.prisma) {
      const assignedCount = await this.prisma.user.count({
        where: { teamLeaderId: id, role: 'BROKER' },
      })
      if (assignedCount > 0) {
        throw new ValidationException('No se puede cambiar el rol: tiene brokers asignados. Desasigne los brokers primero.')
      }
    }

    return this.userRepo.update(id, {
      email: dto.email,
      nombre: dto.nombre,
      rut: dto.rut,
      telefono: dto.telefono,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      password: dto.password,
      role: dto.role,
      commissionTaxTypeId: dto.taxTypeId,
    })
  }
}
