import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma BEFORE any imports
const prismaMock = {
  edificio: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(async () => ({
    success: true,
    user: { userId: 'admin-test-id', email: 'admin@test.com', role: 'ADMIN' },
  })),
}))

// Now import after mocks are set up
const { GET, POST } = await import('@/app/api/admin/edificios/route')
const { mockEdificios, mockComisiones, mockUnidades } = await import('../../../fixtures/edificio.fixtures')
const { mockUsers } = await import('../../../fixtures/user.fixtures')

describe('GET /api/admin/edificios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set development mode
    process.env.NODE_ENV = 'development'
  })

  it('should return all edificios with statistics', async () => {
    const mockEdificioWithStats = {
      ...mockEdificios.edificio1,
      _count: { unidades: 3 },
      unidades: [
        {
          estado: 'DISPONIBLE',
          tipoUnidadEdificio: { nombre: '1 Habitación', codigo: '1H' },
        },
        {
          estado: 'RESERVADA',
          tipoUnidadEdificio: { nombre: '2 Habitaciones', codigo: '2H' },
        },
        {
          estado: 'VENDIDA',
          tipoUnidadEdificio: { nombre: '3 Habitaciones', codigo: '3H' },
        },
      ],
      comision: mockComisiones.standard,
    }

    prismaMock.edificio.findMany.mockResolvedValue([mockEdificioWithStats] as any)

    const request = new NextRequest('http://localhost:3000/api/admin/edificios')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.edificios).toHaveLength(1)
    expect(data.edificios[0].totalUnidades).toBe(3)
    expect(data.edificios[0].unidadesDisponibles).toBe(1)
    expect(data.edificios[0].unidadesReservadas).toBe(1)
    expect(data.edificios[0].unidadesVendidas).toBe(1)
  })

  it('should return empty array when no edificios exist', async () => {
    prismaMock.edificio.findMany.mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/admin/edificios')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.edificios).toHaveLength(0)
  })

  it('should include commission information', async () => {
    const mockEdificioWithComision = {
      ...mockEdificios.edificio1,
      _count: { unidades: 0 },
      unidades: [],
      comision: mockComisiones.standard,
    }

    prismaMock.edificio.findMany.mockResolvedValue([mockEdificioWithComision] as any)

    const request = new NextRequest('http://localhost:3000/api/admin/edificios')
    const response = await GET(request)
    const data = await response.json()

    expect(data.edificios[0].comision).toBeDefined()
    expect(data.edificios[0].comision.nombre).toBe(mockComisiones.standard.nombre)
    expect(data.edificios[0].comision.porcentaje).toBe(mockComisiones.standard.porcentaje)
  })

  it('should group units by type', async () => {
    const mockEdificioWithTypes = {
      ...mockEdificios.edificio1,
      _count: { unidades: 5 },
      unidades: [
        { estado: 'DISPONIBLE', tipoUnidadEdificio: { nombre: '1 Habitación', codigo: '1H' } },
        { estado: 'DISPONIBLE', tipoUnidadEdificio: { nombre: '1 Habitación', codigo: '1H' } },
        { estado: 'DISPONIBLE', tipoUnidadEdificio: { nombre: '2 Habitaciones', codigo: '2H' } },
        { estado: 'VENDIDA', tipoUnidadEdificio: { nombre: '2 Habitaciones', codigo: '2H' } },
        { estado: 'VENDIDA', tipoUnidadEdificio: { nombre: '3 Habitaciones', codigo: '3H' } },
      ],
      comision: mockComisiones.standard,
    }

    prismaMock.edificio.findMany.mockResolvedValue([mockEdificioWithTypes] as any)

    const request = new NextRequest('http://localhost:3000/api/admin/edificios')
    const response = await GET(request)
    const data = await response.json()

    expect(data.edificios[0].tiposUnidad).toBeDefined()
    expect(data.edificios[0].tiposUnidad).toHaveLength(3)

    const tipo1H = data.edificios[0].tiposUnidad.find((t: any) => t.tipo === '1 Habitación')
    const tipo2H = data.edificios[0].tiposUnidad.find((t: any) => t.tipo === '2 Habitaciones')
    const tipo3H = data.edificios[0].tiposUnidad.find((t: any) => t.tipo === '3 Habitaciones')

    expect(tipo1H.cantidad).toBe(2)
    expect(tipo2H.cantidad).toBe(2)
    expect(tipo3H.cantidad).toBe(1)
  })

  it('should handle database errors', async () => {
    prismaMock.edificio.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/admin/edificios')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Error interno del servidor')
  })
})

describe('POST /api/admin/edificios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'development'
  })

  it('should create a new edificio successfully', async () => {
    const newEdificioData = {
      nombre: 'Nuevo Edificio',
      direccion: 'Calle Nueva 123',
      descripcion: 'Edificio de prueba',
      comisionId: mockComisiones.standard.id,
    }

    prismaMock.edificio.findFirst.mockResolvedValue(null)
    prismaMock.edificio.create.mockResolvedValue({
      id: 'new-edificio-id',
      ...newEdificioData,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(newEdificioData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.edificio).toBeDefined()
    expect(data.edificio.nombre).toBe(newEdificioData.nombre)
  })

  it('should reject edificio creation with missing nombre', async () => {
    const invalidData = {
      direccion: 'Calle Nueva 123',
      comisionId: mockComisiones.standard.id,
    }

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Nombre y dirección son requeridos')
  })

  it('should reject edificio creation with missing direccion', async () => {
    const invalidData = {
      nombre: 'Nuevo Edificio',
      comisionId: mockComisiones.standard.id,
    }

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Nombre y dirección son requeridos')
  })

  it('should reject edificio creation with missing comisionId', async () => {
    const invalidData = {
      nombre: 'Nuevo Edificio',
      direccion: 'Calle Nueva 123',
    }

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('ID de comisión es requerido')
  })

  it('should reject duplicate edificio nombre', async () => {
    prismaMock.edificio.findFirst.mockResolvedValue(mockEdificios.edificio1 as any)

    const duplicateData = {
      nombre: mockEdificios.edificio1.nombre,
      direccion: 'Calle Nueva 123',
      comisionId: mockComisiones.standard.id,
    }

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(duplicateData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Ya existe un edificio con este nombre')
  })

  it('should create edificio without descripcion', async () => {
    const minimalData = {
      nombre: 'Edificio Mínimo',
      direccion: 'Calle Mínima 1',
      comisionId: mockComisiones.standard.id,
    }

    prismaMock.edificio.findFirst.mockResolvedValue(null)
    prismaMock.edificio.create.mockResolvedValue({
      id: 'minimal-edificio-id',
      ...minimalData,
      descripcion: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(minimalData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.edificio.nombre).toBe(minimalData.nombre)
  })

  it('should handle database errors during creation', async () => {
    prismaMock.edificio.findFirst.mockResolvedValue(null)
    prismaMock.edificio.create.mockRejectedValue(new Error('Database error'))

    const validData = {
      nombre: 'Nuevo Edificio',
      direccion: 'Calle Nueva 123',
      comisionId: mockComisiones.standard.id,
    }

    const request = new NextRequest('http://localhost:3000/api/admin/edificios', {
      method: 'POST',
      body: JSON.stringify(validData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Error interno del servidor')
  })
})
