import { PrismaClient } from '@prisma/client'

export class GetTeamCommissionsUseCase {
  constructor(private prisma: PrismaClient) {}

  private async getBrokerIds(teamLeaderId: string): Promise<string[]> {
    const teamBrokers = await this.prisma.user.findMany({
      where: { teamLeaderId, role: 'BROKER' },
      select: { id: true },
    })
    return teamBrokers.map(b => b.id)
  }

  async executeMonthly(teamLeaderId: string, mes: number, anio: number, filterBrokerId?: string) {
    const brokerIds = await this.getBrokerIds(teamLeaderId)
    if (brokerIds.length === 0) return { leads: [], totales: this.emptyTotals() }

    const targetBrokerIds = filterBrokerId && brokerIds.includes(filterBrokerId)
      ? [filterBrokerId]
      : brokerIds

    const fechaInicio = new Date(anio, mes, 1)
    const fechaFin = new Date(anio, mes + 1, 0, 23, 59, 59, 999)

    const leads = await this.prisma.lead.findMany({
      where: {
        brokerId: { in: targetBrokerIds },
        OR: [
          { fechaPagoReserva: { gte: fechaInicio, lte: fechaFin } },
          { fechaCheckin: { gte: fechaInicio, lte: fechaFin } },
        ],
        estado: { notIn: ['RECHAZADO', 'CANCELADO'] },
      },
      include: {
        broker: { select: { id: true, nombre: true } },
        cliente: true,
        edificio: { select: { nombre: true } },
        unidad: {
          include: {
            edificio: true,
            tipoUnidadEdificio: { include: { comision: true } },
          },
        },
      },
      orderBy: [{ fechaPagoReserva: 'desc' }, { fechaCheckin: 'desc' }],
    })

    const comisionesMensuales = leads.map(lead => {
      const reservaEnPeriodo = lead.fechaPagoReserva &&
        lead.fechaPagoReserva >= fechaInicio && lead.fechaPagoReserva <= fechaFin
      const checkinEnPeriodo = lead.fechaCheckin &&
        lead.fechaCheckin >= fechaInicio && lead.fechaCheckin <= fechaFin

      const comisionProyectada = reservaEnPeriodo ? (lead.comision || 0) : 0
      const comisionConfirmada = (checkinEnPeriodo && lead.estado === 'DEPARTAMENTO_ENTREGADO')
        ? (lead.comision || 0) : 0

      let porcentajeComision = 0
      if (lead.unidad?.tipoUnidadEdificio?.comision) {
        porcentajeComision = lead.unidad.tipoUnidadEdificio.comision.porcentaje
      } else if (lead.totalLead && lead.comision) {
        porcentajeComision = (lead.comision / lead.totalLead) * 100
      }

      return {
        id: lead.id,
        brokerNombre: lead.broker.nombre,
        brokerId: lead.broker.id,
        clienteNombre: lead.cliente.nombre,
        edificioNombre: lead.edificio?.nombre || 'Sin edificio',
        unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
        totalLead: lead.totalLead,
        comision: lead.comision,
        comisionProyectada,
        comisionConfirmada,
        porcentajeComision: Math.round(porcentajeComision * 100) / 100,
        fechaPagoReserva: lead.fechaPagoReserva?.toISOString() || null,
        fechaCheckin: lead.fechaCheckin?.toISOString() || null,
        reservaEnPeriodo,
        checkinEnPeriodo,
        estadoLead: lead.estado,
      }
    })

    const totales = {
      comisionesProyectadas: comisionesMensuales.reduce((sum, l) => sum + l.comisionProyectada, 0),
      comisionesConfirmadas: comisionesMensuales.reduce((sum, l) => sum + l.comisionConfirmada, 0),
      totalLeads: comisionesMensuales.length,
      leadsConReservaEnPeriodo: comisionesMensuales.filter(l => l.reservaEnPeriodo).length,
      leadsConCheckinEnPeriodo: comisionesMensuales.filter(l => l.checkinEnPeriodo).length,
    }

    return { leads: comisionesMensuales, totales }
  }

  async executeAnnual(teamLeaderId: string, anio: number, filterBrokerId?: string) {
    const brokerIds = await this.getBrokerIds(teamLeaderId)
    if (brokerIds.length === 0) return []

    const targetBrokerIds = filterBrokerId && brokerIds.includes(filterBrokerId)
      ? [filterBrokerId]
      : brokerIds

    const fechaInicio = new Date(anio, 0, 1)
    const fechaFin = new Date(anio, 11, 31, 23, 59, 59, 999)

    const leads = await this.prisma.lead.findMany({
      where: {
        brokerId: { in: targetBrokerIds },
        createdAt: { gte: fechaInicio, lte: fechaFin },
        estado: { not: 'RECHAZADO' },
      },
      select: { comision: true, estado: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })

    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ]

    return meses
      .map((nombreMes, index) => {
        const leadsMes = leads.filter(l => l.createdAt.getMonth() === index)
        const cantidadVentas = leadsMes.length
        const totalComisiones = leadsMes
          .filter(l => l.estado === 'DEPARTAMENTO_ENTREGADO')
          .reduce((sum, l) => sum + (l.comision || 0), 0)

        return {
          mes: nombreMes,
          totalComisiones,
          cantidadVentas,
          promedioComision: cantidadVentas > 0 ? totalComisiones / cantidadVentas : 0,
        }
      })
      .filter(m => m.cantidadVentas > 0)
  }

  private emptyTotals() {
    return {
      comisionesProyectadas: 0, comisionesConfirmadas: 0,
      totalLeads: 0, leadsConReservaEnPeriodo: 0, leadsConCheckinEnPeriodo: 0,
    }
  }
}
