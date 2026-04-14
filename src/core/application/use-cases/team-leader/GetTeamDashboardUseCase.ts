import { PrismaClient } from '@prisma/client'

export class GetTeamDashboardUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(teamLeaderId: string, mes: number, anio: number) {
    const brokers = await this.prisma.user.findMany({
      where: { teamLeaderId, role: 'BROKER' },
      select: { id: true, nombre: true, email: true },
    })
    const brokerIds = brokers.map(b => b.id)
    if (brokerIds.length === 0) {
      return { brokerIds: [], metrics: this.emptyMetrics(), brokerMetrics: [] }
    }

    const fechaInicio = new Date(anio, mes - 1, 1)
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999)

    // Parallel queries for efficiency
    const [leadsPeriodo, leadsConCheckin] = await Promise.all([
      this.prisma.lead.findMany({
        where: {
          brokerId: { in: brokerIds },
          fechaPagoReserva: { gte: fechaInicio, lte: fechaFin },
        },
        select: {
          id: true, comision: true, fechaCheckin: true, totalLead: true, estado: true, brokerId: true,
        },
      }),
      this.prisma.lead.findMany({
        where: {
          brokerId: { in: brokerIds },
          fechaCheckin: { gte: fechaInicio, lte: fechaFin },
          estado: { notIn: ['RECHAZADO', 'CANCELADO'] },
        },
        select: { id: true, comision: true, estado: true, brokerId: true },
      }),
    ])

    const leadsConfirmados = leadsConCheckin.filter(l => l.estado === 'DEPARTAMENTO_ENTREGADO')
    const leadsActivos = leadsPeriodo.filter(l => l.estado !== 'RECHAZADO' && l.estado !== 'CANCELADO')

    const cantidadReservas = leadsActivos.length
    const numeroCheckins = leadsConCheckin.length
    const comisionesProyectadas = leadsActivos.reduce((sum, l) => sum + (l.comision || 0), 0)
    const comisionesConfirmadas = leadsConfirmados.reduce((sum, l) => sum + (l.comision || 0), 0)
    const porcentajeCierre = cantidadReservas > 0 ? (numeroCheckins / cantidadReservas) * 100 : 0

    // Per-broker breakdown
    const brokerMetrics = brokers.map(broker => {
      const brokerLeadsActivos = leadsActivos.filter(l => l.brokerId === broker.id)
      const brokerCheckins = leadsConCheckin.filter(l => l.brokerId === broker.id)
      const brokerConfirmados = leadsConfirmados.filter(l => l.brokerId === broker.id)

      return {
        id: broker.id,
        nombre: broker.nombre,
        email: broker.email,
        cantidadReservas: brokerLeadsActivos.length,
        numeroCheckins: brokerCheckins.length,
        comisionesProyectadas: brokerLeadsActivos.reduce((sum, l) => sum + (l.comision || 0), 0),
        comisionesConfirmadas: brokerConfirmados.reduce((sum, l) => sum + (l.comision || 0), 0),
      }
    })

    return {
      brokerIds,
      metrics: {
        cantidadReservas,
        numeroCheckins,
        comisionesProyectadas,
        comisionesConfirmadas,
        porcentajeCierre: Math.round(porcentajeCierre * 100) / 100,
      },
      brokerMetrics,
    }
  }

  private emptyMetrics() {
    return {
      cantidadReservas: 0,
      numeroCheckins: 0,
      comisionesProyectadas: 0,
      comisionesConfirmadas: 0,
      porcentajeCierre: 0,
    }
  }
}
