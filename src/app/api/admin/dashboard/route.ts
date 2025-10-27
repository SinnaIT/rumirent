import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success || authResult.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)

    // Get total projects count
    const totalProjects = await prisma.edificio.count()

    // Get active brokers count
    const activeBrokers = await prisma.user.count({
      where: {
        role: 'BROKER',
        activo: true,
      },
    })

    // Get units sold this month
    const unitsSoldThisMonth = await prisma.lead.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        estado: {
          in: ['APROBADO', 'RESERVA_PAGADA'],
        },
      },
    })

    // Get total commissions generated this month
    const commissionStats = await prisma.lead.aggregate({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        estado: {
          in: ['APROBADO', 'RESERVA_PAGADA'],
        },
      },
      _sum: {
        comision: true,
      },
    })

    // Get recent activities (created and updated leads)
    const recentLeadsCreated = await prisma.lead.findMany({
      take: 15,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        codigoUnidad: true,
        broker: {
          select: {
            nombre: true,
          },
        },
        cliente: {
          select: {
            nombre: true,
          },
        },
        edificio: {
          select: {
            nombre: true,
          },
        },
        unidad: {
          select: {
            numero: true,
          },
        },
      },
    })

    // Get recently updated leads (status changes)
    const recentLeadsUpdated = await prisma.lead.findMany({
      take: 15,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
        codigoUnidad: true,
        broker: {
          select: {
            nombre: true,
          },
        },
        cliente: {
          select: {
            nombre: true,
          },
        },
        edificio: {
          select: {
            nombre: true,
          },
        },
        unidad: {
          select: {
            numero: true,
          },
        },
      },
    })

    const recentBrokers = await prisma.user.findMany({
      take: 10,
      where: {
        role: 'BROKER',
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        nombre: true,
        createdAt: true,
      },
    })

    const recentClientes = await prisma.cliente.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        broker: {
          select: {
            nombre: true,
          },
        },
      },
    })

    // Combine and format recent activities
    const activities = [
      // New leads created
      ...recentLeadsCreated.map((lead) => ({
        type: getLeadActivityType(lead.estado, true),
        description: `${lead.cliente.nombre} - ${lead.edificio.nombre}${lead.unidad ? ` - Unidad ${lead.unidad.numero}` : lead.codigoUnidad ? ` - ${lead.codigoUnidad}` : ''}`,
        broker: lead.broker.nombre,
        time: lead.createdAt,
        status: getActivityStatus(lead.estado),
        isNew: true,
      })),
      // Updated leads (status changes)
      ...recentLeadsUpdated
        .filter((lead) => {
          // Only include if updated at least 1 minute after creation
          const timeDiff = new Date(lead.updatedAt).getTime() - new Date(lead.createdAt).getTime()
          return timeDiff > 60000 // 1 minute
        })
        .map((lead) => ({
          type: getLeadActivityType(lead.estado, false),
          description: `${lead.cliente.nombre} - ${lead.edificio.nombre}${lead.unidad ? ` - Unidad ${lead.unidad.numero}` : lead.codigoUnidad ? ` - ${lead.codigoUnidad}` : ''}`,
          broker: lead.broker.nombre,
          time: lead.updatedAt,
          status: getActivityStatus(lead.estado),
          isNew: false,
        })),
      // New brokers
      ...recentBrokers.map((broker) => ({
        type: 'Nuevo Broker',
        description: `${broker.nombre} registrado en el sistema`,
        broker: 'Sistema',
        time: broker.createdAt,
        status: 'info' as const,
        isNew: true,
      })),
      // New clients
      ...recentClientes.map((cliente) => ({
        type: 'Nuevo Cliente',
        description: `${cliente.nombre} registrado`,
        broker: cliente.broker?.nombre || 'Sin broker',
        time: cliente.createdAt,
        status: 'info' as const,
        isNew: true,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 15)
      .map((activity) => ({
        ...activity,
        timeAgo: getTimeAgo(activity.time),
      }))

    const recentActivities = activities

    // Get birthdays this month (clients and users)
    const allClients = await prisma.cliente.findMany({
      where: {
        fechaNacimiento: {
          not: null,
        },
      },
      include: {
        broker: {
          select: {
            nombre: true,
          },
        },
      },
    })

    const allUsers = await prisma.user.findMany({
      where: {
        birthDate: {
          not: null,
        },
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        birthDate: true,
        role: true,
      },
    })

    const clientBirthdays = allClients
      .filter((cliente) => {
        if (!cliente.fechaNacimiento) return false
        const birthDate = new Date(cliente.fechaNacimiento)
        return birthDate.getMonth() === currentMonth
      })
      .map((cliente) => {
        const birthDate = new Date(cliente.fechaNacimiento!)
        const daysUntil = getDaysUntilBirthday(birthDate)
        return {
          id: cliente.id,
          name: cliente.nombre,
          date: birthDate.getDate(),
          daysUntil,
          broker: cliente.broker?.nombre || 'Sin broker',
          type: 'cliente' as const,
        }
      })

    const userBirthdays = allUsers
      .filter((user) => {
        if (!user.birthDate) return false
        const birthDate = new Date(user.birthDate)
        return birthDate.getMonth() === currentMonth
      })
      .map((user) => {
        const birthDate = new Date(user.birthDate!)
        const daysUntil = getDaysUntilBirthday(birthDate)
        return {
          id: user.id,
          name: user.nombre,
          date: birthDate.getDate(),
          daysUntil,
          broker: user.role === 'BROKER' ? 'Broker' : 'Admin',
          type: user.role === 'BROKER' ? ('broker' as const) : ('admin' as const),
        }
      })

    const birthdaysThisMonth = [...clientBirthdays, ...userBirthdays]
      .sort((a, b) => a.daysUntil - b.daysUntil)

    // Get top brokers by commission this month
    const topBrokersData = await prisma.user.findMany({
      where: {
        role: 'BROKER',
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        leads: {
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            estado: {
              in: ['APROBADO', 'RESERVA_PAGADA'],
            },
          },
          select: {
            comision: true,
            totalLead: true,
          },
        },
      },
    })

    const topBrokers = topBrokersData
      .map((broker) => ({
        id: broker.id,
        name: broker.nombre,
        totalSales: broker.leads.reduce((sum, lead) => sum + lead.totalLead, 0),
        totalCommission: broker.leads.reduce((sum, lead) => sum + lead.comision, 0),
        leadsCount: broker.leads.length,
      }))
      .filter((broker) => broker.leadsCount > 0)
      .sort((a, b) => b.totalCommission - a.totalCommission)
      .slice(0, 5)
      .map((broker, index) => ({
        ...broker,
        rank: index + 1,
      }))

    // Get monthly goals for current month
    const allGoals = await prisma.metaMensual.findMany({
      where: {
        mes: currentMonth + 1, // Prisma uses 1-indexed months
        anio: currentYear,
      },
      include: {
        broker: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    })

    // Separate general and specific goals
    const generalGoal = allGoals.find(g => g.brokerId === null)
    const specificGoals = allGoals.filter(g => g.brokerId !== null)

    // Get all active brokers
    const allBrokers = await prisma.user.findMany({
      where: {
        role: 'BROKER',
        activo: true,
      },
      select: {
        id: true,
        nombre: true,
        leads: {
          where: {
            createdAt: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
            estado: {
              in: ['APROBADO', 'RESERVA_PAGADA'],
            },
          },
          select: {
            totalLead: true,
          },
        },
      },
    })

    // Apply goal logic: specific goals override general goal
    const goalsProgress = allBrokers.map((broker) => {
      // Check if broker has specific goal
      const specificGoal = specificGoals.find(g => g.brokerId === broker.id)
      const applicableGoal = specificGoal || generalGoal

      // If no goal applies to this broker, skip it
      if (!applicableGoal) return null

      const achieved = broker.leads.reduce((sum, lead) => sum + lead.totalLead, 0)
      const percentage = applicableGoal.montoMeta > 0 ? (achieved / applicableGoal.montoMeta) * 100 : 0

      return {
        brokerId: broker.id,
        brokerName: broker.nombre,
        goalAmount: applicableGoal.montoMeta,
        achievedAmount: achieved,
        percentage: Math.round(percentage * 100) / 100,
        remaining: applicableGoal.montoMeta - achieved,
        isGeneralGoal: !specificGoal,
      }
    }).filter(g => g !== null)

    // Get active projects with detailed stats
    const activeProjects = await prisma.edificio.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        empresa: {
          select: {
            nombre: true,
          },
        },
        unidades: {
          select: {
            estado: true,
          },
        },
        leads: {
          where: {
            estado: {
              in: ['APROBADO', 'RESERVA_PAGADA'],
            },
          },
          select: {
            id: true,
            unidadId: true,
            codigoUnidad: true,
          },
        },
      },
    })

    const projectsWithStats = activeProjects.map((project) => {
      // Count leads from catalog (with unidadId)
      const soldUnitsFromCatalog = project.leads.filter((lead) => lead.unidadId !== null).length

      // Count manual leads (without unidadId but with codigoUnidad)
      const soldUnitsManual = project.leads.filter((lead) => lead.unidadId === null && lead.codigoUnidad !== null).length

      // Total sold units
      const soldUnits = soldUnitsFromCatalog + soldUnitsManual

      return {
        id: project.id,
        name: project.nombre,
        company: project.empresa.nombre,
        totalUnits: project.unidades.length,
        availableUnits: project.unidades.filter((u) => u.estado === 'DISPONIBLE').length,
        soldUnitsFromCatalog,
        soldUnitsManual,
        soldUnits,
      }
    })

    // Get all units with their typology information
    const allUnits = await prisma.unidad.findMany({
      select: {
        id: true,
        tipoUnidadEdificio: {
          select: {
            codigo: true,
            nombre: true,
          },
        },
      },
    })

    // Group by typology code (sum units with same code across different projects)
    const typologyMap = new Map<string, { code: string; name: string; count: number }>()

    allUnits.forEach((unit) => {
      const code = unit.tipoUnidadEdificio?.codigo || 'SIN_CODIGO'
      const name = unit.tipoUnidadEdificio?.nombre || 'Sin tipo'

      if (typologyMap.has(code)) {
        const existing = typologyMap.get(code)!
        existing.count++
      } else {
        typologyMap.set(code, { code, name, count: 1 })
      }
    })

    // Convert map to array and sort by count
    const typologyStats = Array.from(typologyMap.values()).sort((a, b) => b.count - a.count)

    const totalUnitsInTypologies = typologyStats.reduce((sum, t) => sum + t.count, 0)
    const typologyData = typologyStats.map((t) => ({
      ...t,
      percentage: totalUnitsInTypologies > 0 ? (t.count / totalUnitsInTypologies) * 100 : 0,
    }))

    // Calculate change percentages (comparing to last month)
    const lastMonthStart = new Date(currentYear, currentMonth - 1, 1)
    const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59)

    const unitsSoldLastMonth = await prisma.lead.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
        estado: {
          in: ['APROBADO', 'RESERVA_PAGADA'],
        },
      },
    })

    const commissionsLastMonth = await prisma.lead.aggregate({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
        estado: {
          in: ['APROBADO', 'RESERVA_PAGADA'],
        },
      },
      _sum: {
        comision: true,
      },
    })

    const unitsChange = unitsSoldLastMonth > 0
      ? ((unitsSoldThisMonth - unitsSoldLastMonth) / unitsSoldLastMonth) * 100
      : 0

    const commissionsChange = (commissionsLastMonth._sum.comision || 0) > 0
      ? (((commissionStats._sum.comision || 0) - (commissionsLastMonth._sum.comision || 0)) / (commissionsLastMonth._sum.comision || 0)) * 100
      : 0

    // Get monthly reservations for the last 6 months
    const monthlyReservations = []
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

    for (let i = 4; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1)
      const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
      const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59)

      const count = await prisma.lead.count({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          estado: {
            in: ['RESERVA_PAGADA', 'APROBADO'],
          },
        },
      })

      monthlyReservations.push({
        month: monthNames[targetDate.getMonth()],
        count: count,
      })
    }

    // Get units sold by building
    const unitsSoldByBuilding = await prisma.edificio.findMany({
      select: {
        id: true,
        nombre: true,
        leads: {
          where: {
            estado: {
              in: ['RESERVA_PAGADA', 'APROBADO'],
            },
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        leads: {
          _count: 'desc',
        },
      },
    })

    const buildingSalesData = unitsSoldByBuilding
      .map((building) => ({
        buildingName: building.nombre,
        soldUnits: building.leads.length,
      }))
      .filter((data) => data.soldUnits > 0)
      .sort((a, b) => b.soldUnits - a.soldUnits)

    // Get reservations by broker per month (last 4 months)
    const brokerMonthlyReservations = []
    const colors = [
      'hsl(210, 100%, 50%)',  // Blue
      'hsl(120, 100%, 30%)',  // Green
      'hsl(30, 100%, 50%)',   // Orange
      'hsl(270, 100%, 50%)',  // Purple
      'hsl(0, 100%, 50%)',    // Red
      'hsl(180, 100%, 35%)',  // Cyan
      'hsl(60, 100%, 50%)',   // Yellow
      'hsl(300, 100%, 40%)',  // Magenta
      'hsl(15, 100%, 50%)',   // Coral
      'hsl(240, 100%, 50%)',  // Indigo
    ]

    // Get all brokers who have had sales in the last 4 months
    const fourMonthsAgo = new Date(currentYear, currentMonth - 3, 1)
    const brokersWithSales = await prisma.user.findMany({
      where: {
        role: 'BROKER',
        activo: true,
        leads: {
          some: {
            createdAt: {
              gte: fourMonthsAgo,
            },
            estado: {
              in: ['RESERVA_PAGADA', 'APROBADO'],
            },
          },
        },
      },
      select: {
        id: true,
        nombre: true,
      },
      orderBy: {
        nombre: 'asc',
      },
    })

    // For each broker, get their monthly counts for the last 4 months
    for (let brokerIndex = 0; brokerIndex < brokersWithSales.length; brokerIndex++) {
      const broker = brokersWithSales[brokerIndex]
      const monthlyData = []

      for (let i = 3; i >= 0; i--) {
        const targetDate = new Date(currentYear, currentMonth - i, 1)
        const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)
        const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59)

        const count = await prisma.lead.count({
          where: {
            brokerId: broker.id,
            createdAt: {
              gte: monthStart,
              lte: monthEnd,
            },
            estado: {
              in: ['RESERVA_PAGADA', 'APROBADO'],
            },
          },
        })

        monthlyData.push({
          month: monthNames[targetDate.getMonth()],
          count: count,
        })
      }

      brokerMonthlyReservations.push({
        brokerId: broker.id,
        brokerName: broker.nombre,
        color: colors[brokerIndex % colors.length],
        monthlyData: monthlyData,
      })
    }

    // Get leads by comuna (Top comunas with most leads)
    const leadsWithComuna = await prisma.lead.findMany({
      where: {
        estado: {
          in: ['RESERVA_PAGADA', 'APROBADO'],
        },
      },
      select: {
        edificio: {
          select: {
            comuna: true,
          },
        },
      },
    })

    // Count leads by comuna
    const comunaCount = leadsWithComuna.reduce((acc: Record<string, number>, lead) => {
      const comuna = lead.edificio.comuna
      acc[comuna] = (acc[comuna] || 0) + 1
      return acc
    }, {})

    // Convert to array and sort by count
    const comunaData = Object.entries(comunaCount)
      .map(([comuna, count]) => ({
        comuna,
        count: count as number,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10) // Top 10 comunas

    // Calculate total for percentages
    const totalLeadsInTopComunas = comunaData.reduce((sum, item) => sum + item.count, 0)

    // Add percentage to each comuna
    const comunaDataWithPercentage = comunaData.map((item) => ({
      comuna: item.comuna,
      count: item.count,
      percentage: totalLeadsInTopComunas > 0 ? (item.count / totalLeadsInTopComunas) * 100 : 0,
    }))

    return NextResponse.json({
      stats: {
        totalProjects,
        activeBrokers,
        unitsSoldThisMonth,
        unitsChange: Math.round(unitsChange * 10) / 10,
        totalCommissions: commissionStats._sum.comision || 0,
        commissionsChange: Math.round(commissionsChange * 10) / 10,
      },
      recentActivities,
      birthdays: birthdaysThisMonth,
      topBrokers,
      monthlyGoals: goalsProgress,
      activeProjects: projectsWithStats,
      monthlyReservations,
      unitsSoldByBuilding: buildingSalesData,
      typologyData,
      brokerMonthlyReservations,
      comunasConMasArriendos: comunaDataWithPercentage,
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Helper function to calculate days until next birthday
function getDaysUntilBirthday(birthDate: Date): number {
  const today = new Date()
  const currentYear = today.getFullYear()
  const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate())

  if (nextBirthday < today) {
    nextBirthday.setFullYear(currentYear + 1)
  }

  const diffTime = nextBirthday.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

// Helper function to get lead activity type based on status
function getLeadActivityType(estado: string, isNew: boolean): string {
  if (isNew) {
    switch (estado) {
      case 'APROBADO':
        return 'Venta Aprobada'
      case 'RESERVA_PAGADA':
        return 'Nueva Reserva'
      case 'ENTREGADO':
        return 'Nuevo Lead'
      case 'RECHAZADO':
        return 'Lead Rechazado'
      default:
        return 'Nuevo Lead'
    }
  } else {
    switch (estado) {
      case 'APROBADO':
        return 'Lead → Aprobado'
      case 'RESERVA_PAGADA':
        return 'Lead → Reserva Pagada'
      case 'ENTREGADO':
        return 'Lead → Entregado'
      case 'RECHAZADO':
        return 'Lead → Rechazado'
      default:
        return 'Lead Actualizado'
    }
  }
}

// Helper function to get activity status color
function getActivityStatus(estado: string): 'success' | 'warning' | 'info' | 'error' {
  switch (estado) {
    case 'APROBADO':
      return 'success'
    case 'RESERVA_PAGADA':
      return 'warning'
    case 'RECHAZADO':
      return 'error'
    default:
      return 'info'
  }
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000)

  if (diffInSeconds < 60) return 'Hace menos de 1 min'
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} horas`
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`

  return new Date(date).toLocaleDateString('es-CL')
}
