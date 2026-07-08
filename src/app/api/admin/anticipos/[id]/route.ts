import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { PrismaAnticipoRepository } from '@/core/infrastructure/adapters/PrismaAnticipoRepository'
import {
  UpdateAnticipoUseCase,
  DeleteAnticipoUseCase,
} from '@/core/application/use-cases/anticipo'
import { UpdateAnticipoSchema } from '@/core/application/dto/anticipo.dto'
import { ValidationException, EntityNotFoundException } from '@/core/domain/exceptions'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const repo = new PrismaAnticipoRepository(prisma)
    const anticipo = await repo.findById(id)

    if (!anticipo) {
      return NextResponse.json({ error: 'Anticipo no encontrado' }, { status: 404 })
    }

    const broker = await prisma.user.findUnique({
      where: { id: anticipo.brokerId },
      select: { id: true, nombre: true, email: true, rut: true },
    })

    return NextResponse.json({ ...anticipo.toJSON(), broker })
  } catch (error) {
    console.error('Error fetching anticipo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const parsed = UpdateAnticipoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const repo = new PrismaAnticipoRepository(prisma)
    const useCase = new UpdateAnticipoUseCase(repo)
    const anticipo = await useCase.execute(id, parsed.data)

    const broker = await prisma.user.findUnique({
      where: { id: anticipo.brokerId },
      select: { id: true, nombre: true, email: true, rut: true },
    })

    return NextResponse.json({ ...anticipo.toJSON(), broker })
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return NextResponse.json({ error: 'Anticipo no encontrado' }, { status: 404 })
    }
    if (error instanceof ValidationException) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Error updating anticipo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const repo = new PrismaAnticipoRepository(prisma)
    const useCase = new DeleteAnticipoUseCase(repo)
    await useCase.execute(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof EntityNotFoundException) {
      return NextResponse.json({ error: 'Anticipo no encontrado' }, { status: 404 })
    }
    console.error('Error deleting anticipo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
