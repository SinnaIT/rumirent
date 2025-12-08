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
    const anio = searchParams.get('anio')

    if (!mes || !anio) {
      return NextResponse.json(
        { error: 'Mes y año son requeridos' },
        { status: 400 }
      )
    }

    const mesNum = parseInt(mes)
    const anioNum = parseInt(anio)

    if (mesNum < 1 || mesNum > 12) {
      return NextResponse.json(
        { error: 'El mes debe estar entre 1 y 12' },
        { status: 400 }
      )
    }

    // Crear rango de fechas para el mes
    const fechaInicio = new Date(anioNum, mesNum - 1, 1)
    const fechaFin = new Date(anioNum, mesNum, 0, 23, 59, 59, 999)

    // Obtener todos los leads del periodo (filtrados por fechaPagoReserva)
    const leadsPeriodo = await prisma.lead.findMany({
      where: {
        brokerId: authResult.user.id,
        fechaPagoReserva: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      select: {
        id: true,
        comision: true,
        fechaCheckin: true,
        totalLead: true,
        estado: true,
      },
    })

    // Obtener leads confirmados (DEPARTAMENTO_ENTREGADO con fechaCheckin ingresada)
    const leadsConfirmados = await prisma.lead.findMany({
      where: {
        brokerId: authResult.user.id,
        fechaPagoReserva: {
          gte: fechaInicio,
          lte: fechaFin,
        },
        estado: 'DEPARTAMENTO_ENTREGADO',
        fechaCheckin: { not: null },
      },
      select: {
        id: true,
        comision: true,
      },
    })

    // Filtrar leads activos (excluir RECHAZADO y CANCELADO)
    const leadsActivos = leadsPeriodo.filter(
      lead => lead.estado !== 'RECHAZADO' && lead.estado !== 'CANCELADO'
    )

    // 1. Cantidad de reservas (leads del periodo excluyen do rechazados/cancelados)
    const cantidadReservas = leadsActivos.length

    // 2. Número de check-ins (leads del periodo con fechaCheckin)
    const numeroCheckins = leadsPeriodo.filter(
      lead => lead.fechaCheckin !== null &&
              lead.estado !== 'RECHAZADO' &&
              lead.estado !== 'CANCELADO'
    ).length

    // 3. Comisiones proyectadas (suma de comisiones de leads activos del periodo)
    const comisionesProyectadas = leadsActivos.reduce(
      (sum, lead) => sum + (lead.comision || 0),
      0
    )

    // 4. Comisiones confirmadas (suma de comisiones de leads DEPARTAMENTO_ENTREGADO con fechaCheckin)
    const comisionesConfirmadas = leadsConfirmados.reduce(
      (sum, lead) => sum + (lead.comision || 0),
      0
    )

    // 5. % de cierre del mes (leads con fechaCheckin / total leads activos)
    const porcentajeCierre = cantidadReservas > 0
      ? (numeroCheckins / cantidadReservas) * 100
      : 0

    // 6. Meta de colocación (buscar meta configurada para el broker en el mes/año)
    // Primero buscar meta específica del broker
    let metaMensual = await prisma.metaMensual.findUnique({
      where: {
        brokerId_mes_anio: {
          brokerId: authResult.user.id,
          mes: mesNum,
          anio: anioNum,
        },
      },
      select: {
        montoMeta: true,
      },
    })

    // Si no hay meta específica, buscar meta global (brokerId = null)
    if (!metaMensual) {
      metaMensual = await prisma.metaMensual.findFirst({
        where: {
          brokerId: null,
          mes: mesNum,
          anio: anioNum,
        },
        select: {
          montoMeta: true,
        },
      })
    }

    // Calcular el monto actual (suma de totalLead de los leads activos del periodo)
    const montoActual = leadsActivos.reduce(
      (sum, lead) => sum + (lead.totalLead || 0),
      0
    )

    const montoMeta = metaMensual?.montoMeta || 0
    const porcentajeMeta = montoMeta > 0 ? (montoActual / montoMeta) * 100 : 0

    const metrics = {
      cantidadReservas,
      numeroCheckins,
      comisionesProyectadas,
      comisionesConfirmadas,
      porcentajeCierre: Math.round(porcentajeCierre * 100) / 100, // Redondear a 2 decimales
      metaColocacion: {
        montoActual,
        montoMeta,
        porcentaje: Math.round(porcentajeMeta * 100) / 100,
      },
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
