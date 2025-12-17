import cron from 'node-cron'
import { recalculateCommissions } from './jobs/recalculate-commissions'
import { executeScheduledCommissionChanges } from './jobs/execute-commission-changes'

let isInitialized = false

export function initializeCronJobs() {
  if (isInitialized) {
    console.log('⏰ Cron jobs already initialized')
    return
  }

  console.log('⏰ Initializing cron jobs...')

  // Ejecutar cada hora (minuto 0 de cada hora)
  // Cron expression: '0 */2 * * *' = At minute 0 of every two
  cron.schedule('0 */2 * * *', async () => {
    console.log('⏰ [CRON] Starting hourly commission recalculation job...')
    try {
      await recalculateCommissions()
      console.log('✅ [CRON] Commission recalculation completed successfully')
    } catch (error) {
      console.error('❌ [CRON] Error in commission recalculation:', error)
    }
  }, {
    timezone: 'America/Santiago' // Chile timezone
  })

  // Ejecutar cambios de comisión programados cada hora
  cron.schedule('0 6,12,22 * * *', async () => {
    console.log('⏰ [CRON] Starting scheduled commission changes execution...')
    try {
      await executeScheduledCommissionChanges()
      console.log('✅ [CRON] Scheduled commission changes executed successfully')
    } catch (error) {
      console.error('❌ [CRON] Error executing scheduled commission changes:', error)
    }
  }, {
    timezone: 'America/Santiago' // Chile timezone
  })

  isInitialized = true
  console.log('✅ Cron jobs initialized successfully')
  console.log('📅 Jobs scheduled:')
  console.log('   - Commission recalculation: Every hour at minute 0')
  console.log('   - Scheduled commission changes: Every hour at minute 0')
  console.log('   - Timezone: America/Santiago (Chile)')
}

// Manual trigger functions for testing/admin purposes
export async function manualRecalculateCommissions() {
  console.log('🔧 [MANUAL] Starting manual commission recalculation...')
  try {
    await recalculateCommissions()
    console.log('✅ [MANUAL] Commission recalculation completed')
    return { success: true, message: 'Comisiones recalculadas exitosamente' }
  } catch (error) {
    console.error('❌ [MANUAL] Error in commission recalculation:', error)
    throw error
  }
}

export async function manualExecuteCommissionChanges() {
  console.log('🔧 [MANUAL] Starting manual commission changes execution...')
  try {
    await executeScheduledCommissionChanges()
    console.log('✅ [MANUAL] Commission changes executed')
    return { success: true, message: 'Cambios programados ejecutados exitosamente' }
  } catch (error) {
    console.error('❌ [MANUAL] Error executing commission changes:', error)
    throw error
  }
}
