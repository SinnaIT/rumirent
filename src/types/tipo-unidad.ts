import type { ComisionBase, Comision } from './comision'

export interface TipoUnidadRef {
  id: string
  nombre: string
  codigo: string
}

export interface TipoUnidadBasic extends TipoUnidadRef {
  bedrooms?: number | null
  bathrooms?: number | null
  comision?: ComisionBase | null
}

export interface TipoUnidadWithComision extends TipoUnidadRef {
  comision: Comision | null
}
