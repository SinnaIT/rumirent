import { mockUsers } from './user.fixtures'

export const mockClientes = {
  cliente1: {
    id: 'cliente-1-id',
    nombre: 'Juan Pérez González',
    rut: '12345678-9',
    email: 'juan.perez@email.com',
    telefono: '+56912345678',
    brokerId: mockUsers.broker.id,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  cliente2: {
    id: 'cliente-2-id',
    nombre: 'María López Silva',
    rut: '98765432-1',
    email: 'maria.lopez@email.com',
    telefono: '+56987654321',
    brokerId: mockUsers.broker.id,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  clienteSinEmail: {
    id: 'cliente-3-id',
    nombre: 'Pedro Sánchez',
    rut: '11111111-K',
    email: null,
    telefono: '+56911111111',
    brokerId: mockUsers.broker.id,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
  },
}
