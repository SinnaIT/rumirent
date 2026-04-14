import type { ComisionRef } from './comision'

export interface ReglaComision {
  id: string
  cantidadMinima: number
  cantidadMaxima: number | null
  porcentaje: number
  comision: ComisionRef
}

export interface CommissionRule {
  id: string
  porcentaje: number
  cantidadMinima: number
  cantidadMaxima: number | null
}

export interface CommissionInfo {
  comisionId: string
  comisionNombre: string
  comisionCodigo: string
  porcentajeBase: number
  totalLeads: number
  currentRule: CommissionRule | null
  nextRule: CommissionRule | null
  untilNextLevel: number | null
}

export interface MultiCommissionResponse {
  success: boolean
  date: string
  commissionData: Record<string, CommissionInfo>
}
