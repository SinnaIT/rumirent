import { z } from 'zod'

// --- Admin: Create/Update Team Leader ---

export const CreateTeamLeaderSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  rut: z.string().min(1, 'RUT es requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefono: z.string().optional(),
  birthDate: z.string().optional(),
  taxTypeId: z.string().optional(),
})

export type CreateTeamLeaderDto = z.infer<typeof CreateTeamLeaderSchema>

export const UpdateTeamLeaderSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  nombre: z.string().min(1, 'Nombre es requerido').optional(),
  rut: z.string().min(1, 'RUT es requerido').optional(),
  telefono: z.string().optional(),
  birthDate: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  taxTypeId: z.string().nullable().optional(),
  role: z.enum(['BROKER', 'TEAM_LEADER']).optional(),
})

export type UpdateTeamLeaderDto = z.infer<typeof UpdateTeamLeaderSchema>

// --- Admin: Broker Assignment ---

export const AssignBrokerSchema = z.object({
  brokerId: z.string().min(1, 'ID del broker es requerido'),
})

export type AssignBrokerDto = z.infer<typeof AssignBrokerSchema>

export const UnassignBrokerSchema = z.object({
  brokerId: z.string().min(1, 'ID del broker es requerido'),
})

export type UnassignBrokerDto = z.infer<typeof UnassignBrokerSchema>

// --- Team Leader: Query params ---

export const TeamDashboardQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12).optional(),
  anio: z.coerce.number().int().min(2020).max(2100).optional(),
})

export type TeamDashboardQueryDto = z.infer<typeof TeamDashboardQuerySchema>

export const TeamReportQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12).optional(),
  anio: z.coerce.number().int().min(2020).max(2100).optional(),
  brokerId: z.string().optional(),
})

export type TeamReportQueryDto = z.infer<typeof TeamReportQuerySchema>
