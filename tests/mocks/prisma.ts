import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended'
import { beforeEach } from 'vitest'

// Mock Prisma Client
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

beforeEach(() => {
  mockReset(prismaMock)
})
