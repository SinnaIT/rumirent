import { NextRequest } from 'next/server'
import { successResponse, withErrorHandler } from '@/lib/api-response'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AssignBrokerSchema } from '@/core/application/dto/team-leader.dto'
import { AssignBrokerUseCase } from '@/core/application/use-cases/team-leader/AssignBrokerUseCase'
import { UnassignBrokerUseCase } from '@/core/application/use-cases/team-leader/UnassignBrokerUseCase'
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
    const brokers = await prisma.user.findMany({
      where: { teamLeaderId: id, role: 'BROKER' },
      select: { id: true, nombre: true, email: true, rut: true, activo: true },
      orderBy: { nombre: 'asc' },
    })

    return successResponse({ brokers })
  })
}

export async function POST(
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
    const dto = AssignBrokerSchema.parse(body)

    const useCase = new AssignBrokerUseCase(prisma)
    const assignment = await useCase.execute(id, dto.brokerId)

    return successResponse({ assignment }, 201)
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
    const { searchParams } = new URL(request.url)
    const brokerId = searchParams.get('brokerId')

    if (!brokerId) {
      throw new Error('brokerId es requerido')
    }

    const useCase = new UnassignBrokerUseCase(prisma)
    await useCase.execute(id, brokerId)

    return successResponse({ message: 'Broker desasignado' })
  })
}
