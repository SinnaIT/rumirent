'use client'

import { Home, DollarSign, TrendingUp, Target, Calendar, MapPin } from 'lucide-react'

export default function ContratistaDashboard() {
  // Datos de ejemplo - en producción vendrían de la API
  const stats = [
    {
      title: "Ventas Este Mes",
      value: "3",
      change: "+1 vs mes anterior",
      icon: Home,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Comisiones Ganadas",
      value: "$8,450",
      change: "+25% este mes",
      icon: DollarSign,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "Meta Mensual",
      value: "75%",
      change: "3 de 4 unidades",
      icon: Target,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Promedio Comisión",
      value: "$2,817",
      change: "Por unidad vendida",
      icon: TrendingUp,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ]

  const recentSales = [
    {
      unit: "Apt 2B",
      project: "Torre Verde",
      price: "$125,000",
      commission: "$3,750",
      date: "15 Nov 2024",
      status: "completed"
    },
    {
      unit: "Apt 1A",
      project: "Residencial Azul",
      price: "$98,000",
      commission: "$2,940",
      date: "12 Nov 2024",
      status: "completed"
    },
    {
      unit: "Apt 3C",
      project: "Torre Verde",
      price: "$110,000",
      commission: "$3,300",
      date: "8 Nov 2024",
      status: "completed"
    }
  ]

  const availableUnits = [
    {
      unit: "Apt 4A",
      project: "Torre Verde",
      type: "2 Dormitorios",
      price: "$135,000",
      commission: "$4,050",
      priority: "Alta"
    },
    {
      unit: "Studio 1B",
      project: "Residencial Azul",
      type: "Studio",
      price: "$85,000",
      commission: "$2,550",
      priority: "Media"
    },
    {
      unit: "Apt 5C",
      project: "Torre Verde",
      type: "3 Dormitorios",
      price: "$165,000",
      commission: "$4,950",
      priority: "Urgente"
    }
  ]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgente': return 'bg-destructive text-destructive-foreground'
      case 'Alta': return 'bg-warning text-warning-foreground'
      case 'Media': return 'bg-secondary text-secondary-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header - S-Tier Design */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Mi Dashboard
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            Resumen de tu actividad de ventas
          </p>
        </div>
        <div className="flex items-center space-x-3 text-sm bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/20">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-foreground font-semibold">Noviembre 2024</span>
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
        {/* Enhanced Recent Sales */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-card-foreground">Ventas Recientes</h3>
            <button className="text-sm text-success hover:text-success/80 font-medium transition-colors">
              Ver historial
            </button>
          </div>
          <div className="space-y-4">
            {recentSales.map((sale, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-4 bg-gradient-to-r from-success/5 to-transparent rounded-xl border border-success/10 hover:border-success/30 transition-all duration-300 cursor-pointer hover:scale-[1.01]"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Home className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-card-foreground group-hover:text-success transition-colors">
                      {sale.unit} - {sale.project}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium bg-muted/50 px-2 py-1 rounded-full inline-block mt-1">
                      {sale.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-accent text-lg">{sale.commission}</p>
                  <p className="text-xs text-muted-foreground">de {sale.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Available Units */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-card-foreground mb-1">Unidades Destacadas</h3>
              <p className="text-sm text-muted-foreground">Oportunidades con alta comisión</p>
            </div>
          </div>
          <div className="space-y-4">
            {availableUnits.map((unit, index) => (
              <div
                key={index}
                className="group p-4 border border-border rounded-xl hover:bg-muted/20 transition-all duration-300 cursor-pointer hover:border-primary/30 hover:scale-[1.01]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                        {unit.unit} - {unit.project}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">{unit.type}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(unit.priority)} shadow-sm`}>
                          {unit.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-mono font-bold text-accent text-lg">{unit.commission}</p>
                    <p className="text-xs text-muted-foreground">de {unit.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-card-foreground mb-2">Acciones Rápidas</h3>
          <p className="text-sm text-muted-foreground">Gestiona tus ventas y comisiones</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button className="group p-6 text-left bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 rounded-xl transition-all duration-300 border border-primary/10 hover:border-primary/30 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <Home className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
              <div className="w-2 h-2 bg-primary/30 rounded-full"></div>
            </div>
            <p className="text-base font-bold text-foreground mb-2">Ver Unidades</p>
            <p className="text-sm text-muted-foreground">Explorar inventario disponible</p>
          </button>
          <button className="group p-6 text-left bg-gradient-to-br from-success/10 to-success/5 hover:from-success/20 hover:to-success/10 rounded-xl transition-all duration-300 border border-success/10 hover:border-success/30 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-7 w-7 text-success group-hover:scale-110 transition-transform" />
              <div className="w-2 h-2 bg-success/30 rounded-full"></div>
            </div>
            <p className="text-base font-bold text-foreground mb-2">Registrar Venta</p>
            <p className="text-sm text-muted-foreground">Agregar nueva transacción</p>
          </button>
          <button className="group p-6 text-left bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 rounded-xl transition-all duration-300 border border-secondary/10 hover:border-secondary/30 hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-7 w-7 text-secondary group-hover:scale-110 transition-transform" />
              <div className="w-2 h-2 bg-secondary/30 rounded-full"></div>
            </div>
            <p className="text-base font-bold text-foreground mb-2">Ver Historial</p>
            <p className="text-sm text-muted-foreground">Revisar rendimiento</p>
          </button>
        </div>
      </div>
    </div>
  )
}