import { NextRequest } from 'next/server'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UpdateTeamLeaderSchema } from '@/core/application/dto/team-leader.dto'
import { UpdateTeamLeaderUseCase } from '@/core/application/use-cases/team-leader/UpdateTeamLeaderUseCase'
import { GetTeamLeaderDetailUseCase } from '@/core/application/use-cases/team-leader/GetTeamLeaderDetailUseCase'
import { PrismaUserRepository } from '@/core/infrastructure/adapters/PrismaUserRepository'
import { UnauthorizedException } from '@/core/domain/exceptions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      throw new UnauthorizedException()
    }

    const { id } = await params
    const useCase = new GetTeamLeaderDetailUseCase(prisma)
    const teamLeader = await useCase.execute(id)

    return successResponse({ teamLeader })
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      throw new UnauthorizedException()
    }

    const { id } = await params
    const body = await request.json()
    const dto = UpdateTeamLeaderSchema.parse(body)

    const useCase = new UpdateTeamLeaderUseCase(new PrismaUserRepository(prisma), prisma)
    const teamLeader = await useCase.execute(id, dto)

    return successResponse({ teamLeader })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      throw new UnauthorizedException()
    }

    const { id } = await params

    // Check if has assigned brokers
    const assignedBrokersCount = await prisma.user.count({
      where: { teamLeaderId: id, role: 'BROKER' },
    })

    if (assignedBrokersCount > 0) {
      throw new Error('No se puede eliminar: tiene brokers asignados. Desasigne los brokers primero.')
    }

    await prisma.user.delete({ where: { id } })

    return successResponse({ message: 'Líder de equipo eliminado' })
  })
}
