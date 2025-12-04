import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { commissionRulesCache, formatYearMonth } from '@/lib/cache/commission-rules-cache'

interface ReglaComision {
  id: string
  cantidadMinima: number
  cantidadMaxima: number | null
  porcentaje: number
  comisionId: string
  comision: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
  }
}

interface RulesByComision {
  comision: {
    id: string
    nombre: string
    codigo: string
    porcentaje: number
  }
  reglas: ReglaComision[]
}

interface CommissionData {
  comisionId: string
  comisionNombre: string
  comisionCodigo: string
  porcentajeBase: number
  totalLeads: number
  currentRule: {
    id: string
    porcentaje: number
    cantidadMinima: number
    cantidadMaxima: number | null
  } | null
  nextRule: {
    id: string
    porcentaje: number
    cantidadMinima: number
    cantidadMaxima: number | null
  } | null
  untilNextLevel: number | null
}

interface MultiCommissionResponse {
  success: boolean
  date: string
  commissionData: Record<string, CommissionData>
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') // Expected format: YYYY-MM-DD
    const comisionIdParam = searchParams.get('comisionId') // Optional: filter by specific commission

    // Determine the target date (use provided date or default to today)
    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const yearMonth = formatYearMonth(targetDate)

    // Calculate month boundaries for filtering
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth()
    const startOfMonth = new Date(year, month, 1)
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

    // Check cache first
    const cachedData = commissionRulesCache.get<MultiCommissionResponse>(
      authResult.user.id,
      yearMonth,
      comisionIdParam || undefined
    )

    if (cachedData) {
      console.log(`[CommissionRules] Cache HIT for broker ${authResult.user.id}, month ${yearMonth}`)
      return NextResponse.json(cachedData)
    }

    console.log(`[CommissionRules] Cache MISS for broker ${authResult.user.id}, month ${yearMonth}`)

    // QUERY 1: Get all commission rules with their commission details (1 query)
    console.log('Fetching commission rules with comisionIdParam:', comisionIdParam)
    const reglasComision = await prisma.reglaComision.findMany({
      where: comisionIdParam ? { comisionId: comisionIdParam } : undefined,
      include: {
        comision: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            porcentaje: true
          }
        }
      },
      orderBy: {
        cantidadMinima: 'asc'
      }
    })
    console.log('Found', reglasComision.length, 'commission rules')
    console.log('Rules:', reglasComision)

    // QUERY 2: Get all broker's leads grouped by comisionId for the target month (1 query)
    console.log('Fetching leads count grouped by commission...')
    const leadsGroupedByComision = await prisma.lead.groupBy({
      by: ['comisionId'],
      where: {
        brokerId: authResult.user.id,
        comisionId: { not: null },
        estado: {
          notIn: ['RECHAZADO']
        },
        fechaPagoReserva: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _count: {
        id: true
      }
    })
    console.log('Found leads grouped:', leadsGroupedByComision)

    // Convert leads grouping to a Map for O(1) lookup
    const leadCountByComision = new Map<string, number>()
    for (const group of leadsGroupedByComision) {
      if (group.comisionId) {
        leadCountByComision.set(group.comisionId, group._count.id)
      }
    }
    console.log('Lead count by commission:', leadCountByComision)

    // Group rules by commission type
    const rulesByComision = reglasComision.reduce((acc, regla) => {
      const comisionId = regla.comisionId
      if (!acc[comisionId]) {
        acc[comisionId] = {
          comision: regla.comision,
          reglas: []
        }
      }
      acc[comisionId].reglas.push(regla)
      return acc
    }, {} as Record<string, RulesByComision>)

    console.log('Rules grouped by commission:', rulesByComision)
    // Get all unique commission IDs
    const allComisionIds = Object.keys(rulesByComision)

    // Build commission data for each commission type (all in-memory calculations)
    const commissionData: Record<string, CommissionData> = {}

    for (const comisionId of allComisionIds) {
      const { comision, reglas } = rulesByComision[comisionId]

      // Get lead count from our pre-fetched map (O(1) lookup, no DB query)
      const totalLeads = leadCountByComision.get(comisionId) || 0
      console.log(`Commission ${comision.nombre}: ${totalLeads} leads`)

      // Find current and next rule based on lead count (in-memory calculation)
      let currentRule = null
      let nextRule = null
      let untilNextLevel = null

      for (let i = 0; i < reglas.length; i++) {
        const regla = reglas[i]
        const matchesMinimum = totalLeads >= regla.cantidadMinima
        const matchesMaximum = regla.cantidadMaxima === null || totalLeads <= regla.cantidadMaxima
        console.log(`Rule ${regla.id}: min=${regla.cantidadMinima}, max=${regla.cantidadMaxima}, matchesMin=${matchesMinimum}, matchesMax=${matchesMaximum}`)

        if (matchesMinimum && matchesMaximum) {
          currentRule = {
            id: regla.id,
            porcentaje: regla.porcentaje,
            cantidadMinima: regla.cantidadMinima,
            cantidadMaxima: regla.cantidadMaxima
          }

          // Find next rule if exists
          if (i + 1 < reglas.length) {
            const nextRegla = reglas[i + 1]
            nextRule = {
              id: nextRegla.id,
              porcentaje: nextRegla.porcentaje,
              cantidadMinima: nextRegla.cantidadMinima,
              cantidadMaxima: nextRegla.cantidadMaxima
            }
            untilNextLevel = nextRegla.cantidadMinima - totalLeads
          }
          break
        }else if(!matchesMinimum && matchesMaximum){
          nextRule = {
            id: regla.id,
            porcentaje: regla.porcentaje,
            cantidadMinima: regla.cantidadMinima,
            cantidadMaxima: regla.cantidadMaxima
          }
          untilNextLevel = regla.cantidadMinima - totalLeads              
        }
      }

      commissionData[comisionId] = {
        comisionId: comision.id,
        comisionNombre: comision.nombre,
        comisionCodigo: comision.codigo,
        porcentajeBase: comision.porcentaje,
        totalLeads,
        currentRule,
        nextRule,
        untilNextLevel
      }
    }
    console.log('Commission data:', commissionData)
    const response: MultiCommissionResponse = {
      success: true,
      date: targetDate.toISOString().split('T')[0],
      commissionData
    }

    // Cache the result
    commissionRulesCache.set(
      authResult.user.id,
      yearMonth,
      response,
      comisionIdParam || undefined
    )

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error al obtener reglas de comisión del broker:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
