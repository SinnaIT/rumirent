import { UnitTypeTemplate } from '@/core/domain/entities/UnitTypeTemplate'

/**
 * Port (Interface) for UnitTypeTemplate Repository
 * Defines available operations for managing unit type templates
 */
export interface UnitTypeTemplateRepository {
  /**
   * Creates a new unit type template
   */
  create(template: UnitTypeTemplate): Promise<UnitTypeTemplate>

  /**
   * Finds a template by ID
   */
  findById(id: string): Promise<UnitTypeTemplate | null>

  /**
   * Finds a template by code
   */
  findByCode(codigo: string): Promise<UnitTypeTemplate | null>

  /**
   * Gets all templates
   */
  findAll(options?: { activeOnly?: boolean }): Promise<UnitTypeTemplate[]>

  /**
   * Updates an existing template
   */
  update(id: string, template: Partial<UnitTypeTemplate>): Promise<UnitTypeTemplate>

  /**
   * Deletes a template (soft delete by setting activo = false)
   */
  delete(id: string): Promise<void>

  /**
   * Checks if a template exists with the given code
   */
  existsByCode(codigo: string, excludeId?: string): Promise<boolean>

  /**
   * Checks if a template exists with the given name
   */
  existsByName(nombre: string, excludeId?: string): Promise<boolean>

  /**
   * Gets templates by IDs (for bulk operations)
   */
  findByIds(ids: string[]): Promise<UnitTypeTemplate[]>
}
