import { EstadoUnidad } from '@prisma/client'

export const mockComisiones = {
  standard: {
    id: 'comision-standard-id',
    nombre: 'Comisión Estándar',
    codigo: 'STD',
    porcentaje: 3.5,
    activa: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  premium: {
    id: 'comision-premium-id',
    nombre: 'Comisión Premium',
    codigo: 'PREM',
    porcentaje: 5.0,
    activa: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  urgente: {
    id: 'comision-urgente-id',
    nombre: 'Comisión Urgente',
    codigo: 'URG',
    porcentaje: 7.0,
    activa: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const mockEdificios = {
  edificio1: {
    id: 'edificio-1-id',
    nombre: 'Edificio Plaza Central',
    direccion: 'Av. Principal 123, Santiago',
    descripcion: 'Edificio residencial de 10 pisos',
    comisionId: mockComisiones.standard.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  edificio2: {
    id: 'edificio-2-id',
    nombre: 'Edificio Vista Mar',
    direccion: 'Av. Costanera 456, Viña del Mar',
    descripcion: 'Edificio frente al mar con 15 pisos',
    comisionId: mockComisiones.premium.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const mockTiposUnidad = {
  tipo1Habitacion: {
    id: 'tipo-1hab-id',
    nombre: '1 Habitación',
    codigo: '1H',
    comisionId: mockComisiones.standard.id,
    edificioId: mockEdificios.edificio1.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  tipo2Habitaciones: {
    id: 'tipo-2hab-id',
    nombre: '2 Habitaciones',
    codigo: '2H',
    comisionId: mockComisiones.premium.id,
    edificioId: mockEdificios.edificio1.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  tipo3Habitaciones: {
    id: 'tipo-3hab-id',
    nombre: '3 Habitaciones',
    codigo: '3H',
    comisionId: mockComisiones.urgente.id,
    edificioId: mockEdificios.edificio1.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const mockUnidades = {
  unidad101: {
    id: 'unidad-101-id',
    numero: '101',
    estado: EstadoUnidad.DISPONIBLE,
    descripcion: 'Departamento en primer piso',
    metros2: 45.5,
    edificioId: mockEdificios.edificio1.id,
    tipoUnidadEdificioId: mockTiposUnidad.tipo1Habitacion.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  unidad201: {
    id: 'unidad-201-id',
    numero: '201',
    estado: EstadoUnidad.RESERVADA,
    descripcion: 'Departamento en segundo piso',
    metros2: 65.0,
    edificioId: mockEdificios.edificio1.id,
    tipoUnidadEdificioId: mockTiposUnidad.tipo2Habitaciones.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  unidad301: {
    id: 'unidad-301-id',
    numero: '301',
    estado: EstadoUnidad.VENDIDA,
    descripcion: 'Departamento en tercer piso',
    metros2: 85.0,
    edificioId: mockEdificios.edificio1.id,
    tipoUnidadEdificioId: mockTiposUnidad.tipo3Habitaciones.id,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}
