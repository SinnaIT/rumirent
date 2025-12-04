import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { UnitTypeTemplate } from '@/core/domain/entities/UnitTypeTemplate'
import { PrismaUnitTypeTemplateRepository } from '@/core/infrastructure/adapters/PrismaUnitTypeTemplateRepository'

const repository = new PrismaUnitTypeTemplateRepository(prisma)

/**
 * GET /api/admin/plantillas-tipo-unidad
 * List all unit type templates
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const templates = await repository.findAll({ activeOnly })

    // Count how many times each template has been used
    const templatesWithCount = await Promise.all(
      templates.map(async (template) => {
        const usageCount = await prisma.tipoUnidadEdificio.count({
          where: { plantillaOrigenId: template.id },
        })

        return {
          ...template.toJSON(),
          usageCount,
        }
      })
    )

    return NextResponse.json({
      success: true,
      templates: templatesWithCount,
    })
  } catch (error) {
    console.error('Error fetching unit type templates:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/plantillas-tipo-unidad
 * Create a new unit type template
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin role
    if (process.env.NODE_ENV !== 'development') {
      const authResult = await verifyAuth(request)
      if (!authResult.success || authResult.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { nombre, codigo, bedrooms, bathrooms, descripcion } = body

    // Validate required fields
    if (!nombre || !codigo) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const existsByCode = await repository.existsByCode(codigo)
    if (existsByCode) {
      return NextResponse.json(
        { error: 'A template with this code already exists' },
        { status: 409 }
      )
    }

    // Check if name already exists
    const existsByName = await repository.existsByName(nombre)
    if (existsByName) {
      return NextResponse.json(
        { error: 'A template with this name already exists' },
        { status: 409 }
      )
    }

    // Create template using domain entity
    const template = new UnitTypeTemplate(
      crypto.randomUUID(),
      nombre,
      codigo.toUpperCase(),
      bedrooms ?? null,
      bathrooms ?? null,
      descripcion ?? null,
      true,
      new Date(),
      new Date()
    )

    const created = await repository.create(template)

    return NextResponse.json({
      success: true,
      template: created.toJSON(),
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating unit type template:', error)

    // Handle domain validation errors
    if (error instanceof Error && error.message.includes('required')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
