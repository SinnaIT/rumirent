import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { manualRecalculateCommissions, manualExecuteCommissionChanges } from '@/lib/cron'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual cron job execution requested')

    // Verificar autenticación y rol de administrador
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobType } = body

    console.log(`📝 Job type requested: ${jobType}`)

    if (!jobType) {
      return NextResponse.json(
        { error: 'Job type is required' },
        { status: 400 }
      )
    }

    let result

    switch (jobType) {
      case 'recalculate-commissions':
        result = await manualRecalculateCommissions()
        break

      case 'execute-commission-changes':
        result = await manualExecuteCommissionChanges()
        break

      case 'all':
        // Ejecutar ambos trabajos
        const result1 = await manualExecuteCommissionChanges()
        const result2 = await manualRecalculateCommissions()
        result = {
          success: true,
          message: 'Todos los trabajos ejecutados exitosamente',
          results: {
            commissionChanges: result1,
            commissionRecalculation: result2
          }
        }
        break

      default:
        return NextResponse.json(
          { error: `Unknown job type: ${jobType}` },
          { status: 400 }
        )
    }

    console.log('✅ Manual job execution completed successfully')

    return NextResponse.json({
      success: true,
      ...result
    })

  } catch (error) {
    console.error('❌ Error executing manual job:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error al ejecutar el trabajo programado', details: errorMessage },
      { status: 500 }
    )
  }
}
