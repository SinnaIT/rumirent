import type {
  CommissionResolution,
  LeadWithCommissionRelations,
  ReglaComisionRecord,
  RuleResolution,
} from '@/types/comision'

/**
 * Resolves the applicable commission source for a lead using 3-level priority:
 * 1. Lead's direct TipoUnidadEdificio commission
 * 2. Lead's Unidad > TipoUnidadEdificio commission
 * 3. Lead's Edificio commission
 */
export function resolveCommissionSource(lead: LeadWithCommissionRelations): CommissionResolution {
  if (lead.tipoUnidadEdificio?.comision) {
    return {
      porcentaje: lead.tipoUnidadEdificio.comision.porcentaje,
      comisionId: lead.tipoUnidadEdificio.comision.id,
      source: 'TipoUnidadEdificio',
    }
  }

  if (lead.unidad?.tipoUnidadEdificio?.comision) {
    return {
      porcentaje: lead.unidad.tipoUnidadEdificio.comision.porcentaje,
      comisionId: lead.unidad.tipoUnidadEdificio.comision.id,
      source: 'Unidad->TipoUnidadEdificio',
    }
  }

  if (lead.edificio?.comision) {
    return {
      porcentaje: lead.edificio.comision.porcentaje,
      comisionId: lead.edificio.comision.id,
      source: 'Edificio',
    }
  }

  return { porcentaje: 0, comisionId: null, source: 'None' }
}

/**
 * Given a sorted (asc by cantidadMinima) array of rules and a lead count,
 * returns the applicable rule or null if none matches.
 */
export function resolveApplicableRule(
  rules: ReglaComisionRecord[],
  leadCount: number
): ReglaComisionRecord | null {
  // Iterate in descending order to find the highest matching rule
  const sorted = [...rules].sort((a, b) => b.cantidadMinima - a.cantidadMinima)

  for (const rule of sorted) {
    const meetsMin = leadCount >= rule.cantidadMinima
    const meetsMax = rule.cantidadMaxima === null || leadCount <= rule.cantidadMaxima
    if (meetsMin && meetsMax) return rule
  }

  return null
}

/**
 * Calculates the commission monetary amount.
 */
export function calculateCommissionAmount(totalLead: number, porcentaje: number): number {
  return totalLead * porcentaje
}

/**
 * Given rules sorted ascending by cantidadMinima and a lead count,
 * returns the current active rule, the next rule to reach, and how many leads until next level.
 */
export function resolveCurrentAndNextRule(
  rules: ReglaComisionRecord[],
  leadCount: number
): RuleResolution {
  const sorted = [...rules].sort((a, b) => a.cantidadMinima - b.cantidadMinima)

  let currentRule: RuleResolution['currentRule'] = null
  let nextRule: RuleResolution['nextRule'] = null
  let untilNextLevel: number | null = null

  for (let i = 0; i < sorted.length; i++) {
    const rule = sorted[i]
    const meetsMin = leadCount >= rule.cantidadMinima
    const meetsMax = rule.cantidadMaxima === null || leadCount <= rule.cantidadMaxima

    if (meetsMin && meetsMax) {
      currentRule = {
        id: rule.id,
        porcentaje: rule.porcentaje,
        cantidadMinima: rule.cantidadMinima,
        cantidadMaxima: rule.cantidadMaxima,
      }
      if (i + 1 < sorted.length) {
        const next = sorted[i + 1]
        nextRule = {
          id: next.id,
          porcentaje: next.porcentaje,
          cantidadMinima: next.cantidadMinima,
          cantidadMaxima: next.cantidadMaxima,
        }
        untilNextLevel = next.cantidadMinima - leadCount
      }
      break
    }

    // leadCount is below this rule's minimum — it becomes the next achievable rule
    if (!meetsMin) {
      nextRule = {
        id: rule.id,
        porcentaje: rule.porcentaje,
        cantidadMinima: rule.cantidadMinima,
        cantidadMaxima: rule.cantidadMaxima,
      }
      untilNextLevel = rule.cantidadMinima - leadCount
      break
    }
  }

  return { currentRule, nextRule, untilNextLevel }
}
