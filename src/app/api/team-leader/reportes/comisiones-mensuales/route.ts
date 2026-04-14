import { NextRequest } from 'next/server'
import { requireTeamLeader } from '@/lib/auth'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { TeamReportQuerySchema } from '@/core/application/dto/team-leader.dto'
import { GetTeamCommissionsUseCase } from '@/core/application/use-cases/team-leader/GetTeamCommissionsUseCase'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireTeamLeader(request)
    if (user instanceof Response) return user

    const { searchParams } = new URL(request.url)
    const query = TeamReportQuerySchema.parse({
      mes: Number(searchParams.get('mes')),
      anio: Number(searchParams.get('year') || searchParams.get('anio')),
      brokerId: searchParams.get('brokerId') || undefined,
    })

    const useCase = new GetTeamCommissionsUseCase(prisma)

    const today = new Date()
    const mes = query.mes ?? today.getMonth() + 1
    const anio = query.anio ?? today.getFullYear()
    const result = await useCase.executeMonthly(user.id, mes, anio, query.brokerId)
    return successResponse(result)
  })
}
