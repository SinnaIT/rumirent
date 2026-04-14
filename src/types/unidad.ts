import type { EdificioRef } from './edificio'
import type { TipoUnidadRef } from './tipo-unidad'
import type { EstadoUnidad } from './enums'

export interface UnidadRef {
  id: string
  numero: string
  descripcion?: string
  metros2?: number
}

export interface UnidadBasic extends UnidadRef {
  estado: EstadoUnidad
}

export interface UnidadOption extends UnidadRef {
  estado: string
  tipoUnidadEdificio?: TipoUnidadRef
}

export interface UnidadWithEdificio extends UnidadRef {
  edificio: EdificioRef
  tipoUnidadEdificio?: TipoUnidadRef
}
