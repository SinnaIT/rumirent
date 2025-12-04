import { TipoEntidad } from '../enums';

/**
 * Entidad de Dominio: Empresa
 * Representa una empresa encargada o dueña de proyectos inmobiliarios
 */
export class Empresa {
  constructor(
    public readonly id: string,
    public nombre: string,
    public rut: string,
    public razonSocial: string,
    public tipoEntidad: TipoEntidad,
    public direccion?: string,
    public telefono?: string,
    public email?: string,
    public activa: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {
    this.validate()
  }

  private validate(): void {
    if (!this.nombre || this.nombre.trim().length === 0) {
      throw new Error('El nombre de la empresa es requerido')
    }

    if (!this.rut || this.rut.trim().length === 0) {
      throw new Error('El RUT de la empresa es requerido')
    }

    if (!this.razonSocial || this.razonSocial.trim().length === 0) {
      throw new Error('La razón social es requerida')
    }

    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error('El email no es válido')
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Actualiza la información de la empresa
   */
  update(data: {
    nombre?: string
    razonSocial?: string
    tipoEntidad?: TipoEntidad
    direccion?: string
    telefono?: string
    email?: string
  }): void {
    if (data.nombre !== undefined) this.nombre = data.nombre
    if (data.razonSocial !== undefined) this.razonSocial = data.razonSocial
    if (data.tipoEntidad !== undefined) this.tipoEntidad = data.tipoEntidad
    if (data.direccion !== undefined) this.direccion = data.direccion
    if (data.telefono !== undefined) this.telefono = data.telefono
    if (data.email !== undefined) this.email = data.email

    this.validate()
  }

  /**
   * Activa la empresa
   */
  activate(): void {
    this.activa = true
  }

  /**
   * Desactiva la empresa
   */
  deactivate(): void {
    this.activa = false
  }

  /**
   * Convierte la entidad a objeto plano
   */
  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      rut: this.rut,
      razonSocial: this.razonSocial,
      tipoEntidad: this.tipoEntidad,
      direccion: this.direccion,
      telefono: this.telefono,
      email: this.email,
      activa: this.activa,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
