import type { UserRole } from '@/types'

export interface BrokerFormData {
  email: string
  nombre: string
  rut: string
  telefono: string
  birthDate: string
  password: string
  confirmPassword: string
  taxTypeId: string
  role: Extract<UserRole, 'BROKER' | 'TEAM_LEADER'>
  teamLeaderId: string
}
