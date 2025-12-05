import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

/**
 * POST /api/admin/edificios/[id]/tipos-unidad/toggle
 * Toggle a unit type template assignment to a building
 *
 * If the type exists: remove it (if no units attached)
 * If not exists: create it from template without commission
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin role
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { id: edificioId } = await params
    const body = await request.json()
    const { plantillaId } = body as { plantillaId: string }

    // Validate input
    if (!plantillaId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Check if building exists
    const edificio = await prisma.edificio.findUnique({
      where: { id: edificioId },
      select: { id: true },
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      )
    }

    // Get the template
    const template = await prisma.plantillaTipoUnidad.findUnique({
      where: { id: plantillaId },
    })

    if (!template || !template.activo) {
      return NextResponse.json(
        { error: 'Template not found or inactive' },
        { status: 404 }
      )
    }

    // Check if unit type already exists for this building from this template
    const existingType = await prisma.tipoUnidadEdificio.findFirst({
      where: {
        edificioId,
        plantillaOrigenId: plantillaId,
      },
      include: {
        _count: {
          select: {
            unidades: true,
          },
        },
      },
    })

    if (existingType) {
      // REMOVE: Check if it has associated units
      if (existingType._count.unidades > 0) {
        return NextResponse.json(
          {
            error: `Cannot remove this type. It has ${existingType._count.unidades} units associated.`,
          },
          { status: 400 }
        )
      }

      // Delete the type
      await prisma.tipoUnidadEdificio.delete({
        where: { id: existingType.id },
      })

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: `Unit type "${existingType.nombre}" removed from building`,
        tipoUnidadId: existingType.id,
      })
    } else {
      // CREATE: Add new unit type from template without commission
      const createdType = await prisma.tipoUnidadEdificio.create({
        data: {
          nombre: template.nombre,
          codigo: template.codigo,
          bedrooms: template.bedrooms,
          bathrooms: template.bathrooms,
          descripcion: template.descripcion,
          activo: true,
          edificio: {
            connect: { id: edificioId },
          },
          plantillaOrigen: {
            connect: { id: template.id },
          },
          // No commission assigned - must be set manually later
        },
        include: {
          plantillaOrigen: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        action: 'created',
        message: `Unit type "${createdType.nombre}" added to building`,
        tipoUnidad: createdType,
      })
    }
  } catch (error) {
    console.error('Error toggling unit type:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
