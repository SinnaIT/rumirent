/**
 * Port (Interface) for the User repository.
 * Minimal interface needed for team-leader management.
 * Extensible for future migration of broker/admin modules.
 */
export interface UserData {
  id: string
  email: string
  nombre: string
  rut: string
  telefono: string | null
  role: string
  activo: boolean
  birthDate: Date | null
  mustChangePassword: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  email: string
  nombre: string
  rut: string
  password: string
  role: string
  telefono?: string
  birthDate?: Date
  mustChangePassword?: boolean
  commissionTaxTypeId?: string | null
}

export interface UpdateUserData {
  email?: string
  nombre?: string
  rut?: string
  telefono?: string
  birthDate?: Date
  password?: string
  role?: string
  commissionTaxTypeId?: string | null
}

export interface UserRepository {
  findById(id: string): Promise<UserData | null>
  findByEmail(email: string): Promise<UserData | null>
  findByRut(rut: string): Promise<UserData | null>
  findByRole(role: string): Promise<UserData[]>
  create(data: CreateUserData): Promise<UserData>
  update(id: string, data: UpdateUserData): Promise<UserData>
  toggleActive(id: string): Promise<UserData>
  existsByEmail(email: string, excludeId?: string): Promise<boolean>
  existsByRut(rut: string, excludeId?: string): Promise<boolean>
}
