import { PrismaClient } from '@prisma/client'
import { Empresa } from '@/core/domain/entities/Empresa'
import { EmpresaRepository } from '@/core/application/ports/EmpresaRepository'

/**
 * Implementación del repositorio de Empresa usando Prisma
 */
export class PrismaEmpresaRepository implements EmpresaRepository {
  constructor(private prisma: PrismaClient) {}

  async create(empresa: Empresa): Promise<Empresa> {
    const created = await this.prisma.empresa.create({
      data: {
        id: empresa.id,
        nombre: empresa.nombre,
        rut: empresa.rut,
        razonSocial: empresa.razonSocial,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        email: empresa.email,
        activa: empresa.activa,
      },
    })

    return this.toDomain(created)
  }

  async findById(id: string): Promise<Empresa | null> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id },
    })

    return empresa ? this.toDomain(empresa) : null
  }

  async findByRut(rut: string): Promise<Empresa | null> {
    const empresa = await this.prisma.empresa.findUnique({
      where: { rut },
    })

    return empresa ? this.toDomain(empresa) : null
  }

  async findAll(options?: { activeOnly?: boolean }): Promise<Empresa[]> {
    const empresas = await this.prisma.empresa.findMany({
      where: options?.activeOnly ? { activa: true } : undefined,
      orderBy: { nombre: 'asc' },
    })

    return empresas.map(this.toDomain)
  }

  async update(id: string, data: Partial<Empresa>): Promise<Empresa> {
    const updated = await this.prisma.empresa.update({
      where: { id },
      data: {
        nombre: data.nombre,
        razonSocial: data.razonSocial,
        direccion: data.direccion,
        telefono: data.telefono,
        email: data.email,
        activa: data.activa,
      },
    })

    return this.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.empresa.update({
      where: { id },
      data: { activa: false },
    })
  }

  async existsByRut(rut: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.empresa.count({
      where: {
        rut,
        id: excludeId ? { not: excludeId } : undefined,
      },
    })

    return count > 0
  }

  /**
   * Convierte el modelo de Prisma a entidad de dominio
   */
  private toDomain(prismaEmpresa: any): Empresa {
    return new Empresa(
      prismaEmpresa.id,
      prismaEmpresa.nombre,
      prismaEmpresa.rut,
      prismaEmpresa.razonSocial,
      prismaEmpresa.direccion,
      prismaEmpresa.telefono,
      prismaEmpresa.email,
      prismaEmpresa.activa,
      prismaEmpresa.createdAt,
      prismaEmpresa.updatedAt
    )
  }
}
