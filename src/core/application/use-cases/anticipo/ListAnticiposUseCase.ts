import { Anticipo } from '@/core/domain/entities/Anticipo'
import { AnticipoRepository, AnticipoFilters } from '@/core/application/ports/AnticipoRepository'

export class ListAnticiposUseCase {
  constructor(private anticiPoRepo: AnticipoRepository) {}

  async execute(filters?: AnticipoFilters): Promise<Anticipo[]> {
    return this.anticiPoRepo.findAll(filters)
  }
}
