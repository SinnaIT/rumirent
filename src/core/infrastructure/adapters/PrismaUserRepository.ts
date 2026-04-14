import { PrismaClient, Role as PrismaRole } from '@prisma/client'
import { UserRepository, UserData, CreateUserData, UpdateUserData } from '@/core/application/ports/UserRepository'
import { hashPassword } from '@/lib/auth'

/**
 * Prisma implementation of UserRepository.
 */
export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    return user ? this.toDomain(user) : null
  }

  async findByEmail(email: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({ where: { email } })
    return user ? this.toDomain(user) : null
  }

  async findByRut(rut: string): Promise<UserData | null> {
    const user = await this.prisma.user.findUnique({ where: { rut } })
    return user ? this.toDomain(user) : null
  }

  async findByRole(role: string): Promise<UserData[]> {
    const users = await this.prisma.user.findMany({
      where: { role: role as PrismaRole },
      orderBy: { nombre: 'asc' },
    })
    return users.map(this.toDomain)
  }

  async create(data: CreateUserData): Promise<UserData> {
    const hashedPassword = await hashPassword(data.password)
    const created = await this.prisma.user.create({
      data: {
        email: data.email,
        nombre: data.nombre,
        rut: data.rut,
        password: hashedPassword,
        role: data.role as PrismaRole,
        telefono: data.telefono,
        birthDate: data.birthDate,
        mustChangePassword: data.mustChangePassword ?? true,
        activo: true,
        commissionTaxTypeId: data.commissionTaxTypeId ?? undefined,
      },
    })
    return this.toDomain(created)
  }

  async update(id: string, data: UpdateUserData): Promise<UserData> {
    const updateData: Record<string, unknown> = {}

    if (data.email !== undefined) updateData.email = data.email
    if (data.nombre !== undefined) updateData.nombre = data.nombre
    if (data.rut !== undefined) updateData.rut = data.rut
    if (data.telefono !== undefined) updateData.telefono = data.telefono
    if (data.birthDate !== undefined) updateData.birthDate = data.birthDate
    if (data.role !== undefined) updateData.role = data.role as PrismaRole
    if (data.commissionTaxTypeId !== undefined) updateData.commissionTaxTypeId = data.commissionTaxTypeId
    if (data.password !== undefined) {
      updateData.password = await hashPassword(data.password)
      updateData.mustChangePassword = true
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    })
    return this.toDomain(updated)
  }

  async toggleActive(id: string): Promise<UserData> {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new Error('User not found')

    const updated = await this.prisma.user.update({
      where: { id },
      data: { activo: !user.activo },
    })
    return this.toDomain(updated)
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        id: excludeId ? { not: excludeId } : undefined,
      },
    })
    return count > 0
  }

  async existsByRut(rut: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        rut,
        id: excludeId ? { not: excludeId } : undefined,
      },
    })
    return count > 0
  }

  private toDomain(user: {
    id: string
    email: string
    nombre: string
    rut: string
    telefono: string | null
    role: PrismaRole
    activo: boolean
    birthDate: Date | null
    mustChangePassword: boolean
    createdAt: Date
    updatedAt: Date
  }): UserData {
    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rut: user.rut,
      telefono: user.telefono,
      role: user.role,
      activo: user.activo,
      birthDate: user.birthDate,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
