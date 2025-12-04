import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyAuth } from '@/lib/auth'

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin role
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const mesParam = searchParams.get('mes')
    const anioParam = searchParams.get('anio')

    // Default to current month/year if not provided
    const now = new Date()
    const mes = mesParam ? parseInt(mesParam) : now.getMonth() + 1
    const anio = anioParam ? parseInt(anioParam) : now.getFullYear()

    // Validate parameters
    if (mes < 1 || mes > 12) {
      return NextResponse.json(
        { error: 'Mes inválido. Debe estar entre 1 y 12.' },
        { status: 400 }
      )
    }

    if (anio < 2000 || anio > 2100) {
      return NextResponse.json(
        { error: 'Año inválido.' },
        { status: 400 }
      )
    }

    // Calculate date range for the month
    const startDate = new Date(anio, mes - 1, 1)
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999)

    console.log(`🏁 RumiRace: Calculando ranking para ${MESES_NOMBRES[mes - 1]} ${anio}`)
    console.log(`📅 Rango de fechas: ${startDate.toISOString()} - ${endDate.toISOString()}`)

    // Fetch all leads for the specified month based on fechaPagoReserva
    // Exclude RECHAZADO leads
    const leads = await prisma.lead.findMany({
      where: {
        fechaPagoReserva: {
          gte: startDate,
          lte: endDate,
        },
        estado: {
          not: 'RECHAZADO'
        }
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            role: true,
          },
        },
      },
    })

    console.log(`📊 Encontrados ${leads.length} leads válidos para RumiRace`)

    // Group leads by broker and calculate metrics
    const brokerMap = new Map<string, {
      brokerId: string
      nombre: string
      email: string
      totalReservas: number
      montoTotalComisiones: number
      posicion: number
      leads: Array<{
        id: string
        totalLead: number
        comision: number
        estado: string
        fechaPagoReserva: Date | null
      }>
    }>()

    leads.forEach(lead => {
      // Only process if broker has BROKER role
      if (lead.broker.role !== 'BROKER') {
        return
      }

      const brokerId = lead.broker.id

      if (!brokerMap.has(brokerId)) {
        brokerMap.set(brokerId, {
          brokerId: brokerId,
          nombre: lead.broker.nombre,
          email: lead.broker.email,
          totalReservas: 0,
          montoTotalComisiones: 0,
          posicion: 0, // Will be set after sorting
          leads: [],
        })
      }

      const brokerData = brokerMap.get(brokerId)!

      // Add lead to array
      brokerData.leads.push({
        id: lead.id,
        totalLead: lead.totalLead,
        comision: lead.comision,
        estado: lead.estado,
        fechaPagoReserva: lead.fechaPagoReserva,
      })

      // Count reserva
      brokerData.totalReservas++

      // Sum commission amount
      brokerData.montoTotalComisiones += lead.comision
    })

    // Convert map to array and sort by total commission amount (DESC)
    const rankingData = Array.from(brokerMap.values())
      .sort((a, b) => b.montoTotalComisiones - a.montoTotalComisiones)
      .map((broker, index) => ({
        ...broker,
        posicion: index + 1, // Position starts at 1
      }))

    console.log(`🏆 Ranking generado con ${rankingData.length} brokers`)

    // Log top 3 for debugging
    rankingData.slice(0, 3).forEach(broker => {
      console.log(`  ${broker.posicion}. ${broker.nombre}: ${broker.totalReservas} reservas, $${broker.montoTotalComisiones.toLocaleString()} en comisiones`)
    })

    // Calculate totals
    const totales = {
      totalBrokers: rankingData.length,
      totalReservas: rankingData.reduce((sum, broker) => sum + broker.totalReservas, 0),
      montoTotalComisiones: rankingData.reduce((sum, broker) => sum + broker.montoTotalComisiones, 0),
    }

    return NextResponse.json({
      mes,
      anio,
      mesNombre: MESES_NOMBRES[mes - 1],
      ranking: rankingData,
      totales,
    })

  } catch (error) {
    console.error('❌ Error al generar RumiRace ranking:', error)
    return NextResponse.json(
      { error: 'Error al obtener el ranking' },
      { status: 500 }
    )
  }
}
