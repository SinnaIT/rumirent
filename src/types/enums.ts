export type EstadoLead =
  | 'INGRESADO'
  | 'ENTREGADO'
  | 'EN_EVALUACION'
  | 'OBSERVADO'
  | 'APROBADO'
  | 'RESERVA_PAGADA'
  | 'CONTRATO_FIRMADO'
  | 'CONTRATO_PAGADO'
  | 'DEPARTAMENTO_ENTREGADO'
  | 'RECHAZADO'
  | 'CANCELADO'
  | 'DESISTIDO'

export type EstadoUnidad = 'DISPONIBLE' | 'RESERVADA' | 'VENDIDA'

export interface EstadoLeadOption {
  value: EstadoLead
  label: string
  color: string
}

export const ESTADOS_LEAD: EstadoLeadOption[] = [
  { value: 'INGRESADO', label: 'Ingresado', color: 'bg-slate-100 text-slate-800' },
  { value: 'EN_EVALUACION', label: 'En Evaluación', color: 'bg-purple-100 text-purple-800' },
  { value: 'OBSERVADO', label: 'Observado', color: 'bg-orange-100 text-orange-800' },
  { value: 'APROBADO', label: 'Aprobado', color: 'bg-green-100 text-green-800' },
  { value: 'RESERVA_PAGADA', label: 'Reserva Pagada', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'CONTRATO_FIRMADO', label: 'Contrato Firmado', color: 'bg-teal-100 text-teal-800' },
  { value: 'CONTRATO_PAGADO', label: 'Contrato Pagado', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'DEPARTAMENTO_ENTREGADO', label: 'Departamento Entregado', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'RECHAZADO', label: 'Rechazado', color: 'bg-red-100 text-red-800' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
  { value: 'DESISTIDO', label: 'Desistido', color: 'bg-amber-100 text-amber-800' },
  { value: 'ENTREGADO', label: 'Entregado', color: 'bg-blue-100 text-blue-800' },
]

export const LEGACY_ESTADOS: EstadoLead[] = ['ENTREGADO', 'CANCELADO']
export const ESTADOS_LEAD_ACTIVE = ESTADOS_LEAD.filter(e => !LEGACY_ESTADOS.includes(e.value))
