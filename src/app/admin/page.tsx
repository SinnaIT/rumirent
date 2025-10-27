'use client'

import { useEffect, useState } from 'react'
import { Building2, Users, Calculator, TrendingUp, Home, DollarSign, Cake, Trophy, Target, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface DashboardData {
  stats: {
    totalProjects: number
    activeBrokers: number
    unitsSoldThisMonth: number
    unitsChange: number
    totalCommissions: number
    commissionsChange: number
  }
  recentActivities: Array<{
    type: string
    description: string
    broker: string
    timeAgo: string
    status: 'success' | 'info' | 'warning' | 'error'
    isNew: boolean
  }>
  birthdays: Array<{
    id: string
    name: string
    date: number
    daysUntil: number
    broker: string
    type: 'cliente' | 'broker' | 'admin'
  }>
  topBrokers: Array<{
    id: string
    name: string
    totalSales: number
    totalCommission: number
    leadsCount: number
    rank: number
  }>
  monthlyGoals: Array<{
    brokerId: string
    brokerName: string
    goalAmount: number
    achievedAmount: number
    percentage: number
    remaining: number
    isGeneralGoal: boolean
  }>
  activeProjects: Array<{
    id: string
    name: string
    company: string
    totalUnits: number
    availableUnits: number
    soldUnitsFromCatalog: number
    soldUnitsManual: number
    soldUnits: number
  }>
  monthlyReservations: Array<{
    month: string
    count: number
  }>
  unitsSoldByBuilding: Array<{
    buildingName: string
    soldUnits: number
  }>
  typologyData: Array<{
    code: string
    name: string
    count: number
    percentage: number
  }>
  brokerMonthlyReservations: Array<{
    brokerId: string
    brokerName: string
    color: string
    monthlyData: Array<{
      month: string
      count: number
    }>
  }>
  comunasConMasArriendos: Array<{
    comuna: string
    count: number
    percentage: number
  }>
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setDashboardData(data)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return 'Hace menos de 1 min'
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`
    return `Hace ${Math.floor(seconds / 3600)} horas`
  }

  const stats = dashboardData
    ? [
        {
          title: "Total Proyectos",
          value: dashboardData.stats.totalProjects.toString(),
          change: `${dashboardData.activeProjects.length} activos`,
          icon: Building2,
          color: "text-primary",
          bgColor: "bg-primary/10",
          trend: null,
        },
        {
          title: "Brokers Activos",
          value: dashboardData.stats.activeBrokers.toString(),
          change: `${dashboardData.topBrokers.length} con ventas`,
          icon: Users,
          color: "text-secondary",
          bgColor: "bg-secondary/10",
          trend: null,
        },
        {
          title: "Unidades Vendidas",
          value: dashboardData.stats.unitsSoldThisMonth.toString(),
          change: `${dashboardData.stats.unitsChange >= 0 ? '+' : ''}${dashboardData.stats.unitsChange.toFixed(1)}% vs mes anterior`,
          icon: Home,
          color: "text-success",
          bgColor: "bg-success/10",
          trend: dashboardData.stats.unitsChange,
        },
        {
          title: "Comisiones Generadas",
          value: formatCurrency(dashboardData.stats.totalCommissions),
          change: `${dashboardData.stats.commissionsChange >= 0 ? '+' : ''}${dashboardData.stats.commissionsChange.toFixed(1)}% vs mes anterior`,
          icon: DollarSign,
          color: "text-accent",
          bgColor: "bg-accent/10",
          trend: dashboardData.stats.commissionsChange,
        }
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Enhanced Visual Hierarchy */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Resumen del desempeño inmobiliario
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-3 text-sm bg-muted/50 px-4 py-2 rounded-full border">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-muted-foreground font-medium">{getTimeAgo(lastUpdate)}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-5 w-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards - S-Tier Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="group bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:border-primary/20 cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </p>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-card-foreground tracking-tight">
                    {stat.value}
                  </p>
                  <div className="flex items-center space-x-2">
                    {stat.trend !== null && (
                      stat.trend >= 0
                        ? <ArrowUpRight className="w-4 h-4 text-success" />
                        : <ArrowDownRight className="w-4 h-4 text-destructive" />
                    )}
                    <p className={`text-sm font-medium ${stat.trend !== null ? (stat.trend >= 0 ? 'text-success' : 'text-destructive') : 'text-muted-foreground'}`}>
                      {stat.change}
                    </p>
                  </div>
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* First Row: Top Brokers, Monthly Goals, Typology & Comunas - 4 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Top Brokers */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-bold text-card-foreground">Top Brokers</h3>
            </div>
          </div>
          <div className="space-y-3">
            {dashboardData && dashboardData.topBrokers.length > 0 ? (
              dashboardData.topBrokers.slice(0, 5).map((broker) => (
                <div
                  key={broker.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
                      broker.rank === 1 ? 'bg-yellow-500 text-white' :
                      broker.rank === 2 ? 'bg-gray-400 text-white' :
                      broker.rank === 3 ? 'bg-orange-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {broker.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-card-foreground">{broker.name}</p>
                      <p className="text-xs text-muted-foreground">{broker.leadsCount} ventas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-success">{formatCurrency(broker.totalCommission)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay datos</p>
            )}
          </div>
        </div>

        {/* Monthly Goals */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-bold text-card-foreground">Metas del Mes</h3>
            </div>
          </div>
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {dashboardData && dashboardData.monthlyGoals.length > 0 ? (
              dashboardData.monthlyGoals.map((goal) => (
                <div key={goal.brokerId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-card-foreground text-sm truncate max-w-[150px]">{goal.brokerName}</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {goal.percentage.toFixed(0)}%
                    </p>
                  </div>
                  <div className={`w-full rounded-full h-2 overflow-hidden transition-all ${
                    goal.percentage >= 100 ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {goal.percentage < 100 && (
                      <div
                        className={`h-2 rounded-full transition-all ${
                          goal.percentage >= 75 ? 'bg-blue-500' :
                          goal.percentage >= 50 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${goal.percentage}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay metas</p>
            )}
          </div>
        </div>

        {/* Typology Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-card-foreground mb-2">Tipología</h3>
            <p className="text-xs text-muted-foreground">Distribución</p>
          </div>
          {dashboardData && dashboardData.typologyData.length > 0 ? (
            <div className="flex flex-col items-center">
              {/* Donut Chart */}
              <div className="relative w-44 h-44 mb-4">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {(() => {
                    let currentAngle = 0
                    const colors = [
                      '#3b82f6', // blue-500
                      '#8b5cf6', // violet-500
                      '#f97316', // orange-500
                      '#06b6d4', // cyan-500
                      '#ec4899', // pink-500
                      '#6366f1', // indigo-500
                    ]
                    return dashboardData.typologyData.map((item, index) => {
                      const percentage = item.percentage
                      const angle = (percentage / 100) * 360
                      const startAngle = currentAngle
                      const endAngle = currentAngle + angle
                      currentAngle = endAngle

                      // Calculate arc path
                      const radius = 80
                      const innerRadius = 50
                      const centerX = 100
                      const centerY = 100

                      const startAngleRad = (startAngle * Math.PI) / 180
                      const endAngleRad = (endAngle * Math.PI) / 180

                      const x1 = centerX + radius * Math.cos(startAngleRad)
                      const y1 = centerY + radius * Math.sin(startAngleRad)
                      const x2 = centerX + radius * Math.cos(endAngleRad)
                      const y2 = centerY + radius * Math.sin(endAngleRad)
                      const x3 = centerX + innerRadius * Math.cos(endAngleRad)
                      const y3 = centerY + innerRadius * Math.sin(endAngleRad)
                      const x4 = centerX + innerRadius * Math.cos(startAngleRad)
                      const y4 = centerY + innerRadius * Math.sin(startAngleRad)

                      const largeArcFlag = angle > 180 ? 1 : 0

                      const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        'Z',
                      ].join(' ')

                      return (
                        <path
                          key={index}
                          d={pathData}
                          fill={colors[index % colors.length]}
                          className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                      )
                    })
                  })()}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-card-foreground">
                    {dashboardData.typologyData.reduce((sum, t) => sum + t.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Unidades</p>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-1.5">
                {dashboardData.typologyData.slice(0, 6).map((item, index) => {
                  const colors = [
                    'bg-blue-500',
                    'bg-violet-500',
                    'bg-orange-500',
                    'bg-cyan-500',
                    'bg-pink-500',
                    'bg-indigo-500',
                  ]
                  return (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-2.5 h-2.5 rounded-sm ${colors[index % colors.length]}`}></div>
                        <span className="text-card-foreground font-medium">{item.code}</span>
                      </div>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos</p>
          )}
        </div>

        {/* Comunas con más Arriendos - Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-card-foreground mb-2">Comunas con más arriendos</h3>
            <p className="text-xs text-muted-foreground">Top 10</p>
          </div>
          {dashboardData && dashboardData.comunasConMasArriendos && dashboardData.comunasConMasArriendos.length > 0 ? (
            <div className="flex flex-col items-center">
              {/* Donut Chart */}
              <div className="relative w-44 h-44 mb-4">
                <svg viewBox="0 0 200 200" className="transform -rotate-90">
                  {(() => {
                    let currentAngle = 0
                    const colors = [
                      '#3b82f6', // blue-500
                      '#f97316', // orange-500
                      '#ec4899', // pink-500
                      '#06b6d4', // cyan-500
                      '#8b5cf6', // violet-500
                      '#eab308', // yellow-500
                      '#6366f1', // indigo-500
                      '#10b981', // emerald-500
                      '#f59e0b', // amber-500
                      '#14b8a6', // teal-500
                    ]
                    return dashboardData.comunasConMasArriendos.slice(0, 10).map((item, index) => {
                      const percentage = item.percentage
                      const angle = (percentage / 100) * 360
                      const startAngle = currentAngle
                      const endAngle = currentAngle + angle
                      currentAngle = endAngle

                      // Calculate arc path
                      const radius = 80
                      const innerRadius = 50
                      const centerX = 100
                      const centerY = 100

                      const startAngleRad = (startAngle * Math.PI) / 180
                      const endAngleRad = (endAngle * Math.PI) / 180

                      const x1 = centerX + radius * Math.cos(startAngleRad)
                      const y1 = centerY + radius * Math.sin(startAngleRad)
                      const x2 = centerX + radius * Math.cos(endAngleRad)
                      const y2 = centerY + radius * Math.sin(endAngleRad)
                      const x3 = centerX + innerRadius * Math.cos(endAngleRad)
                      const y3 = centerY + innerRadius * Math.sin(endAngleRad)
                      const x4 = centerX + innerRadius * Math.cos(startAngleRad)
                      const y4 = centerY + innerRadius * Math.sin(startAngleRad)

                      const largeArcFlag = angle > 180 ? 1 : 0

                      const pathData = [
                        `M ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        `L ${x3} ${y3}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
                        'Z',
                      ].join(' ')

                      return (
                        <g key={index}>
                          <path
                            d={pathData}
                            fill={colors[index % colors.length]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          >
                            <title>{`${item.comuna}: ${item.count} arriendos`}</title>
                          </path>
                        </g>
                      )
                    })
                  })()}
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-card-foreground">
                    {dashboardData.comunasConMasArriendos.reduce((sum, t) => sum + t.count, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Arriendos</p>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-1.5 max-h-[180px] overflow-y-auto">
                {dashboardData.comunasConMasArriendos.slice(0, 10).map((item, index) => {
                  const colors = [
                    'bg-blue-500',
                    'bg-orange-500',
                    'bg-pink-500',
                    'bg-cyan-500',
                    'bg-violet-500',
                    'bg-yellow-500',
                    'bg-indigo-500',
                    'bg-emerald-500',
                    'bg-amber-500',
                    'bg-teal-500',
                  ]
                  return (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-2.5 h-2.5 rounded-sm ${colors[index % colors.length]}`}></div>
                        <span className="text-card-foreground font-medium truncate max-w-[100px]" title={item.comuna}>
                          {item.comuna}
                        </span>
                      </div>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos</p>
          )}
        </div>
      </div>

      {/* Second Row: Recent Activity & Birthdays - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Enhanced Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-card-foreground">Actividad Reciente</h3>
          </div>
          <div className="space-y-2">
            {dashboardData && dashboardData.recentActivities.length > 0 ? (
              dashboardData.recentActivities.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="group flex items-start space-x-2 p-2.5 rounded-lg hover:bg-muted/30 transition-colors duration-200 cursor-pointer border border-transparent hover:border-border"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    activity.status === 'success' ? 'bg-success shadow-success/20 shadow-md' :
                    activity.status === 'error' ? 'bg-destructive shadow-destructive/20 shadow-md' :
                    activity.status === 'info' ? 'bg-primary shadow-primary/20 shadow-md' :
                    activity.status === 'warning' ? 'bg-warning shadow-warning/20 shadow-md' : 'bg-muted'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {activity.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {activity.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {activity.description}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay actividades</p>
            )}
          </div>
        </div>

        {/* Cumpleañeros del Mes */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Cake className="h-5 w-5 text-pink-500" />
              <h3 className="text-lg font-bold text-card-foreground">Cumpleañeros</h3>
            </div>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {dashboardData && dashboardData.birthdays.length > 0 ? (
              dashboardData.birthdays.map((birthday) => (
                <div
                  key={birthday.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800"
                >
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pink-500 text-white font-bold text-sm">
                      {birthday.date}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-card-foreground">{birthday.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {birthday.type === 'cliente' ? `${birthday.broker}` :
                         birthday.type === 'broker' ? 'Broker' :
                         'Admin'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay cumpleaños</p>
            )}
          </div>
        </div>
      </div>

      {/* Third Row: Charts - Monthly Reservations and Units Sold by Building - 2 large cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Reservations Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-card-foreground mb-2">Reservas por mes</h3>
            <p className="text-sm text-muted-foreground">Últimos 5 meses</p>
          </div>
          {dashboardData && dashboardData.monthlyReservations.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.monthlyReservations.map((data, index) => {
                const maxCount = Math.max(...dashboardData.monthlyReservations.map(d => d.count))
                const percentage = maxCount > 0 ? (data.count / maxCount) * 100 : 0
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground capitalize min-w-[80px]">
                        {data.month}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="relative h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 flex items-center justify-center shadow-md"
                            style={{ width: `${percentage}%` }}
                          >
                            {data.count > 0 && (
                              <span className="text-white font-bold text-lg px-4">
                                {data.count}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay datos de reservas</p>
          )}
        </div>

        {/* Units Sold by Building Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-card-foreground mb-2">Unidades Vendidas por Proyecto</h3>
            <p className="text-sm text-muted-foreground">Total de ventas aprobadas</p>
          </div>
          {dashboardData && dashboardData.unitsSoldByBuilding.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.unitsSoldByBuilding.slice(0, 5).map((data, index) => {
                const maxCount = Math.max(...dashboardData.unitsSoldByBuilding.map(d => d.soldUnits))
                const percentage = maxCount > 0 ? (data.soldUnits / maxCount) * 100 : 0
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground truncate max-w-[200px]" title={data.buildingName}>
                        {data.buildingName}
                      </span>
                      <div className="flex-1 mx-4">
                        <div className="relative h-12 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg transition-all duration-500 flex items-center justify-center shadow-md"
                            style={{ width: `${percentage}%` }}
                          >
                            {data.soldUnits > 0 && (
                              <span className="text-white font-bold text-lg px-4">
                                {data.soldUnits}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay unidades vendidas</p>
          )}
        </div>
      </div>

      {/* Fourth Row: Active Projects & Quick Actions - 2 large cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Active Projects - Stacked Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-card-foreground mb-2">Proyectos Activos</h3>
            <p className="text-sm text-muted-foreground">Distribución de unidades</p>
          </div>

          {/* Legend */}
          {dashboardData && dashboardData.activeProjects.length > 0 && (
            <div className="flex items-center justify-center space-x-6 mb-6 pb-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-xs font-medium text-muted-foreground">Disponibles</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-orange-500"></div>
                <span className="text-xs font-medium text-muted-foreground">Vendidas</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {dashboardData && dashboardData.activeProjects.length > 0 ? (
              <>
                {dashboardData.activeProjects.map((project) => {
                  const total = project.totalUnits + project.soldUnitsManual
                  const availablePercentage = total > 0 ? (project.availableUnits / total) * 100 : 0
                  const soldPercentage = total > 0 ? (project.soldUnits / total) * 100 : 0

                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-[200px]">
                          <p className="font-semibold text-sm text-card-foreground">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.company}</p>
                        </div>
                        <span className="text-sm font-bold text-card-foreground ml-4">{total}</span>
                      </div>

                      {/* Stacked Bar */}
                      <div className="relative">
                        <div className="flex h-10 rounded-lg overflow-hidden bg-muted/30">
                          {/* Available units segment */}
                          {project.availableUnits > 0 && (
                            <div
                              className="bg-green-500 flex items-center justify-center text-white text-sm font-semibold transition-all duration-500 hover:bg-green-600"
                              style={{ width: `${availablePercentage}%` }}
                              title={`${project.availableUnits} disponibles`}
                            >
                              {project.availableUnits > 0 && availablePercentage > 10 && (
                                <span>{project.availableUnits}</span>
                              )}
                            </div>
                          )}

                          {/* Sold units segment */}
                          {project.soldUnits > 0 && (
                            <div
                              className="bg-orange-500 flex items-center justify-center text-white text-sm font-semibold transition-all duration-500 hover:bg-orange-600"
                              style={{ width: `${soldPercentage}%` }}
                              title={`${project.soldUnits} vendidas (${project.soldUnitsFromCatalog} catálogo + ${project.soldUnitsManual} manuales)`}
                            >
                              {project.soldUnits > 0 && soldPercentage > 10 && (
                                <span>{project.soldUnits}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Values below bar for better visibility if space is tight */}
                        {(availablePercentage < 10 || soldPercentage < 10) && (
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            {project.availableUnits > 0 && availablePercentage < 10 && (
                              <span>{project.availableUnits} disp.</span>
                            )}
                            {project.soldUnits > 0 && soldPercentage < 10 && (
                              <span>{project.soldUnits} vend.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Total Summary */}
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-card-foreground">Total General</span>
                    <span className="text-lg font-bold text-primary">
                      {dashboardData.activeProjects.reduce((sum, p) => sum + p.totalUnits + p.soldUnitsManual, 0)} unidades
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{dashboardData.activeProjects.reduce((sum, p) => sum + p.availableUnits, 0)} disponibles</span>
                    <span>{dashboardData.activeProjects.reduce((sum, p) => sum + p.soldUnits, 0)} vendidas</span>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">No hay proyectos activos</p>
            )}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-card-foreground mb-2">Acciones Rápidas</h3>
            <p className="text-sm text-muted-foreground">Gestiona tu plataforma inmobiliaria</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = '/admin/proyectos'}
              className="group p-5 text-left bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <Building2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Nuevo Proyecto</p>
              <p className="text-xs text-muted-foreground">Crear edificio</p>
            </button>
            <button
              onClick={() => window.location.href = '/admin/brokers'}
              className="group p-5 text-left bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 rounded-xl transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <Users className="h-6 w-6 text-secondary group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-secondary/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Gestionar Brokers</p>
              <p className="text-xs text-muted-foreground">Ver listado</p>
            </button>
            <button
              onClick={() => window.location.href = '/admin/comisiones'}
              className="group p-5 text-left bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 rounded-xl transition-all duration-300 border border-accent/10 hover:border-accent/30 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <Calculator className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-accent/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Configurar Comisiones</p>
              <p className="text-xs text-muted-foreground">Ajustar tarifas</p>
            </button>
            <button
              onClick={() => window.location.href = '/admin/reportes'}
              className="group p-5 text-left bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 rounded-xl transition-all duration-300 border border-success/10 hover:border-success/30 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="h-6 w-6 text-success group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-success/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Ver Reportes</p>
              <p className="text-xs text-muted-foreground">Analytics</p>
            </button>
          </div>
        </div>
      </div>

      {/* Fifth Row: Broker Monthly Reservations Chart - Full width large card */}
      {dashboardData && dashboardData.brokerMonthlyReservations && dashboardData.brokerMonthlyReservations.length > 0 && (
        <div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-card-foreground mb-2">Reservas por Broker por Mes</h3>
              <p className="text-sm text-muted-foreground">Últimos 4 meses</p>
            </div>

            {/* Legend - Months */}
            <div className="flex flex-wrap gap-3 mb-6">
              {(() => {
                const months = dashboardData.brokerMonthlyReservations[0]?.monthlyData.map(m => m.month) || []
                const monthColors = [
                  '#3b82f6', // blue-500
                  '#8b5cf6', // violet-500
                  '#f97316', // orange-500
                  '#06b6d4', // cyan-500
                ]
                return months.map((month, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: monthColors[index % monthColors.length] }}
                    />
                    <span className="text-sm font-medium text-card-foreground capitalize">
                      {month}
                    </span>
                  </div>
                ))
              })()}
            </div>

            {/* Chart */}
            <div className="relative">
              {(() => {
                const months = dashboardData.brokerMonthlyReservations[0]?.monthlyData.map(m => m.month) || []
                const monthColors = [
                  '#3b82f6', // blue-500
                  '#8b5cf6', // violet-500
                  '#f97316', // orange-500
                  '#06b6d4', // cyan-500
                ]

                // Calculate max total value per broker for scaling
                const brokerTotals = dashboardData.brokerMonthlyReservations.map(broker => {
                  return broker.monthlyData.reduce((sum, month) => sum + month.count, 0)
                })
                const maxTotal = Math.max(...brokerTotals, 1)

                return (
                  <div className="flex items-end justify-center space-x-6 h-64 pb-8">
                    {dashboardData.brokerMonthlyReservations.map((broker) => {
                      const brokerTotal = broker.monthlyData.reduce((sum, month) => sum + month.count, 0)

                      return (
                        <div key={broker.brokerId} className="flex flex-col items-center flex-1 h-full">
                          {/* Stacked bar container */}
                          <div className="flex-1 flex flex-col-reverse justify-start w-full max-w-[80px] relative group">
                            {broker.monthlyData.map((monthData, monthIndex) => {
                              const count = monthData.count
                              if (count === 0) return null

                              // Calculate height as percentage of max total
                              const heightPercentage = maxTotal > 0 ? (count / maxTotal) * 100 : 0

                              return (
                                <div
                                  key={monthIndex}
                                  className="relative w-full transition-all duration-300 hover:brightness-110 cursor-pointer border-t-2 border-white/20"
                                  style={{
                                    height: `${heightPercentage}%`,
                                    backgroundColor: monthColors[monthIndex % monthColors.length],
                                    borderRadius: monthIndex === 0 ? '0.375rem 0.375rem 0 0' : '0',
                                    boxShadow: 'inset 0 -1px 0 0 rgba(0,0,0,0.1)',
                                  }}
                                  title={`${months[monthIndex]}: ${count}`}
                                >
                                  {/* Value label inside bar if there's enough space */}
                                  {count > 0 && heightPercentage > 8 && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-white font-bold text-sm drop-shadow-md">
                                        {count}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Broker label and Total */}
                          <div className="mt-4 text-center space-y-1">
                            <span className="text-sm font-semibold text-card-foreground block">
                              {broker.brokerName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total: <span className="font-bold text-card-foreground">{brokerTotal}</span>
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}