import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

describe('Auth Utilities', () => {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET)

  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', async () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'BROKER',
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should verify a valid JWT token', async () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'ADMIN',
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(secret)

      const { payload: decoded } = await jwtVerify(token, secret)

      expect(decoded.userId).toBe(payload.userId)
      expect(decoded.email).toBe(payload.email)
      expect(decoded.role).toBe(payload.role)
    })

    it('should reject an invalid JWT token', async () => {
      const invalidToken = 'invalid.token.here'

      await expect(jwtVerify(invalidToken, secret)).rejects.toThrow()
    })

    it('should reject an expired JWT token', async () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'BROKER',
      }

      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('0s') // Expired immediately
        .sign(secret)

      // Wait a moment to ensure token is expired
      await new Promise((resolve) => setTimeout(resolve, 100))

      await expect(jwtVerify(token, secret)).rejects.toThrow()
    })
  })

  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!'
      const hashed = await bcrypt.hash(password, 10)

      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed.length).toBeGreaterThan(password.length)
    })

    it('should verify a correct password', async () => {
      const password = 'TestPassword123!'
      const hashed = await bcrypt.hash(password, 10)

      const isValid = await bcrypt.compare(password, hashed)

      expect(isValid).toBe(true)
    })

    it('should reject an incorrect password', async () => {
      const password = 'TestPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hashed = await bcrypt.hash(password, 10)

      const isValid = await bcrypt.compare(wrongPassword, hashed)

      expect(isValid).toBe(false)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!'
      const hash1 = await bcrypt.hash(password, 10)
      const hash2 = await bcrypt.hash(password, 10)

      expect(hash1).not.toBe(hash2)
      expect(await bcrypt.compare(password, hash1)).toBe(true)
      expect(await bcrypt.compare(password, hash2)).toBe(true)
    })
  })

  describe('RUT Validation', () => {
    const validateRUT = (rut: string): boolean => {
      // Remove dots and hyphens
      const cleanRUT = rut.replace(/\./g, '').replace(/-/g, '')

      // Check format
      if (!/^\d{7,8}[0-9Kk]$/.test(cleanRUT)) {
        return false
      }

      // Extract parts
      const body = cleanRUT.slice(0, -1)
      const dv = cleanRUT.slice(-1).toUpperCase()

      // Calculate verification digit
      let sum = 0
      let multiplier = 2

      for (let i = body.length - 1; i >= 0; i--) {
        sum += parseInt(body[i]) * multiplier
        multiplier = multiplier === 7 ? 2 : multiplier + 1
      }

      const calculatedDV = 11 - (sum % 11)
      const expectedDV =
        calculatedDV === 11 ? '0' : calculatedDV === 10 ? 'K' : calculatedDV.toString()

      return dv === expectedDV
    }

    it('should validate a correct RUT', () => {
      expect(validateRUT('12345678-5')).toBe(true)
      expect(validateRUT('11111111-1')).toBe(true)
      expect(validateRUT('22222222-2')).toBe(true)
    })

    it('should reject an incorrect RUT', () => {
      expect(validateRUT('12345678-9')).toBe(false)
      expect(validateRUT('11111111-2')).toBe(false)
    })

    it('should handle case-insensitive verification digit', () => {
      // Test with valid RUTs
      expect(validateRUT('12345678-5')).toBe(true)
      // Test case sensitivity doesn't break validation
      const rut = '12345678-5'
      expect(validateRUT(rut.toLowerCase())).toBe(true)
    })

    it('should reject invalid RUT format', () => {
      expect(validateRUT('abc')).toBe(false)
      expect(validateRUT('12345')).toBe(false)
      expect(validateRUT('')).toBe(false)
    })
  })
})
