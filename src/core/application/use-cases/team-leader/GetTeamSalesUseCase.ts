import { PrismaClient } from '@prisma/client'

export class GetTeamSalesUseCase {
  constructor(private prisma: PrismaClient) {}

  async execute(teamLeaderId: string, filterBrokerId?: string) {
    const teamBrokers = await this.prisma.user.findMany({
      where: { teamLeaderId, role: 'BROKER' },
      select: { id: true },
    })
    const brokerIds = teamBrokers.map(b => b.id)
    if (brokerIds.length === 0) return { leads: [], estadisticas: this.emptyStats() }

    const targetBrokerIds = filterBrokerId && brokerIds.includes(filterBrokerId)
      ? [filterBrokerId]
      : brokerIds

    const leads = await this.prisma.lead.findMany({
      where: { brokerId: { in: targetBrokerIds } },
      include: {
        broker: { select: { id: true, nombre: true } },
        cliente: { select: { id: true, nombre: true, rut: true, email: true, telefono: true } },
        edificio: { select: { id: true, nombre: true, direccion: true } },
        unidad: {
          include: {
            edificio: { select: { id: true, nombre: true, direccion: true } },
            tipoUnidadEdificio: { include: { comision: true } },
          },
        },
        comisionBase: { select: { id: true, nombre: true, codigo: true, porcentaje: true } },
        reglaComision: {
          include: { comision: { select: { id: true, nombre: true, codigo: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const leadsFormatted = leads.map(lead => ({
      id: lead.id,
      codigoUnidad: lead.codigoUnidad,
      totalLead: lead.totalLead,
      montoUf: lead.montoUf,
      comision: lead.comision,
      estado: lead.estado,
      fechaPagoReserva: lead.fechaPagoReserva?.toISOString(),
      fechaPagoLead: lead.fechaPagoLead?.toISOString(),
      fechaCheckin: lead.fechaCheckin?.toISOString(),
      observaciones: lead.observaciones,
      broker: lead.broker,
      cliente: lead.cliente,
      edificio: lead.edificio,
      unidad: lead.unidad ? {
        id: lead.unidad.id,
        numero: lead.unidad.numero,
        descripcion: lead.unidad.descripcion,
        metros2: lead.unidad.metros2,
        edificio: lead.unidad.edificio,
        tipoUnidad: {
          id: lead.unidad.tipoUnidadEdificio.id,
          nombre: lead.unidad.tipoUnidadEdificio.nombre,
          codigo: lead.unidad.tipoUnidadEdificio.codigo,
          comision: lead.unidad.tipoUnidadEdificio.comision || null,
        },
      } : null,
      comisionBase: lead.comisionBase,
      reglaComision: lead.reglaComision ? {
        id: lead.reglaComision.id,
        cantidadMinima: lead.reglaComision.cantidadMinima,
        cantidadMaxima: lead.reglaComision.cantidadMaxima,
        porcentaje: lead.reglaComision.porcentaje,
        comision: lead.reglaComision.comision,
      } : null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }))

    const stats = {
      totalLeads: leads.length,
      entregados: leads.filter(l => l.estado === 'ENTREGADO' || l.estado === 'DEPARTAMENTO_ENTREGADO').length,
      reservaPagada: leads.filter(l => l.estado === 'RESERVA_PAGADA').length,
      aprobados: leads.filter(l => l.estado === 'APROBADO').length,
      rechazados: leads.filter(l => l.estado === 'RECHAZADO').length,
      totalComisionesEsperadas: leads.filter(l => l.estado !== 'RECHAZADO').reduce((sum, l) => sum + (l.comision || 0), 0),
      totalComisionesAprobadas: leads.filter(l => l.estado === 'APROBADO').reduce((sum, l) => sum + (l.comision || 0), 0),
    }

    return { leads: leadsFormatted, estadisticas: stats }
  }

  private emptyStats() {
    return {
      totalLeads: 0, entregados: 0, reservaPagada: 0, aprobados: 0, rechazados: 0,
      totalComisionesEsperadas: 0, totalComisionesAprobadas: 0,
    }
  }
}
