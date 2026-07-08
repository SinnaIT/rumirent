import { Anticipo } from '@/core/domain/entities/Anticipo'
import { AnticipoStatus } from '@/core/domain/enums'
import { AnticipoRepository } from '@/core/application/ports/AnticipoRepository'
import { EntityNotFoundException } from '@/core/domain/exceptions'
import { UpdateAnticipoDto } from '@/core/application/dto/anticipo.dto'

export class UpdateAnticipoUseCase {
  constructor(private anticiPoRepo: AnticipoRepository) {}

  async execute(id: string, dto: UpdateAnticipoDto): Promise<Anticipo> {
    const anticipo = await this.anticiPoRepo.findById(id)
    if (!anticipo) {
      throw new EntityNotFoundException('Anticipo not found')
    }

    anticipo.update({
      monto: dto.monto,
      fecha: dto.fecha ? new Date(dto.fecha) : undefined,
      descripcion: dto.descripcion,
      mes: dto.mes,
      anio: dto.anio,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
    })

    if (dto.status) {
      if (dto.status === 'APLICADO') anticipo.apply()
      else if (dto.status === 'ANULADO') anticipo.cancel()
      else anticipo.status = AnticipoStatus.PENDIENTE
    }

    return this.anticiPoRepo.update(id, anticipo)
  }
}
