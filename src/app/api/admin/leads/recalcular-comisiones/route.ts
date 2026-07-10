import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { recalculateCommissionsForPeriod } from '@/lib/commissions'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { mes, año } = body

    let firstDay: Date
    let lastDay: Date

    if (mes && año) {
      const monthIndex = parseInt(mes) - 1
      const year = parseInt(año)

      if (monthIndex < 0 || monthIndex > 11) {
        return NextResponse.json({ error: 'El mes debe estar entre 1 y 12' }, { status: 400 })
      }

      if (year < 2020 || year > 2030) {
        return NextResponse.json({ error: 'El año debe estar entre 2020 y 2030' }, { status: 400 })
      }

      firstDay = new Date(year, monthIndex, 1)
      lastDay = new Date(year, monthIndex + 1, 0, 23, 59, 59)
    } else {
      const now = new Date()
      firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const result = await recalculateCommissionsForPeriod(firstDay, lastDay)

    const mesNombre = firstDay.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

    return NextResponse.json({
      success: result.success,
      message: `Comisiones recalculadas exitosamente para ${result.updated} leads de ${mesNombre}`,
      estadisticas: {
        leadsEncontrados: result.totalProcessed,
        leadsActualizados: result.updated,
        errores: result.errors,
        gruposProcesados: result.groups,
        periodo: {
          desde: firstDay.toISOString(),
          hasta: lastDay.toISOString(),
          mes: firstDay.getMonth() + 1,
          año: firstDay.getFullYear(),
          mesNombre,
        },
      },
    })
  } catch (error) {
    console.error('[recalcular-comisiones] Unexpected error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
