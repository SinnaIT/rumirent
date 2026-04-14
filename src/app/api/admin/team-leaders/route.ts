import { NextRequest } from 'next/server'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { CreateTeamLeaderSchema } from '@/core/application/dto/team-leader.dto'
import { CreateTeamLeaderUseCase } from '@/core/application/use-cases/team-leader/CreateTeamLeaderUseCase'
import { ListTeamLeadersUseCase } from '@/core/application/use-cases/team-leader/ListTeamLeadersUseCase'
import { PrismaUserRepository } from '@/core/infrastructure/adapters/PrismaUserRepository'
import { UnauthorizedException } from '@/core/domain/exceptions'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      throw new UnauthorizedException()
    }

    const useCase = new ListTeamLeadersUseCase(prisma)
    const teamLeaders = await useCase.execute()

    return successResponse({ teamLeaders })
  })
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      throw new UnauthorizedException()
    }

    const body = await request.json()
    const dto = CreateTeamLeaderSchema.parse(body)

    const useCase = new CreateTeamLeaderUseCase(new PrismaUserRepository(prisma))
    const teamLeader = await useCase.execute(dto)

    return successResponse({ teamLeader }, 201)
  })
}
