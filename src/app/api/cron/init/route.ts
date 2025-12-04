import { NextRequest, NextResponse } from 'next/server'
import { initializeCronJobs } from '@/lib/cron'

/**
 * Este endpoint inicializa los trabajos programados (cron jobs)
 * Solo debe llamarse una vez cuando la aplicación se despliega
 * En desarrollo, se puede llamar manualmente para iniciar los jobs
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Initializing cron jobs via API endpoint')

    // En producción, podrías agregar autenticación aquí
    // Por ahora, solo verificamos que no se llame repetidamente

    initializeCronJobs()

    return NextResponse.json({
      success: true,
      message: 'Cron jobs initialized successfully',
      jobs: [
        {
          name: 'Commission Recalculation',
          schedule: 'Every hour at minute 0',
          timezone: 'America/Santiago'
        },
        {
          name: 'Execute Scheduled Commission Changes',
          schedule: 'Every hour at minute 0',
          timezone: 'America/Santiago'
        }
      ]
    })

  } catch (error) {
    console.error('❌ Error initializing cron jobs:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Error al inicializar trabajos programados', details: errorMessage },
      { status: 500 }
    )
  }
}
