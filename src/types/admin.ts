import type { TaxType } from './shared'
import type { BrokerBasic } from './broker'

export type { BrokerBasic }

export interface Broker extends BrokerBasic {
  telefono: string | null
  birthDate?: string | null
  activo: boolean
  ventasRealizadas: number
  comisionesTotales: number
  createdAt: string
  taxTypeId?: string | null
  taxType?: TaxType | null
  teamLeaderId?: string | null
  teamLeader?: { id: string; nombre: string } | null
}
