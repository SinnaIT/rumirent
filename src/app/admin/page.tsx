'use client'

import { Building2, Users, Calculator, TrendingUp, Home, DollarSign } from 'lucide-react'

export default function AdminDashboard() {
  // Datos de ejemplo - en producción vendrían de la API
  const stats = [
    {
      title: "Total Proyectos",
      value: "12",
      change: "+2 este mes",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Brokers Activos",
      value: "8",
      change: "+1 este mes",
      icon: Users,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Unidades Vendidas",
      value: "34",
      change: "+6 esta semana",
      icon: Home,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Comisiones Generadas",
      value: "$45,250",
      change: "+12% vs mes anterior",
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ]

  const recentActivity = [
    { type: "Venta", description: "Unidad 3A - Edificio Torre Verde", time: "Hace 2 horas", status: "success" },
    { type: "Nuevo Broker", description: "María González registrada", time: "Hace 4 horas", status: "info" },
    { type: "Comisión", description: "Pago procesado - $2,850", time: "Hace 6 horas", status: "success" },
    { type: "Proyecto", description: "Torre Azul - Fase 2 iniciada", time: "Hace 1 día", status: "warning" }
  ]

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
        <div className="flex items-center space-x-3 text-sm bg-muted/50 px-4 py-2 rounded-full border">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span className="text-muted-foreground font-medium">Actualizado hace 2 min</span>
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
                    <div className="w-1 h-1 bg-success rounded-full"></div>
                    <p className="text-sm text-success font-medium">{stat.change}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enhanced Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-card-foreground">Actividad Reciente</h3>
            <button className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
              Ver todo
            </button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="group flex items-start space-x-4 p-3 rounded-lg hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
              >
                <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                  activity.status === 'success' ? 'bg-success shadow-success/20 shadow-md' :
                  activity.status === 'info' ? 'bg-primary shadow-primary/20 shadow-md' :
                  activity.status === 'warning' ? 'bg-warning shadow-warning/20 shadow-md' : 'bg-muted'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-card-foreground group-hover:text-primary transition-colors">
                      {activity.type}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-full">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-card-foreground mb-2">Acciones Rápidas</h3>
            <p className="text-sm text-muted-foreground">Gestiona tu plataforma inmobiliaria</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button className="group p-5 text-left bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <Building2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Nuevo Proyecto</p>
              <p className="text-xs text-muted-foreground">Crear edificio</p>
            </button>
            <button className="group p-5 text-left bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 rounded-xl transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <Users className="h-6 w-6 text-secondary group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-secondary/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Gestionar Brokers</p>
              <p className="text-xs text-muted-foreground">Ver listado</p>
            </button>
            <button className="group p-5 text-left bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 rounded-xl transition-all duration-300 border border-accent/10 hover:border-accent/30 hover:scale-[1.02]">
              <div className="flex items-center justify-between mb-3">
                <Calculator className="h-6 w-6 text-accent group-hover:scale-110 transition-transform" />
                <div className="w-2 h-2 bg-accent/30 rounded-full"></div>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Configurar Comisiones</p>
              <p className="text-xs text-muted-foreground">Ajustar tarifas</p>
            </button>
            <button className="group p-5 text-left bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 rounded-xl transition-all duration-300 border border-success/10 hover:border-success/30 hover:scale-[1.02]">
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
    </div>
  )
}