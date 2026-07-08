export type AnticipoStatus = 'PENDIENTE' | 'APLICADO' | 'ANULADO'

export interface Anticipo {
  id: string
  brokerId: string
  monto: number
  fecha: string
  descripcion: string | null
  mes: number
  anio: number
  status: AnticipoStatus
  paymentMethod: string | null
  referenceNumber: string | null
  createdAt: string
  updatedAt: string
  broker: { id: string; nombre: string; email: string; rut: string }
}

export interface AnticipoFormData {
  brokerId: string
  monto: number
  fecha: string
  descripcion?: string
  mes: number
  anio: number
  status?: AnticipoStatus
  paymentMethod?: string
  referenceNumber?: string
}
