import { PrismaClient } from '@prisma/client'

export class GetTeamLeadsUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(teamLeaderId: string, filterBrokerId?: string) {
    const teamBrokers = await this.prisma.user.findMany({
      where: { teamLeaderId, role: 'BROKER' },
      select: { id: true },
    })
    const brokerIds = teamBrokers.map(b => b.id)
    if (brokerIds.length === 0) return { clientes: [] }

    const targetBrokerIds = filterBrokerId && brokerIds.includes(filterBrokerId)
      ? [filterBrokerId]
      : brokerIds

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const clientes = await this.prisma.cliente.findMany({
      where: { brokerId: { in: targetBrokerIds } },
      include: {
        broker: { select: { id: true, nombre: true } },
        leads: {
          where: {
            createdAt: { gte: thirtyDaysAgo },
            estado: { notIn: ['RECHAZADO', 'CANCELADO', 'DEPARTAMENTO_ENTREGADO'] },
          },
          select: {
            id: true, createdAt: true, estado: true,
            edificio: { select: { nombre: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return {
      clientes: clientes.map(cliente => {
        const activeLead = cliente.leads[0]
        return {
          id: cliente.id,
          nombre: cliente.nombre,
          rut: cliente.rut,
          email: cliente.email,
          telefono: cliente.telefono,
          createdAt: cliente.createdAt,
          broker: cliente.broker,
          hasActiveLead: !!activeLead,
          activeLead: activeLead ? {
            id: activeLead.id,
            createdAt: activeLead.createdAt.toISOString(),
            estado: activeLead.estado,
            edificio: activeLead.edificio.nombre,
          } : null,
        }
      }),
    }
  }
}
