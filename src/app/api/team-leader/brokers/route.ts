import { NextRequest } from 'next/server'
import { requireTeamLeader } from '@/lib/auth'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { GetTeamBrokersUseCase } from '@/core/application/use-cases/team-leader/GetTeamBrokersUseCase'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireTeamLeader(request)
    if (user instanceof Response) return user

    const useCase = new GetTeamBrokersUseCase(prisma)
    const result = await useCase.execute(user.id)
    return successResponse(result)
  })
}
