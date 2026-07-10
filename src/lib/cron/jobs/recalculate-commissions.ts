import { recalculateCommissionsForPeriod } from '@/lib/commissions'

/**
 * Recalculates commissions for leads in the current and previous month.
 * Groups by broker + month (from fechaCheckin) + base commission.
 * Excludes RECHAZADO and CANCELADO leads.
 */
export async function recalculateCommissions() {
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return recalculateCommissionsForPeriod(startDate, endDate)
}
