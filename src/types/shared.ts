// Types shared across multiple contexts (admin, broker, team-leader)

export interface TaxType {
  id: string
  name: string
  nature: 'ADDITIVE' | 'DEDUCTIVE'
  active: boolean
}

export type UserRole = 'ADMIN' | 'BROKER' | 'TEAM_LEADER'
