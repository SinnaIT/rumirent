export interface BrokerRef {
  id: string
  nombre: string
  email: string
  rut?: string
}

export interface BrokerBasic extends BrokerRef {
  rut: string
  activo?: boolean
}
