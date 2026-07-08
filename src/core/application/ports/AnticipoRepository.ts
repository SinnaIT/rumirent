import { Anticipo } from '@/core/domain/entities/Anticipo'
import { AnticipoStatus } from '@/core/domain/enums'

export interface AnticipoFilters {
  brokerId?: string
  mes?: number
  anio?: number
  status?: AnticipoStatus
}

export interface AnticipoRepository {
  create(anticipo: Anticipo): Promise<Anticipo>
  findById(id: string): Promise<Anticipo | null>
  findAll(filters?: AnticipoFilters): Promise<Anticipo[]>
  update(id: string, data: Partial<Anticipo>): Promise<Anticipo>
  delete(id: string): Promise<void>
  /** Returns a map of brokerId -> total monto for the given period and status */
  sumByBrokerAndPeriod(mes: number, anio: number, status: AnticipoStatus): Promise<Map<string, number>>
}
