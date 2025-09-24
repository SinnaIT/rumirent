import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'BROKER') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const mes = searchParams.get('mes')
    const year = searchParams.get('year')

    if (!mes || !year) {
      return NextResponse.json({ error: 'Mes y año son requeridos' }, { status: 400 })
    }

    const mesNum = parseInt(mes)
    const yearNum = parseInt(year)

    // Crear fechas de inicio y fin del mes
    const fechaInicio = new Date(yearNum, mesNum, 1)
    const fechaFin = new Date(yearNum, mesNum + 1, 0, 23, 59, 59, 999)

    console.log('Búsqueda de comisiones:', {
      brokerId: authResult.user.id,
      fechaInicio,
      fechaFin,
      mes: mesNum,
      year: yearNum
    })

    // Primero verificar si el broker tiene leads en general
    const totalLeads = await prisma.lead.count({
      where: {
        brokerId: authResult.user.id,
      },
    })
    console.log(`Total leads del broker: ${totalLeads}`)

    // Buscar leads del broker en el mes específico
    const leads = await prisma.lead.findMany({
      where: {
        brokerId: authResult.user.id,
        createdAt: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        cliente: true,
        unidad: {
          include: {
            edificio: true,
            tipoUnidadEdificio: {
              include: {
                comision: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Encontrados ${leads.length} leads para el usuario ${authResult.user.id}`)

    // Calcular comisiones para cada lead
    const comisionesMensuales = leads.map((lead) => {
      // El schema muestra que la comisión ya está calculada en el campo 'comision'
      const montoComision = lead.comision || 0

      // Calcular porcentaje basado en el tipo de unidad si existe
      let porcentajeComision = 0
      if (lead.unidad?.tipoUnidadEdificio?.comision) {
        porcentajeComision = lead.unidad.tipoUnidadEdificio.comision.porcentaje
      } else if (lead.totalLead && montoComision) {
        // Calcular porcentaje retroactivamente si no hay tipo de unidad
        porcentajeComision = (montoComision / lead.totalLead) * 100
      }

      return {
        id: lead.id,
        leadId: lead.id,
        clienteNombre: lead.cliente.nombre,
        edificioNombre: lead.edificio?.nombre || 'Sin edificio',
        unidadCodigo: lead.unidad?.numero || lead.codigoUnidad || 'Sin código',
        montoComision,
        porcentajeComision: Math.round(porcentajeComision * 100) / 100, // Redondear a 2 decimales
        fechaLead: lead.createdAt.toISOString(),
        estadoLead: lead.estado,
      }
    })

    return NextResponse.json(comisionesMensuales)
  } catch (error) {
    console.error('Error fetching comisiones mensuales:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}