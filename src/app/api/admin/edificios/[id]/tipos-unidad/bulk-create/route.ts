import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { PrismaUnitTypeTemplateRepository } from '@/core/infrastructure/adapters/PrismaUnitTypeTemplateRepository'
import { Prisma } from '@prisma/client'

const templateRepository = new PrismaUnitTypeTemplateRepository(prisma)

/**
 * POST /api/admin/edificios/[id]/tipos-unidad/bulk-create
 * Bulk assign unit type templates to a building
 *
 * Logic:
 * - For each selected template:
 *   - If a unit type with same code exists in building → Update it (nombre, bedrooms, bathrooms, descripcion)
 *   - If not exists → Create new unit type from template
 * - All created/updated types will reference the template as plantillaOrigenId
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
    const { plantillaIds, comisionId } = body as {
      plantillaIds: string[]
      comisionId?: string
    }

    // Validate input
    if (!plantillaIds || !Array.isArray(plantillaIds) || plantillaIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one template ID is required' },
        { status: 400 }
      )
    }

    // Check if building exists
    const edificio = await prisma.edificio.findUnique({
      where: { id: edificioId },
      select: { id: true, comisionId: true },
    })

    if (!edificio) {
      return NextResponse.json(
        { error: 'Building not found' },
        { status: 404 }
      )
    }

    // Get selected templates
    const templates = await templateRepository.findByIds(plantillaIds)

    if (templates.length === 0) {
      return NextResponse.json(
        { error: 'No active templates found with provided IDs' },
        { status: 404 }
      )
    }

    // Determine commission to use (optional, only if explicitly provided)
    let finalComisionId: string | null = null

    if (comisionId !== undefined) {
      // If comisionId is explicitly provided (could be null to clear it)
      finalComisionId = comisionId

      // Verify commission exists if provided and not null
      if (finalComisionId) {
        const comisionExists = await prisma.comision.findUnique({
          where: { id: finalComisionId },
        })

        if (!comisionExists) {
          return NextResponse.json(
            { error: 'Invalid commission ID' },
            { status: 400 }
          )
        }
      }
    }
    // If comisionId is not provided at all, leave it as null (optional)

    // Get existing unit types in the building
    const existingUnitTypes = await prisma.tipoUnidadEdificio.findMany({
      where: { edificioId },
      select: { id: true, codigo: true },
    })

    const existingCodeMap = new Map(
      existingUnitTypes.map(ut => [ut.codigo, ut.id])
    )

    const created: Prisma.TipoUnidadEdificioGetPayload<{}>[] = []
    const updated: Prisma.TipoUnidadEdificioGetPayload<{}>[] = []

    // Process each template
    for (const template of templates) {
      const existingId = existingCodeMap.get(template.codigo)

      if (existingId) {
        // UPDATE existing unit type
        const updatedType = await prisma.tipoUnidadEdificio.update({
          where: { id: existingId },
          data: {
            nombre: template.nombre,
            bedrooms: template.bedrooms,
            bathrooms: template.bathrooms,
            descripcion: template.descripcion,
            plantillaOrigenId: template.id, // Track template origin
          },
        })

        updated.push(updatedType)
      } else {
        // CREATE new unit type from template
        const createData: any = {
          nombre: template.nombre,
          codigo: template.codigo,
          bedrooms: template.bedrooms,
          bathrooms: template.bathrooms,
          descripcion: template.descripcion,
          activo: true,
          edificio: {
            connect: { id: edificioId }
          },
          plantillaOrigen: template.id ? {
            connect: { id: template.id }
          } : undefined,
        }

        // Only add comisionId if it was explicitly provided
        if (comisionId !== undefined && finalComisionId) {
          createData.comision = {
            connect: { id: finalComisionId }
          }
        }

        const createdType = await prisma.tipoUnidadEdificio.create({
          data: createData,
        })

        created.push(createdType)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${templates.length} templates`,
      summary: {
        created: created.length,
        updated: updated.length,
        total: created.length + updated.length,
      },
      data: {
        created,
        updated,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Error bulk creating unit types:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
