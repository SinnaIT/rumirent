import { AnticipoRepository } from '@/core/application/ports/AnticipoRepository'
import { EntityNotFoundException } from '@/core/domain/exceptions'

export class DeleteAnticipoUseCase {
  constructor(private anticiPoRepo: AnticipoRepository) {}

  async execute(id: string): Promise<void> {
    const anticipo = await this.anticiPoRepo.findById(id)
    if (!anticipo) {
      throw new EntityNotFoundException('Anticipo not found')
    }
    await this.anticiPoRepo.delete(id)
  }
}
