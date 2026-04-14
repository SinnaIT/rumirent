import { NextRequest } from 'next/server'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ToggleTeamLeaderStatusUseCase } from '@/core/application/use-cases/team-leader/ToggleTeamLeaderStatusUseCase'
import { PrismaUserRepository } from '@/core/infrastructure/adapters/PrismaUserRepository'
import { UnauthorizedException } from '@/core/domain/exceptions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      throw new UnauthorizedException()
    }

    const { id } = await params
    const useCase = new ToggleTeamLeaderStatusUseCase(new PrismaUserRepository(prisma))
    const teamLeader = await useCase.execute(id)

    return successResponse({ teamLeader })
  })
}
