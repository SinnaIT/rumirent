import { AnticipoStatus } from '../enums'
import { ValidationException } from '../exceptions'

export class Anticipo {
  constructor(
    public readonly id: string,
    public brokerId: string,
    public monto: number,
    public fecha: Date,
    public mes: number,
    public anio: number,
    public status: AnticipoStatus = AnticipoStatus.PENDIENTE,
    public descripcion?: string,
    public paymentMethod?: string,
    public referenceNumber?: string,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.brokerId || this.brokerId.trim().length === 0) {
      throw new ValidationException('Broker is required')
    }
    if (this.monto <= 0) {
      throw new ValidationException('Amount must be greater than zero')
    }
    if (this.mes < 1 || this.mes > 12) {
      throw new ValidationException('Month must be between 1 and 12')
    }
    if (this.anio < 2020) {
      throw new ValidationException('Year must be 2020 or later')
    }
  }

  update(data: {
    monto?: number
    fecha?: Date
    descripcion?: string | null
    mes?: number
    anio?: number
    paymentMethod?: string | null
    referenceNumber?: string | null
  }): void {
    if (data.monto !== undefined) this.monto = data.monto
    if (data.fecha !== undefined) this.fecha = data.fecha
    if (data.descripcion !== undefined) this.descripcion = data.descripcion ?? undefined
    if (data.mes !== undefined) this.mes = data.mes
    if (data.anio !== undefined) this.anio = data.anio
    if (data.paymentMethod !== undefined) this.paymentMethod = data.paymentMethod ?? undefined
    if (data.referenceNumber !== undefined) this.referenceNumber = data.referenceNumber ?? undefined
    this.validate()
  }

  apply(): void {
    if (this.status === AnticipoStatus.ANULADO) {
      throw new ValidationException('Cannot apply a cancelled advance payment')
    }
    this.status = AnticipoStatus.APLICADO
  }

  cancel(): void {
    if (this.status === AnticipoStatus.ANULADO) {
      throw new ValidationException('Advance payment is already cancelled')
    }
    this.status = AnticipoStatus.ANULADO
  }

  toJSON() {
    return {
      id: this.id,
      brokerId: this.brokerId,
      monto: this.monto,
      fecha: this.fecha,
      mes: this.mes,
      anio: this.anio,
      status: this.status,
      descripcion: this.descripcion,
      paymentMethod: this.paymentMethod,
      referenceNumber: this.referenceNumber,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
