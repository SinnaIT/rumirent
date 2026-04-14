import { PrismaClient } from '@prisma/client'
import { EntityNotFoundException } from '@/core/domain/exceptions'

export class UnassignBrokerUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(teamLeaderId: string, brokerId: string) {
    const broker = await this.prisma.user.findUnique({
      where: { id: brokerId },
      select: { id: true, teamLeaderId: true },
    })

    if (!broker || broker.teamLeaderId !== teamLeaderId) {
      throw new EntityNotFoundException('Asignación no encontrada')
    }

    await this.prisma.user.update({
      where: { id: brokerId },
      data: { teamLeaderId: null },
    })
  }
}
