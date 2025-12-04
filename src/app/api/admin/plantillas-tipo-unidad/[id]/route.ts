import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'
import { PrismaUnitTypeTemplateRepository } from '@/core/infrastructure/adapters/PrismaUnitTypeTemplateRepository'

const repository = new PrismaUnitTypeTemplateRepository(prisma)

/**
 * GET /api/admin/plantillas-tipo-unidad/[id]
 * Get a specific unit type template
 */
export async function GET(
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

    const { id } = await params
    const template = await repository.findById(id)

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Count usage
    const usageCount = await prisma.tipoUnidadEdificio.count({
      where: { plantillaOrigenId: id },
    })

    return NextResponse.json({
      success: true,
      template: {
        ...template.toJSON(),
        usageCount,
      },
    })
  } catch (error) {
    console.error('Error fetching template:', error)
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
 * PUT /api/admin/plantillas-tipo-unidad/[id]
 * Update a unit type template
 */
export async function PUT(
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

    const { id } = await params
    const body = await request.json()
    const { nombre, codigo, bedrooms, bathrooms, descripcion, activo } = body

    // Check if template exists
    const existing = await repository.findById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Check if code already exists (excluding current template)
    if (codigo && codigo !== existing.codigo) {
      const existsByCode = await repository.existsByCode(codigo, id)
      if (existsByCode) {
        return NextResponse.json(
          { error: 'A template with this code already exists' },
          { status: 409 }
        )
      }
    }

    // Check if name already exists (excluding current template)
    if (nombre && nombre !== existing.nombre) {
      const existsByName = await repository.existsByName(nombre, id)
      if (existsByName) {
        return NextResponse.json(
          { error: 'A template with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update template
    existing.update({
      nombre,
      codigo: codigo?.toUpperCase(),
      bedrooms: bedrooms === undefined ? existing.bedrooms : bedrooms,
      bathrooms: bathrooms === undefined ? existing.bathrooms : bathrooms,
      descripcion: descripcion === undefined ? existing.descripcion : descripcion,
    })

    if (activo !== undefined) {
      activo ? existing.activate() : existing.deactivate()
    }

    const updated = await repository.update(id, existing)

    return NextResponse.json({
      success: true,
      template: updated.toJSON(),
    })
  } catch (error) {
    console.error('Error updating template:', error)

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

/**
 * DELETE /api/admin/plantillas-tipo-unidad/[id]
 * Delete (deactivate) a unit type template
 */
export async function DELETE(
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

    const { id } = await params

    // Check if template exists
    const existing = await repository.findById(id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    // Soft delete (deactivate)
    await repository.delete(id)

    return NextResponse.json({
      success: true,
      message: 'Template deactivated successfully',
    })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
