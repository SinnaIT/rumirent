import type { Prisma, PrismaClient } from '@prisma/client'

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'> | Prisma.TransactionClient

/**
 * Maps a lead estado to the corresponding Unidad estado.
 * - CANCELADO / RECHAZADO → DISPONIBLE (released)
 * - DEPARTAMENTO_ENTREGADO / CONTRATO_PAGADO → VENDIDA
 * - any other active state → RESERVADA
 */
export function mapLeadEstadoToUnidadEstado(
  leadEstado: string
): 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA' {
  switch (leadEstado) {
    case 'CANCELADO':
    case 'RECHAZADO':
      return 'DISPONIBLE'
    case 'CONTRATO_PAGADO':
    case 'DEPARTAMENTO_ENTREGADO':
      return 'VENDIDA'
    default:
      return 'RESERVADA'
  }
}

/**
 * Syncs the Unidad.estado based on the current lead state.
 * When the lead's unit reference changes, also releases the previous unit
 * (unless it is already VENDIDA).
 */
export async function syncUnidadEstadoForLead(
  tx: TxClient,
  params: {
    newUnidadId: string | null
    previousUnidadId: string | null
    leadEstado: string
  }
): Promise<void> {
  const { newUnidadId, previousUnidadId, leadEstado } = params

  // Release the previous unit if it was swapped out
  if (previousUnidadId && previousUnidadId !== newUnidadId) {
    const previous = await tx.unidad.findUnique({
      where: { id: previousUnidadId },
      select: { estado: true }
    })
    if (previous && previous.estado !== 'VENDIDA') {
      await tx.unidad.update({
        where: { id: previousUnidadId },
        data: { estado: 'DISPONIBLE' }
      })
    }
  }

  if (!newUnidadId) return

  const nextEstado = mapLeadEstadoToUnidadEstado(leadEstado)
  await tx.unidad.update({
    where: { id: newUnidadId },
    data: { estado: nextEstado }
  })
}
