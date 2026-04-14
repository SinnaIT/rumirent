import type { TaxType, UserRole, BrokerBasic } from '@/types'

export interface TeamLeader {
  id: string
  email: string
  nombre: string
  rut: string
  telefono: string | null
  activo: boolean
  birthDate: string | null
  createdAt: string
  brokersCount: number
  brokers: BrokerBasic[]
  taxTypeId?: string | null
  taxType?: TaxType | null
}

export interface TeamLeaderFormData {
  email: string
  nombre: string
  rut: string
  telefono: string
  birthDate: string
  password: string
  confirmPassword: string
  taxTypeId: string
  role: Extract<UserRole, 'BROKER' | 'TEAM_LEADER'>
}

export type { BrokerBasic as AvailableBroker }
