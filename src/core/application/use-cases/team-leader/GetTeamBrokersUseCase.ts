import { PrismaClient } from '@prisma/client'

export class GetTeamBrokersUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(teamLeaderId: string) {
    const brokers = await this.prisma.user.findMany({
      where: { teamLeaderId, role: 'BROKER' },
      select: {
        id: true,
        nombre: true,
        email: true,
        rut: true,
        telefono: true,
        activo: true,
        leads: {
          select: { id: true, comision: true, estado: true },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    return {
      brokers: brokers.map(broker => ({
        id: broker.id,
        nombre: broker.nombre,
        email: broker.email,
        rut: broker.rut,
        telefono: broker.telefono,
        activo: broker.activo,
        totalLeads: broker.leads.length,
        leadsActivos: broker.leads.filter(l => !['RECHAZADO', 'CANCELADO'].includes(l.estado)).length,
        comisionesTotales: broker.leads
          .filter(l => l.estado === 'DEPARTAMENTO_ENTREGADO')
          .reduce((sum, l) => sum + (l.comision || 0), 0),
      })),
    }
  }
}
