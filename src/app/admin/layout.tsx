'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  Building2,
  Users,
  Calculator,
  BarChart3,
  Home,
  LogOut,
  User,
  TrendingUp,
  DollarSign,
  ChevronDown,
  ChevronRight,
  FileCheck,
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/admin' },
  { icon: Building2, label: 'Proyectos', href: '/admin/proyectos' },
  { icon: Users, label: 'Brokers', href: '/admin/contratistas' },
  { icon: UserCheck, label: 'Clientes', href: '/admin/clientes' },
  { icon: Calculator, label: 'Comisiones', href: '/admin/comisiones' },
  { icon: FileCheck, label: 'Conciliación', href: '/admin/conciliacion' },
  {
    icon: BarChart3,
    label: 'Reportes',
    href: '/admin/reportes',
    hasSubmenu: true,
    submenu: [
      { icon: TrendingUp, label: 'Performance Contratistas', href: '/admin/reportes' },
      { icon: DollarSign, label: 'Flujo de Caja', href: '/admin/reportes/flujo-caja' },
    ]
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  // Handle redirect after loading is complete
  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/login')
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay para móvil */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-sidebar-foreground">RumiRent</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href
                const isExpanded = expandedMenus.includes(item.label)
                const hasSubmenu = item.hasSubmenu && item.submenu

                return (
                  <li key={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start text-left transition-colors",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                      onClick={() => {
                        if (hasSubmenu) {
                          toggleSubmenu(item.label)
                        } else {
                          router.push(item.href)
                          setIsSidebarOpen(false)
                        }
                      }}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                      {hasSubmenu && (
                        <div className="ml-auto">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      )}
                    </Button>

                    {/* Submenu */}
                    {hasSubmenu && isExpanded && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.submenu.map((subItem) => {
                          const isSubActive = pathname === subItem.href
                          return (
                            <li key={subItem.href}>
                              <Button
                                variant={isSubActive ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                  "w-full justify-start text-left transition-colors",
                                  isSubActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                )}
                                onClick={() => {
                                  router.push(subItem.href)
                                  setIsSidebarOpen(false)
                                }}
                              >
                                <subItem.icon className="mr-3 h-4 w-4" />
                                {subItem.label}
                              </Button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">
                Panel de Administrador
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{user.nombre}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 bg-background min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}