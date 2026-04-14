import { NextRequest } from 'next/server'
import { requireTeamLeader } from '@/lib/auth'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { GetTeamCommissionsUseCase } from '@/core/application/use-cases/team-leader/GetTeamCommissionsUseCase'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    const user = await requireTeamLeader(request)
    if (user instanceof Response) return user

    const { searchParams } = new URL(request.url)
    const anio = Number(searchParams.get('year') || searchParams.get('anio') || new Date().getFullYear())
    const brokerId = searchParams.get('brokerId') || undefined

    const useCase = new GetTeamCommissionsUseCase(prisma)
    const result = await useCase.executeAnnual(user.id, anio, brokerId)
    return successResponse({ resumen: result })
  })
}
