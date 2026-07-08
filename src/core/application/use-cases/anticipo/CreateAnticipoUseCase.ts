import { Anticipo } from '@/core/domain/entities/Anticipo'
import { AnticipoRepository } from '@/core/application/ports/AnticipoRepository'
import { UserRepository } from '@/core/application/ports/UserRepository'
import { ValidationException } from '@/core/domain/exceptions'
import { CreateAnticipoDto } from '@/core/application/dto/anticipo.dto'

export class CreateAnticipoUseCase {
  constructor(
    private anticiPoRepo: AnticipoRepository,
    private userRepo: UserRepository
  ) {}

  async execute(dto: CreateAnticipoDto): Promise<Anticipo> {
    const broker = await this.userRepo.findById(dto.brokerId)
    if (!broker) {
      throw new ValidationException('Broker not found')
    }
    if (broker.role !== 'BROKER') {
      throw new ValidationException('User is not a broker')
    }

    const anticipo = new Anticipo(
      crypto.randomUUID(),
      dto.brokerId,
      dto.monto,
      new Date(dto.fecha),
      dto.mes,
      dto.anio,
      undefined,
      dto.descripcion,
      dto.paymentMethod,
      dto.referenceNumber
    )

    return this.anticiPoRepo.create(anticipo)
  }
}
