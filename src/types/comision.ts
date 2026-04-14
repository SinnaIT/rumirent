export interface ComisionRef {
  id: string
  nombre: string
  codigo: string
}

export interface ComisionBase extends ComisionRef {
  porcentaje: number
}

export interface Comision extends ComisionBase {
  activa: boolean
}
