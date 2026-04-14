import { PrismaClient } from '@prisma/client'
import { EntityNotFoundException, ValidationException } from '@/core/domain/exceptions'

export class GetTeamLeaderDetailUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(id: string) {
    const teamLeader = await this.prisma.user.findUnique({
      where: { id },
      include: {
        teamBrokers: {
          where: { role: 'BROKER' },
          select: {
            id: true,
            nombre: true,
            email: true,
            rut: true,
            telefono: true,
            activo: true,
          },
          orderBy: { nombre: 'asc' },
        },
      },
    })

    if (!teamLeader) {
      throw new EntityNotFoundException('Líder de equipo no encontrado')
    }
    if (teamLeader.role !== 'TEAM_LEADER') {
      throw new ValidationException('El usuario no es un líder de equipo')
    }

    return {
      id: teamLeader.id,
      email: teamLeader.email,
      nombre: teamLeader.nombre,
      rut: teamLeader.rut,
      telefono: teamLeader.telefono,
      activo: teamLeader.activo,
      birthDate: teamLeader.birthDate,
      createdAt: teamLeader.createdAt,
      brokers: teamLeader.teamBrokers,
    }
  }
}
