import { prisma } from '@/lib/db'
import type { EstadoLead } from '@prisma/client'
import type { RecalculationResult, ReglaComisionRecord } from '@/types/comision'
import { resolveApplicableRule, calculateCommissionAmount, resolveCommissionSource } from './resolve-commission'

export const EXCLUDED_LEAD_STATES = ['RECHAZADO', 'CANCELADO'] as const

type LeadForRecalculation = {
  id: string
  totalLead: number
  brokerId: string
  fechaCheckin: Date
  comisionBase: { id: string; porcentaje: number } | null
  // Relations for commission resolution when comisionBase is null
  tipoUnidadEdificio: { comision: { id: string; porcentaje: number } | null } | null
  unidad: {
    tipoUnidadEdificio: { comision: { id: string; porcentaje: number } | null } | null
  } | null
  edificio: { comision: { id: string; porcentaje: number } | null } | null
}

type GroupEntry = {
  comisionId: string
  porcentaje: number
  brokerId: string
  period: string
  leads: LeadForRecalculation[]
}

/**
 * Fetches all leads eligible for commission recalculation within the given period.
 * Includes leads WITHOUT comisionId so they can be counted in their group via
 * commission resolution from building/unit structure.
 */
async function fetchLeadsForRecalculation(
  startDate: Date,
  endDate: Date
): Promise<LeadForRecalculation[]> {
  const results = await prisma.lead.findMany({
    where: {
      fechaCheckin: { gte: startDate, lte: endDate },
      estado: { notIn: EXCLUDED_LEAD_STATES as unknown as EstadoLead[] },
    },
    select: {
      id: true,
      totalLead: true,
      brokerId: true,
      fechaCheckin: true,
      comisionBase: { select: { id: true, porcentaje: true } },
      tipoUnidadEdificio: { select: { comision: { select: { id: true, porcentaje: true } } } },
      unidad: {
        select: {
          tipoUnidadEdificio: { select: { comision: { select: { id: true, porcentaje: true } } } },
        },
      },
      edificio: { select: { comision: { select: { id: true, porcentaje: true } } } },
    },
  })
  return results as unknown as LeadForRecalculation[]
}

/**
 * Resolves the effective commission (id + base porcentaje) for a lead.
 * Prefers the already-stored comisionBase, then falls back to 3-level structural resolution.
 */
function resolveLeadCommission(
  lead: LeadForRecalculation
): { comisionId: string; porcentaje: number } | null {
  if (lead.comisionBase) {
    return { comisionId: lead.comisionBase.id, porcentaje: lead.comisionBase.porcentaje }
  }
  const resolution = resolveCommissionSource(lead)
  if (resolution.comisionId) {
    return { comisionId: resolution.comisionId, porcentaje: resolution.porcentaje }
  }
  return null
}

/**
 * Groups leads by brokerId > monthKey (from fechaCheckin) > comisionId.
 * Leads with no resolvable commission are skipped and counted as ignored.
 */
function groupLeadsByBrokerMonthCommission(leads: LeadForRecalculation[]): {
  grouped: Map<string, Map<string, Map<string, GroupEntry>>>
  ignored: number
} {
  const grouped = new Map<string, Map<string, Map<string, GroupEntry>>>()
  let ignored = 0

  for (const lead of leads) {
    const commission = resolveLeadCommission(lead)
    if (!commission) {
      ignored++
      continue
    }

    const month = lead.fechaCheckin.getMonth() + 1
    const year = lead.fechaCheckin.getFullYear()
    const period = `${year}-${String(month).padStart(2, '0')}`
    const { brokerId } = lead
    const { comisionId, porcentaje } = commission

    if (!grouped.has(brokerId)) grouped.set(brokerId, new Map())
    if (!grouped.get(brokerId)!.has(period)) grouped.get(brokerId)!.set(period, new Map())
    if (!grouped.get(brokerId)!.get(period)!.has(comisionId)) {
      grouped.get(brokerId)!.get(period)!.set(comisionId, {
        comisionId,
        porcentaje,
        brokerId,
        period,
        leads: [],
      })
    }

    grouped.get(brokerId)!.get(period)!.get(comisionId)!.leads.push(lead)
  }

  return { grouped, ignored }
}

/**
 * Fetches all commission rules in a single query and groups them by comisionId.
 * Eliminates the N+1 query that would occur if fetching per group.
 */
async function fetchAllCommissionRules(): Promise<Map<string, ReglaComisionRecord[]>> {
  const rules = await prisma.reglaComision.findMany({
    select: {
      id: true,
      porcentaje: true,
      cantidadMinima: true,
      cantidadMaxima: true,
      comisionId: true,
    },
    orderBy: { cantidadMinima: 'asc' },
  })

  const byComisionId = new Map<string, ReglaComisionRecord[]>()
  for (const rule of rules) {
    if (!byComisionId.has(rule.comisionId)) byComisionId.set(rule.comisionId, [])
    byComisionId.get(rule.comisionId)!.push(rule)
  }

  return byComisionId
}

/**
 * Applies commission updates in per-group transactions.
 * A failure in one group does not roll back others.
 * Also sets comisionId on leads that didn't have it (first-time resolution).
 */
async function applyCommissionUpdates(
  grouped: Map<string, Map<string, Map<string, GroupEntry>>>,
  rulesByComisionId: Map<string, ReglaComisionRecord[]>
): Promise<{ updated: number; errors: number; groups: number }> {
  let updated = 0
  let errors = 0
  let groups = 0

  for (const monthsMap of grouped.values()) {
    for (const commissionsMap of monthsMap.values()) {
      for (const group of commissionsMap.values()) {
        groups++
        const { comisionId, porcentaje, leads } = group
        const rules = rulesByComisionId.get(comisionId) ?? []
        const applicableRule = resolveApplicableRule(rules, leads.length)

        const finalPorcentaje = applicableRule?.porcentaje ?? porcentaje
        const reglaComisionId = applicableRule?.id ?? null

        try {
          await prisma.$transaction(
            leads.map((lead) =>
              prisma.lead.update({
                where: { id: lead.id },
                data: {
                  comision: calculateCommissionAmount(lead.totalLead, finalPorcentaje),
                  reglaComisionId,
                  comisionId, // confirm or set for the first time
                },
              })
            )
          )
          updated += leads.length
        } catch (err) {
          console.error(
            `[commissions] Failed group brokerId=${group.brokerId} period=${group.period} comisionId=${comisionId}:`,
            err
          )
          errors += leads.length
        }
      }
    }
  }

  return { updated, errors, groups }
}

/**
 * Main entry point for batch commission recalculation.
 * Used by both the cron job and the manual admin endpoint.
 */
export async function recalculateCommissionsForPeriod(
  startDate: Date,
  endDate: Date
): Promise<RecalculationResult> {
  const leads = await fetchLeadsForRecalculation(startDate, endDate)

  if (leads.length === 0) {
    return { success: true, totalProcessed: 0, updated: 0, errors: 0, groups: 0 }
  }

  const { grouped, ignored } = groupLeadsByBrokerMonthCommission(leads)
  const rulesByComisionId = await fetchAllCommissionRules()
  const { updated, errors, groups } = await applyCommissionUpdates(grouped, rulesByComisionId)

  const processable = leads.length - ignored
  console.info(
    `[commissions] Recalculation done — period: ${startDate.toISOString().slice(0, 10)} to ${endDate.toISOString().slice(0, 10)} | fetched: ${leads.length} | ignored (no commission source): ${ignored} | groups: ${groups} | updated: ${updated} | errors: ${errors}`
  )

  return {
    success: errors === 0,
    totalProcessed: processable,
    updated,
    errors,
    groups,
  }
}
