/**
 * Domain Entity: UnitTypeTemplate (PlantillaTipoUnidad)
 * Represents a global template for unit types that can be assigned to multiple projects
 */
export class UnitTypeTemplate {
  constructor(
    public readonly id: string,
    public nombre: string,
    public codigo: string,
    public bedrooms: number | null = null,
    public bathrooms: number | null = null,
    public descripcion: string | null = null,
    public activo: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.nombre || this.nombre.trim().length === 0) {
      throw new Error('Unit type template name is required')
    }

    if (!this.codigo || this.codigo.trim().length === 0) {
      throw new Error('Unit type template code is required')
    }

    // Code should be uppercase alphanumeric
    if (!/^[A-Z0-9]+$/.test(this.codigo)) {
      throw new Error('Unit type code must be uppercase alphanumeric (e.g., 1D, 2D, STU, PH)')
    }

    if (this.bedrooms !== null && this.bedrooms < 0) {
      throw new Error('Number of bedrooms cannot be negative')
    }

    if (this.bathrooms !== null && this.bathrooms < 0) {
      throw new Error('Number of bathrooms cannot be negative')
    }
  }

  /**
   * Updates the template information
   */
  update(data: {
    nombre?: string
    codigo?: string
    bedrooms?: number | null
    bathrooms?: number | null
    descripcion?: string | null
  }): void {
    if (data.nombre !== undefined) this.nombre = data.nombre
    if (data.codigo !== undefined) this.codigo = data.codigo
    if (data.bedrooms !== undefined) this.bedrooms = data.bedrooms
    if (data.bathrooms !== undefined) this.bathrooms = data.bathrooms
    if (data.descripcion !== undefined) this.descripcion = data.descripcion

    this.validate()
  }

  /**
   * Activates the template
   */
  activate(): void {
    this.activo = true
  }

  /**
   * Deactivates the template
   */
  deactivate(): void {
    this.activo = false
  }

  /**
   * Converts entity to plain object
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      codigo: this.codigo,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      descripcion: this.descripcion,
      activo: this.activo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  /**
   * Creates a copy of this template for use in a building
   */
  toUnitTypeData() {
    return {
      nombre: this.nombre,
      codigo: this.codigo,
      bedrooms: this.bedrooms,
      bathrooms: this.bathrooms,
      descripcion: this.descripcion,
      plantillaOrigenId: this.id,
    }
  }
}
