import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function GET(request: NextRequest) {
  try {
    // Authentication & Authorization
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const mes = searchParams.get('mes') || (new Date().getMonth() + 1).toString()
    const anio = searchParams.get('anio') || new Date().getFullYear().toString()
    const conciliado = searchParams.get('conciliado') || 'todos' // todos | si | no
    const brokerId = searchParams.get('brokerId') || 'todos'

    const mesNum = parseInt(mes)
    const anioNum = parseInt(anio)

    // Validate parameters
    if (isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      return NextResponse.json(
        { error: 'Mes inválido' },
        { status: 400 }
      )
    }

    if (isNaN(anioNum) || anioNum < 2000 || anioNum > 2100) {
      return NextResponse.json(
        { error: 'Año inválido' },
        { status: 400 }
      )
    }

    // Calculate date range for the selected month
    const startDate = new Date(anioNum, mesNum - 1, 1)
    const endDate = new Date(anioNum, mesNum, 0, 23, 59, 59, 999)

    // Build where clause
    const whereClause: any = {
      fechaCheckin: {
        gte: startDate,
        lte: endDate,
      },
      estado: {
        not: 'RECHAZADO'
        //,in:['PAGADO', 'CONCILIADO']
      },
      broker: {
        role: 'BROKER'
      }
    }

    // Apply conciliation filter
    if (conciliado === 'si') {
      whereClause.conciliado = true
    } else if (conciliado === 'no') {
      whereClause.conciliado = false
    }

    // Apply broker filter
    if (brokerId !== 'todos') {
      whereClause.brokerId = brokerId
    }

    // Fetch leads with all necessary relations
    const leads = await prisma.lead.findMany({
      where: whereClause,
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
            email: true,
            role: true,
          }
        },
        cliente: {
          select: {
            id: true,
            nombre: true,
            rut: true,
          }
        },
        edificio: {
          select: {
            id: true,
            nombre: true,
          }
        },
        tipoUnidadEdificio: {
          select: {
            id: true,
            nombre: true,
          }
        }
      },
      orderBy: {
        fechaPagoReserva: 'desc'
      }
    })

    // Group by broker and calculate summaries
    const brokerMap = new Map<string, {
      brokerId: string
      brokerNombre: string
      brokerEmail: string
      totalLeads: number
      totalMontoBruto: number
      totalComision: number
      totalComisionValida: number
      totalConciliado: number
      totalPendiente: number
      leadsConciliados: number
      leadsPendientes: number
      leadsValidos: number
      checkin: number
      anticipos: number
      despAnticipo: number
      leads: any[]
    }>()

    leads.forEach(lead => {
      const brokerId = lead.broker.id

      if (!brokerMap.has(brokerId)) {
        brokerMap.set(brokerId, {
          brokerId: brokerId,
          brokerNombre: lead.broker.nombre,
          brokerEmail: lead.broker.email,
          totalLeads: 0,
          totalMontoBruto: 0,
          totalComision: 0,
          totalComisionValida: 0,
          totalConciliado: 0,
          totalPendiente: 0,
          leadsConciliados: 0,
          leadsPendientes: 0,
          leadsValidos: 0,
          checkin: 0,
          anticipos: 0,
          despAnticipo: 0,
          leads: []
        })
      }

      const brokerData = brokerMap.get(brokerId)!

      // Check if lead is valid for commission payment
      const isValid = lead.estado === 'DEPARTAMENTO_ENTREGADO' && lead.fechaCheckin !== null

      brokerData.totalLeads += 1
      brokerData.totalMontoBruto += lead.totalLead
      brokerData.totalComision += lead.comision

      // Only add to valid commission if lead is valid
      if (isValid) {
        brokerData.totalComisionValida += lead.comision
        brokerData.leadsValidos += 1
      }

      // Count check-ins
      if (lead.fechaCheckin) {
        brokerData.checkin += 1
      }

      if (lead.conciliado) {
        brokerData.totalConciliado += lead.comision
        brokerData.leadsConciliados += 1
      } else {
        brokerData.totalPendiente += lead.comision
        brokerData.leadsPendientes += 1
      }

      // Calculate despAnticipo (comision valida - anticipos)
      brokerData.despAnticipo = brokerData.totalComisionValida - brokerData.anticipos

      brokerData.leads.push({
        id: lead.id,
        codigoUnidad: lead.codigoUnidad,
        totalLead: lead.totalLead,
        montoUf: lead.montoUf,
        comision: lead.comision,
        estado: lead.estado,
        conciliado: lead.conciliado,
        fechaPagoReserva: lead.fechaPagoReserva,
        fechaConciliacion: lead.fechaConciliacion,
        fechaCheckin: lead.fechaCheckin,
        isValid: isValid,
        cliente: {
          id: lead.cliente.id,
          nombre: lead.cliente.nombre,
          rut: lead.cliente.rut,
        },
        edificio: {
          id: lead.edificio.id,
          nombre: lead.edificio.nombre,
        },
        tipoUnidad: lead.tipoUnidadEdificio?.nombre || 'N/A'
      })
    })

    // Convert map to array and sort by total commission descending
    const brokersData = Array.from(brokerMap.values()).sort(
      (a, b) => b.totalComision - a.totalComision
    )

    // Calculate grand totals
    const leadsValidos = leads.filter(l => l.estado === 'DEPARTAMENTO_ENTREGADO' && l.fechaCheckin !== null)

    const totales = {
      totalBrokers: brokersData.length,
      totalLeads: leads.length,
      totalMontoBruto: leads.reduce((sum, lead) => sum + lead.totalLead, 0),
      totalComision: leadsValidos.reduce((sum, lead) => sum + lead.comision, 0),
      totalComisionValida: leadsValidos.reduce((sum, lead) => sum + lead.comision, 0),
      totalConciliado: leads.filter(l => l.conciliado).reduce((sum, lead) => sum + lead.comision, 0),
      totalPendiente: leadsValidos.filter(l => !l.conciliado).reduce((sum, lead) => sum + lead.comision, 0),
      leadsConciliados: leads.filter(l => l.conciliado).length,
      leadsPendientes: leadsValidos.filter(l => !l.conciliado).length,
      leadsValidos: leadsValidos.length,
      checkin: leads.filter(l => l.fechaCheckin).length,
      anticipos: 0,
      despAnticipo: leadsValidos.reduce((sum, lead) => sum + lead.comision, 0),
    }

    return NextResponse.json({
      success: true,
      mes: mesNum,
      anio: anioNum,
      mesNombre: MESES_NOMBRES[mesNum - 1],
      conciliadoFilter: conciliado,
      brokerIdFilter: brokerId,
      brokers: brokersData,
      totales: totales
    })

  } catch (error) {
    console.error('Error fetching commission summary:', error)
    return NextResponse.json(
      { error: 'Error al obtener el resumen de comisiones' },
      { status: 500 }
    )
  }
}
