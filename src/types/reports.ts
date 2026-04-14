export interface ComisionMensual {
  id: string
  leadId: string
  clienteNombre: string
  edificioNombre: string
  unidadCodigo: string
  brokerNombre?: string
  totalLead: number
  comision: number
  comisionProyectada: number
  comisionConfirmada: number
  montoComision?: number
  porcentajeComision: number
  fechaPagoReserva: string | null
  fechaCheckin: string | null
  reservaEnPeriodo: boolean
  checkinEnPeriodo: boolean
  fechaLead?: string
  estadoLead: string
}

export interface ResumenAnual {
  mes: string
  totalComisiones: number
  cantidadVentas: number
  promedioComision: number
}

export interface CashFlowLead {
  id: string
  clienteNombre: string
  edificioNombre: string
  unidadCodigo: string
  montoComision: number
  estado: string
}

export interface CashFlowDay {
  fecha: string
  totalComisiones: number
  cantidadLeads: number
  leads: CashFlowLead[]
}

export interface CashFlowResponse {
  data: CashFlowDay[]
  summary: {
    totalComisiones: number
    totalLeads: number
    promedioComision: number
  }
}
