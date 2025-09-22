import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'CONTRATISTA') {
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
      contratistaId: authResult.user.id,
      fechaInicio,
      fechaFin,
      mes: mesNum,
      year: yearNum
    })

    // Primero verificar si el contratista tiene contratos en general
    const totalContratos = await prisma.contrato.count({
      where: {
        contratistaId: authResult.user.id,
      },
    })
    console.log(`Total contratos del contratista: ${totalContratos}`)

    // Buscar contratos del contratista en el mes específico
    const contratos = await prisma.contrato.findMany({
      where: {
        contratistaId: authResult.user.id,
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

    console.log(`Encontrados ${contratos.length} contratos para el usuario ${authResult.user.id}`)

    // Calcular comisiones para cada contrato
    const comisionesMensuales = contratos.map((contrato) => {
      // El schema muestra que la comisión ya está calculada en el campo 'comision'
      const montoComision = contrato.comision || 0

      // Calcular porcentaje basado en el tipo de unidad si existe
      let porcentajeComision = 0
      if (contrato.unidad?.tipoUnidadEdificio?.comision) {
        porcentajeComision = contrato.unidad.tipoUnidadEdificio.comision.porcentaje
      } else if (contrato.totalContrato && montoComision) {
        // Calcular porcentaje retroactivamente si no hay tipo de unidad
        porcentajeComision = (montoComision / contrato.totalContrato) * 100
      }

      return {
        id: contrato.id,
        contratoId: contrato.id,
        clienteNombre: contrato.cliente.nombre,
        edificioNombre: contrato.edificio?.nombre || 'Sin edificio',
        unidadCodigo: contrato.unidad?.numero || contrato.codigoUnidad || 'Sin código',
        montoComision,
        porcentajeComision: Math.round(porcentajeComision * 100) / 100, // Redondear a 2 decimales
        fechaContrato: contrato.createdAt.toISOString(),
        estadoContrato: contrato.estado,
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