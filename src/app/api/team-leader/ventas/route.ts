import { NextRequest } from 'next/server'
import { requireTeamLeader } from '@/lib/auth'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { GetTeamSalesUseCase } from '@/core/application/use-cases/team-leader/GetTeamSalesUseCase'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireTeamLeader(request)
    if (user instanceof Response) return user

    const { searchParams } = new URL(request.url)
    const filterBrokerId = searchParams.get('brokerId') || undefined

    const useCase = new GetTeamSalesUseCase(prisma)
    const result = await useCase.execute(user.id, filterBrokerId)
    return successResponse(result)
  })
}
