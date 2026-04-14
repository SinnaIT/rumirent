import { PrismaClient } from '@prisma/client'

export class ListTeamLeadersUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute() {
    const teamLeaders = await this.prisma.user.findMany({
      where: { role: 'TEAM_LEADER' },
      orderBy: { nombre: 'asc' },
      include: {
        teamBrokers: {
          where: { role: 'BROKER' },
          select: { id: true, nombre: true, email: true },
          orderBy: { nombre: 'asc' },
        },
        commissionTaxType: {
          select: { id: true, name: true, nature: true, active: true },
        },
      },
    })

    return teamLeaders.map(tl => ({
      id: tl.id,
      email: tl.email,
      nombre: tl.nombre,
      rut: tl.rut,
      telefono: tl.telefono,
      activo: tl.activo,
      birthDate: tl.birthDate,
      createdAt: tl.createdAt,
      brokersCount: tl.teamBrokers.length,
      brokers: tl.teamBrokers,
      taxTypeId: tl.commissionTaxTypeId,
      taxType: tl.commissionTaxType,
    }))
  }
}
