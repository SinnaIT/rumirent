export interface ComisionRef {
  id: string
  nombre: string
  codigo: string
}

export interface ComisionBase extends ComisionRef {
  porcentaje: number
}

export interface Comision extends ComisionBase {
  activa: boolean
}

// Commission resolution result from 3-level priority lookup
export interface CommissionResolution {
  porcentaje: number
  comisionId: string | null
  source: 'TipoUnidadEdificio' | 'Unidad->TipoUnidadEdificio' | 'Edificio' | 'None'
}

// Flat rule record used for in-memory rule matching
export interface ReglaComisionRecord {
  id: string
  porcentaje: number
  cantidadMinima: number
  cantidadMaxima: number | null
  comisionId: string
}

// Result of resolving current and next rule for a broker
export interface RuleResolution {
  currentRule: { id: string; porcentaje: number; cantidadMinima: number; cantidadMaxima: number | null } | null
  nextRule: { id: string; porcentaje: number; cantidadMinima: number; cantidadMaxima: number | null } | null
  untilNextLevel: number | null
}

// A single lead commission update to be applied
export interface CommissionUpdate {
  leadId: string
  comision: number
  reglaComisionId: string | null
  comisionId: string
}

// Result returned from a batch recalculation
export interface RecalculationResult {
  success: boolean
  totalProcessed: number
  updated: number
  errors: number
  groups: number
}

// Lead shape required by resolveCommissionSource
export interface LeadWithCommissionRelations {
  totalLead: number
  tipoUnidadEdificio?: {
    comision?: { id: string; porcentaje: number } | null
  } | null
  unidad?: {
    tipoUnidadEdificio?: {
      comision?: { id: string; porcentaje: number } | null
    } | null
  } | null
  edificio?: {
    comision?: { id: string; porcentaje: number } | null
  } | null
}
