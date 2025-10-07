import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Prisma BEFORE any imports that use it
const prismaMock = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

// Now import after mocks are set up
const { POST } = await import('@/app/api/auth/login/route')
const { mockUsers, mockUserCredentials } = await import('../../../fixtures/user.fixtures')

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Successful Login', () => {
    it('should login successfully with valid admin credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(mockUserCredentials.admin),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(mockUsers.admin.email)
      expect(data.user.role).toBe('ADMIN')
      expect(data.token).toBeDefined()
      expect(typeof data.token).toBe('string')
    })

    it('should login successfully with valid broker credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUsers.broker)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(mockUserCredentials.broker),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe(mockUsers.broker.email)
      expect(data.user.role).toBe('BROKER')
      expect(data.token).toBeDefined()
    })

    it('should set auth-token cookie on successful login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(mockUserCredentials.admin),
      })

      const response = await POST(request)
      const cookie = response.cookies.get('auth-token')

      expect(cookie).toBeDefined()
      expect(cookie?.value).toBeDefined()
      expect(cookie?.value.length).toBeGreaterThan(0)
    })

    it('should not return password in response', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(mockUserCredentials.admin),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.user.password).toBeUndefined()
    })
  })

  describe('Failed Login Attempts', () => {
    it('should reject login with missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'Test123!' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email y contraseña son requeridos')
    })

    it('should reject login with missing password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email y contraseña son requeridos')
    })

    it('should reject login with non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'Test123!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Credenciales inválidas')
    })

    it('should reject login with incorrect password', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: mockUserCredentials.admin.email,
          password: 'WrongPassword123!',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Credenciales inválidas')
    })

    it('should handle database errors gracefully', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection error'))

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(mockUserCredentials.admin),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Error interno del servidor')
    })
  })

  describe('Security Considerations', () => {
    it('should not reveal if user exists on failed login', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const requestNonExistent = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'Test123!',
        }),
      })

      prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

      const requestWrongPassword = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: mockUsers.admin.email,
          password: 'WrongPassword123!',
        }),
      })

      const responseNonExistent = await POST(requestNonExistent)
      const responseWrongPassword = await POST(requestWrongPassword)

      const dataNonExistent = await responseNonExistent.json()
      const dataWrongPassword = await responseWrongPassword.json()

      // Both should return the same generic error message
      expect(dataNonExistent.error).toBe(dataWrongPassword.error)
      expect(responseNonExistent.status).toBe(responseWrongPassword.status)
    })

    it('should call database only once per login attempt', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(mockUserCredentials.admin),
      })

      await POST(request)

      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1)
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: mockUserCredentials.admin.email },
      })
    })
  })
})
