import { PrismaClient } from '@prisma/client'
import { EntityNotFoundException, ValidationException } from '@/core/domain/exceptions'

export class AssignBrokerUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(teamLeaderId: string, brokerId: string) {
    const [broker, teamLeader] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: brokerId } }),
      this.prisma.user.findUnique({ where: { id: teamLeaderId } }),
    ])

    if (!teamLeader || teamLeader.role !== 'TEAM_LEADER') {
      throw new EntityNotFoundException('Líder de equipo no encontrado')
    }
    if (!broker) {
      throw new EntityNotFoundException('Broker no encontrado')
    }
    if (broker.role !== 'BROKER') {
      throw new ValidationException('El usuario no es un broker')
    }
    if (broker.teamLeaderId && broker.teamLeaderId !== teamLeaderId) {
      throw new ValidationException('Este broker ya está asignado a otro equipo')
    }

    return this.prisma.user.update({
      where: { id: brokerId },
      data: { teamLeaderId },
      select: { id: true, teamLeaderId: true },
    })
  }
}
