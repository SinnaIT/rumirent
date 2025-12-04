import { Empresa } from '@/core/domain/entities/Empresa'
import { TipoEntidad } from '@/core/domain/enums'

/**
 * Port (Interface) para el repositorio de Empresa
 * Define las operaciones disponibles para gestionar empresas
 */
export interface EmpresaRepository {
  /**
   * Crea una nueva empresa
   */
  create(empresa: Empresa): Promise<Empresa>

  /**
   * Busca una empresa por ID
   */
  findById(id: string): Promise<Empresa | null>

  /**
   * Busca una empresa por RUT
   */
  findByRut(rut: string): Promise<Empresa | null>

  /**
   * Obtiene todas las empresas
   */
  findAll(options?: { activeOnly?: boolean; tipo?: TipoEntidad }): Promise<Empresa[]>

  /**
   * Busca empresas por tipo
   */
  findByTipo(tipo: TipoEntidad, options?: { activeOnly?: boolean }): Promise<Empresa[]>

  /**
   * Actualiza una empresa existente
   */
  update(id: string, empresa: Partial<Empresa>): Promise<Empresa>

  /**
   * Elimina una empresa (soft delete)
   */
  delete(id: string): Promise<void>

  /**
   * Verifica si existe una empresa con el RUT dado
   */
  existsByRut(rut: string, excludeId?: string): Promise<boolean>
}
