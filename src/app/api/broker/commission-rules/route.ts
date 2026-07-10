import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireBrokerOrTeamLeader } from '@/lib/auth'
import { commissionRulesCache, formatYearMonth } from '@/lib/cache/commission-rules-cache'
import { resolveCurrentAndNextRule, EXCLUDED_LEAD_STATES } from '@/lib/commissions'
import type { MultiCommissionResponse } from '@/types/regla-comision'

export async function GET(request: NextRequest) {
  try {
    const user = await requireBrokerOrTeamLeader(request)
    if (user instanceof NextResponse) return user

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const comisionIdParam = searchParams.get('comisionId')

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const yearMonth = formatYearMonth(targetDate)

    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const cachedData = commissionRulesCache.get<MultiCommissionResponse>(
      user.id,
      yearMonth,
      comisionIdParam || undefined
    )

    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Fetch all commission rules in a single query (no N+1)
    const reglasComision = await prisma.reglaComision.findMany({
      where: comisionIdParam ? { comisionId: comisionIdParam } : undefined,
      include: {
        comision: {
          select: { id: true, nombre: true, codigo: true, porcentaje: true },
        },
      },
      orderBy: { cantidadMinima: 'asc' },
    })

    // Count broker leads grouped by comisionId for the target month
    // Uses fechaCheckin to match the recalculation date criterion
    const leadsGroupedByComision = await prisma.lead.groupBy({
      by: ['comisionId'],
      where: {
        brokerId: user.id,
        comisionId: { not: null },
        estado: { notIn: EXCLUDED_LEAD_STATES as unknown as string[] },
        fechaCheckin: { gte: startOfMonth, lte: endOfMonth },
      },
      _count: { id: true },
    })

    const leadCountByComision = new Map<string, number>()
    for (const group of leadsGroupedByComision) {
      if (group.comisionId) {
        leadCountByComision.set(group.comisionId, group._count.id)
      }
    }

    // Group rules by comision
    const rulesByComision = reglasComision.reduce(
      (acc, regla) => {
        if (!acc[regla.comisionId]) {
          acc[regla.comisionId] = { comision: regla.comision, reglas: [] }
        }
        acc[regla.comisionId].reglas.push(regla)
        return acc
      },
      {} as Record<string, { comision: (typeof reglasComision)[0]['comision']; reglas: typeof reglasComision }>
    )

    const commissionData: MultiCommissionResponse['commissionData'] = {}

    for (const [comisionId, { comision, reglas }] of Object.entries(rulesByComision)) {
      const totalLeads = leadCountByComision.get(comisionId) ?? 0

      const { currentRule, nextRule, untilNextLevel } = resolveCurrentAndNextRule(reglas, totalLeads)

      commissionData[comisionId] = {
        comisionId: comision.id,
        comisionNombre: comision.nombre,
        comisionCodigo: comision.codigo,
        porcentajeBase: comision.porcentaje,
        totalLeads,
        currentRule,
        nextRule,
        untilNextLevel,
      }
    }

    const response: MultiCommissionResponse = {
      success: true,
      date: targetDate.toISOString().split('T')[0],
      commissionData,
    }

    commissionRulesCache.set(user.id, yearMonth, response, comisionIdParam || undefined)

    return NextResponse.json(response)
  } catch (error) {
    console.error('[commission-rules] Error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
