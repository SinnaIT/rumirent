import type { BrokerRef } from './broker'
import type { ClienteBasic } from './cliente'
import type { EdificioRef } from './edificio'
import type { UnidadRef } from './unidad'
import type { TipoUnidadBasic } from './tipo-unidad'
import type { ComisionBase } from './comision'
import type { ReglaComision } from './regla-comision'
import type { EstadoLead } from './enums'

export interface LeadFull {
  id: string
  codigoUnidad?: string
  totalLead: number
  montoUf: number
  comision: number
  estado: EstadoLead
  fechaPagoReserva?: string | null
  fechaPagoLead?: string | null
  fechaCheckin?: string | null
  postulacion?: string | null
  observaciones?: string | null
  conciliado: boolean
  fechaConciliacion?: string | null
  broker: BrokerRef
  cliente: ClienteBasic
  unidad?: UnidadRef & { edificio: EdificioRef } | null
  edificio: EdificioRef
  tipoUnidadEdificio?: TipoUnidadBasic | null
  reglaComision?: ReglaComision | null
  comisionBase?: ComisionBase | null
  createdAt: string
  updatedAt: string
}
