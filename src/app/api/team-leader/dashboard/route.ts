import { NextRequest } from 'next/server'
import { requireTeamLeader } from '@/lib/auth'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { TeamDashboardQuerySchema } from '@/core/application/dto/team-leader.dto'
import { GetTeamDashboardUseCase } from '@/core/application/use-cases/team-leader/GetTeamDashboardUseCase'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireTeamLeader(request)
    if (user instanceof Response) return user

    const { searchParams } = new URL(request.url)
    const query = TeamDashboardQuerySchema.parse({
      mes: Number(searchParams.get('mes')),
      anio: Number(searchParams.get('anio')),
    })

    const useCase = new GetTeamDashboardUseCase(prisma)

    const today = new Date()
    const mes = query.mes ?? today.getMonth() + 1
    const anio = query.anio ?? today.getFullYear()
    const result = await useCase.execute(user.id, mes, anio)
    return successResponse(result)
  })
}
