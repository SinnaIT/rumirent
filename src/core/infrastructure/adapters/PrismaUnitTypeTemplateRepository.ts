import { PrismaClient } from '@prisma/client'
import { UnitTypeTemplate } from '@/core/domain/entities/UnitTypeTemplate'
import { UnitTypeTemplateRepository } from '@/core/application/ports/UnitTypeTemplateRepository'

/**
 * Prisma implementation of UnitTypeTemplate Repository
 */
export class PrismaUnitTypeTemplateRepository implements UnitTypeTemplateRepository {
  constructor(private prisma: PrismaClient) {}

  async create(template: UnitTypeTemplate): Promise<UnitTypeTemplate> {
    const created = await this.prisma.plantillaTipoUnidad.create({
      data: {
        id: template.id,
        nombre: template.nombre,
        codigo: template.codigo,
        bedrooms: template.bedrooms,
        bathrooms: template.bathrooms,
        descripcion: template.descripcion,
        activo: template.activo,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string): Promise<UnitTypeTemplate | null> {
    const template = await this.prisma.plantillaTipoUnidad.findUnique({
      where: { id },
    })

    return template ? this.toDomain(template) : null
  }

  async findByCode(codigo: string): Promise<UnitTypeTemplate | null> {
    const template = await this.prisma.plantillaTipoUnidad.findUnique({
      where: { codigo },
    })

    return template ? this.toDomain(template) : null
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<UnitTypeTemplate[]> {
    const templates = await this.prisma.plantillaTipoUnidad.findMany({
      where: options?.activeOnly ? { activo: true } : undefined,
      orderBy: [
        { nombre: 'asc' },
        { codigo: 'asc' },
      ],
    })

    return templates.map(this.toDomain)
  }

  async update(id: string, data: Partial<UnitTypeTemplate>): Promise<UnitTypeTemplate> {
    const updated = await this.prisma.plantillaTipoUnidad.update({
      where: { id },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        descripcion: data.descripcion,
        activo: data.activo,
      },
    })

    return this.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.plantillaTipoUnidad.update({
      where: { id },
      data: { activo: false },
    })
  }

  async existsByCode(codigo: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.plantillaTipoUnidad.count({
      where: {
        codigo,
        id: excludeId ? { not: excludeId } : undefined,
      },
    })

    return count > 0
  }

  async existsByName(nombre: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.plantillaTipoUnidad.count({
      where: {
        nombre,
        id: excludeId ? { not: excludeId } : undefined,
      },
    })

    return count > 0
  }

  async findByIds(ids: string[]): Promise<UnitTypeTemplate[]> {
    const templates = await this.prisma.plantillaTipoUnidad.findMany({
      where: {
        id: { in: ids },
        activo: true, // Only return active templates
      },
    })

    return templates.map(this.toDomain)
  }

  /**
   * Converts Prisma model to domain entity
   */
  private toDomain(prismaTemplate: {
    id: string
    nombre: string
    codigo: string
    bedrooms: number | null
    bathrooms: number | null
    descripcion: string | null
    activo: boolean
    createdAt: Date
    updatedAt: Date
  }): UnitTypeTemplate {
    return new UnitTypeTemplate(
      prismaTemplate.id,
      prismaTemplate.nombre,
      prismaTemplate.codigo,
      prismaTemplate.bedrooms,
      prismaTemplate.bathrooms,
      prismaTemplate.descripcion,
      prismaTemplate.activo,
      prismaTemplate.createdAt,
      prismaTemplate.updatedAt
    )
  }
}
