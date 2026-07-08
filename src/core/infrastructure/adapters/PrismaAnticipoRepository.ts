import { PrismaClient, AnticipoStatus as PrismaAnticipoStatus } from '@prisma/client'
import { Anticipo } from '@/core/domain/entities/Anticipo'
import { AnticipoRepository, AnticipoFilters } from '@/core/application/ports/AnticipoRepository'
import { AnticipoStatus } from '@/core/domain/enums'

export class PrismaAnticipoRepository implements AnticipoRepository {
  constructor(private prisma: PrismaClient) {}

  async create(anticipo: Anticipo): Promise<Anticipo> {
    const created = await this.prisma.anticipo.create({
      data: {
        id: anticipo.id,
        brokerId: anticipo.brokerId,
        monto: anticipo.monto,
        fecha: anticipo.fecha,
        descripcion: anticipo.descripcion,
        mes: anticipo.mes,
        anio: anticipo.anio,
        status: anticipo.status as PrismaAnticipoStatus,
        paymentMethod: anticipo.paymentMethod,
        referenceNumber: anticipo.referenceNumber,
      },
    })
    return this.toDomain(created)
  }

  async findById(id: string): Promise<Anticipo | null> {
    const record = await this.prisma.anticipo.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async findAll(filters?: AnticipoFilters): Promise<Anticipo[]> {
    const records = await this.prisma.anticipo.findMany({
      where: {
        ...(filters?.brokerId ? { brokerId: filters.brokerId } : {}),
        ...(filters?.mes !== undefined ? { mes: filters.mes } : {}),
        ...(filters?.anio !== undefined ? { anio: filters.anio } : {}),
        ...(filters?.status ? { status: filters.status as PrismaAnticipoStatus } : {}),
      },
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }, { fecha: 'desc' }],
    })
    return records.map((r) => this.toDomain(r))
  }

  async update(id: string, data: Partial<Anticipo>): Promise<Anticipo> {
    const updated = await this.prisma.anticipo.update({
      where: { id },
      data: {
        monto: data.monto,
        fecha: data.fecha,
        descripcion: data.descripcion,
        mes: data.mes,
        anio: data.anio,
        status: data.status as PrismaAnticipoStatus | undefined,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber,
      },
    })
    return this.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.anticipo.delete({ where: { id } })
  }

  async sumByBrokerAndPeriod(
    mes: number,
    anio: number,
    status: AnticipoStatus
  ): Promise<Map<string, number>> {
    const groups = await this.prisma.anticipo.groupBy({
      by: ['brokerId'],
      where: { mes, anio, status: status as PrismaAnticipoStatus },
      _sum: { monto: true },
    })
    const result = new Map<string, number>()
    for (const g of groups) {
      result.set(g.brokerId, g._sum.monto ?? 0)
    }
    return result
  }

  private toDomain(record: {
    id: string
    brokerId: string
    monto: number
    fecha: Date
    descripcion: string | null
    mes: number
    anio: number
    status: PrismaAnticipoStatus
    paymentMethod: string | null
    referenceNumber: string | null
    createdAt: Date
    updatedAt: Date
  }): Anticipo {
    return new Anticipo(
      record.id,
      record.brokerId,
      record.monto,
      record.fecha,
      record.mes,
      record.anio,
      record.status as AnticipoStatus,
      record.descripcion ?? undefined,
      record.paymentMethod ?? undefined,
      record.referenceNumber ?? undefined,
      record.createdAt,
      record.updatedAt
    )
  }
}
