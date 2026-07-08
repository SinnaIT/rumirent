import { Anticipo } from '@/core/domain/entities/Anticipo'
import { AnticipoStatus } from '@/core/domain/enums'
import { AnticipoRepository } from '@/core/application/ports/AnticipoRepository'
import { EntityNotFoundException } from '@/core/domain/exceptions'

export class ChangeAnticipoStatusUseCase {
  constructor(private anticiPoRepo: AnticipoRepository) {}

  async execute(id: string, newStatus: AnticipoStatus): Promise<Anticipo> {
    const anticipo = await this.anticiPoRepo.findById(id)
    if (!anticipo) {
      throw new EntityNotFoundException('Anticipo not found')
    }

    if (newStatus === AnticipoStatus.APLICADO) {
      anticipo.apply()
    } else if (newStatus === AnticipoStatus.ANULADO) {
      anticipo.cancel()
    } else {
      anticipo.status = AnticipoStatus.PENDIENTE
    }

    return this.anticiPoRepo.update(id, anticipo)
  }
}
