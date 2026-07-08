import { AnticipoStatus } from '@/core/domain/enums'
import { AnticipoRepository } from '@/core/application/ports/AnticipoRepository'

export class GetAnticiposByPeriodUseCase {
  constructor(private anticiPoRepo: AnticipoRepository) {}

  async execute(mes: number, anio: number, status: AnticipoStatus = AnticipoStatus.APLICADO): Promise<Map<string, number>> {
    return this.anticiPoRepo.sumByBrokerAndPeriod(mes, anio, status)
  }
}
