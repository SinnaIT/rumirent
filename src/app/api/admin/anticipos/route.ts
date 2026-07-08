import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PrismaAnticipoRepository } from '@/core/infrastructure/adapters/PrismaAnticipoRepository'
import { PrismaUserRepository } from '@/core/infrastructure/adapters/PrismaUserRepository'
import { CreateAnticipoUseCase, ListAnticiposUseCase } from '@/core/application/use-cases/anticipo'
import { CreateAnticipoSchema } from '@/core/application/dto/anticipo.dto'
import { AnticipoStatus } from '@/core/domain/enums'
import { ValidationException } from '@/core/domain/exceptions'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brokerId = searchParams.get('brokerId') ?? undefined
    const mes = searchParams.get('mes')
    const anio = searchParams.get('anio')
    const status = searchParams.get('status') as AnticipoStatus | null

    const repo = new PrismaAnticipoRepository(prisma)
    const useCase = new ListAnticiposUseCase(repo)

    const anticipos = await useCase.execute({
      brokerId,
      mes: mes ? parseInt(mes) : undefined,
      anio: anio ? parseInt(anio) : undefined,
      status: status ?? undefined,
    })

    // Enrich with broker info for the response
    const ids = [...new Set(anticipos.map((a) => a.brokerId))]
    const brokers = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, nombre: true, email: true, rut: true },
    })
    const brokerMap = new Map(brokers.map((b) => [b.id, b]))

    const result = anticipos.map((a) => ({
      ...a.toJSON(),
      broker: brokerMap.get(a.brokerId) ?? null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching anticipos:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CreateAnticipoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const anticiPoRepo = new PrismaAnticipoRepository(prisma)
    const userRepo = new PrismaUserRepository(prisma)
    const useCase = new CreateAnticipoUseCase(anticiPoRepo, userRepo)

    const anticipo = await useCase.execute(parsed.data)

    const broker = await prisma.user.findUnique({
      where: { id: anticipo.brokerId },
      select: { id: true, nombre: true, email: true, rut: true },
    })

    return NextResponse.json({ ...anticipo.toJSON(), broker }, { status: 201 })
  } catch (error) {
    if (error instanceof ValidationException) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error creating anticipo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
