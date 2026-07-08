import { z } from 'zod'

export const CreateAnticipoSchema = z.object({
  brokerId: z.string().min(1, 'Broker is required'),
  monto: z.number().positive('Amount must be greater than zero'),
  fecha: z.string().min(1, 'Date is required'),
  descripcion: z.string().optional(),
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
})

export type CreateAnticipoDto = z.infer<typeof CreateAnticipoSchema>

export const UpdateAnticipoSchema = z.object({
  monto: z.number().positive('Amount must be greater than zero').optional(),
  fecha: z.string().optional(),
  descripcion: z.string().nullable().optional(),
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().min(2020).max(2100).optional(),
  status: z.enum(['PENDIENTE', 'APLICADO', 'ANULADO']).optional(),
  paymentMethod: z.string().nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
})

export type UpdateAnticipoDto = z.infer<typeof UpdateAnticipoSchema>
