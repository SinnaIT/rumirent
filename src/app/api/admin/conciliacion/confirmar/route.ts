import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface ConciliacionMatch {
  excel: {
    fechaLead: string
    monto: number
    proyecto: string
    unidad: string
    raw: any
  }
  sistema: {
    id: string
    fechaLead: string
    totalLead: number
    edificioNombre: string
    unidadCodigo: string
    clienteNombre: string
    brokerNombre: string
    comision: number
    conciliado: boolean
  }
  tipo: 'automatico' | 'manual'
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { matches }: { matches: ConciliacionMatch[] } = await request.json()

    if (!matches || matches.length === 0) {
      return NextResponse.json({ error: 'No hay matches para conciliar' }, { status: 400 })
    }

    console.log(`Confirmando conciliación de ${matches.length} registros`)

    // Usar transacción para asegurar consistencia
    const result = await prisma.$transaction(async (tx) => {
      const updatedContracts = []

      for (const match of matches) {
        // Marcar el lead como conciliado
        const updatedContract = await tx.lead.update({
          where: {
            id: match.sistema.id,
          },
          data: {
            conciliado: true,
            fechaConciliacion: new Date(),
          },
          include: {
            cliente: { select: { nombre: true } },
            broker: { select: { nombre: true } },
            edificio: { select: { nombre: true } },
            unidad: { select: { numero: true } },
          },
        })

        updatedContracts.push({
          leadId: updatedContract.id,
          cliente: updatedContract.cliente.nombre,
          broker: updatedContract.broker.nombre,
          edificio: updatedContract.edificio.nombre,
          unidad: updatedContract.unidad?.numero || updatedContract.codigoUnidad,
          monto: updatedContract.totalLead,
          comision: updatedContract.comision,
          tipoMatch: match.tipo,
          confidence: match.confidence,
          fechaConciliacion: updatedContract.fechaConciliacion,
        })
      }

      return updatedContracts
    })

    console.log(`Conciliación confirmada exitosamente para ${result.length} leads`)

    return NextResponse.json({
      success: true,
      message: `Se conciliaron ${result.length} leads exitosamente`,
      conciliadosCount: result.length,
      leads: result,
      stats: {
        automaticos: matches.filter(m => m.tipo === 'automatico').length,
        manuales: matches.filter(m => m.tipo === 'manual').length,
        totalComisiones: result.reduce((sum, c) => sum + (c.comision || 0), 0),
        totalMontos: result.reduce((sum, c) => sum + c.monto, 0),
      },
    })
  } catch (error) {
    console.error('Error confirmando conciliación:', error)

    // Verificar si es un error de base de datos específico
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Uno o más leads ya no existen en el sistema' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Error interno del servidor al confirmar la conciliación' },
      { status: 500 }
    )
  }
}