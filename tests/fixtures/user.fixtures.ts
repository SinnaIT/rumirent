import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const mockUsers = {
  admin: {
    id: 'admin-test-id',
    email: 'admin@test.com',
    password: bcrypt.hashSync('Admin123!', 10),
    nombre: 'Admin Test',
    rut: '11111111-1',
    telefono: '+56912345678',
    role: Role.ADMIN,
    activo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  broker: {
    id: 'broker-test-id',
    email: 'broker@test.com',
    password: bcrypt.hashSync('Broker123!', 10),
    nombre: 'Broker Test',
    rut: '22222222-2',
    telefono: '+56987654321',
    role: Role.BROKER,
    activo: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  inactiveBroker: {
    id: 'inactive-broker-id',
    email: 'inactive@test.com',
    password: bcrypt.hashSync('Test123!', 10),
    nombre: 'Inactive Broker',
    rut: '33333333-3',
    telefono: '+56911111111',
    role: Role.BROKER,
    activo: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
}

export const mockUserCredentials = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
  },
  broker: {
    email: 'broker@test.com',
    password: 'Broker123!',
  },
}
