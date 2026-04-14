import type { BrokerRef } from './broker'

export interface ClienteBasic {
  id: string
  nombre: string
  rut: string
  email?: string | null
  telefono?: string | null
}

export interface ActiveLeadInfo {
  id: string
  createdAt: string
  estado: string
  edificio: string
}

export interface ClienteWithActiveLead extends ClienteBasic {
  hasActiveLead?: boolean
  activeLead?: ActiveLeadInfo | null
}

export interface ClienteWithDates extends ClienteBasic {
  direccion?: string | null
  fechaNacimiento?: string | null
  createdAt: string
  updatedAt: string
}

export interface ClienteWithBroker extends ClienteWithDates {
  broker: BrokerRef | null
  totalLeads?: number
}
