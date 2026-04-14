'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Menu,
  X,
  Home,
  BarChart3,
  Calculator,
  LogOut,
  User,
  Plus,
  DollarSign,
  Building2,
  Users,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/hooks/use-auth'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo } from '@/components/logo'

type WorkspaceRole = 'BROKER' | 'TEAM_LEADER'

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  href: string
}

interface MenuSection {
  title?: string
  items: MenuItem[]
}

// Items del workspace de broker (usados por el rol BROKER y por la sección
// "Mi Gestión" del TEAM_LEADER). Todos apuntan a /broker/* para que exista una
// única copia del código bajo src/app/broker/*.
const brokerWorkspaceItems: MenuItem[] = [
  { icon: Home, label: 'Dashboard', href: '/broker' },
  { icon: Building2, label: 'Proyectos', href: '/broker/proyectos' },
  { icon: Plus, label: 'Generar Lead', href: '/broker/generar-lead' },
  { icon: User, label: 'Mis Leads', href: '/broker/leads' },
  { icon: Calculator, label: 'Mis Prospectos', href: '/broker/ventas' },
  { icon: BarChart3, label: 'Reportes', href: '/broker/reportes' },
  { icon: DollarSign, label: 'Flujo de Caja', href: '/broker/reportes/flujo-caja' },
]

const teamLeaderTeamItems: MenuItem[] = [
  { icon: Home, label: 'Dashboard Equipo', href: '/team-leader' },
  { icon: Users, label: 'Mi Equipo', href: '/team-leader/equipo' },
  { icon: User, label: 'Leads del Equipo', href: '/team-leader/leads' },
  { icon: FileText, label: 'Prospectos Equipo', href: '/team-leader/ventas' },
  { icon: BarChart3, label: 'Reportes Equipo', href: '/team-leader/reportes' },
]

function getMenuSections(role: WorkspaceRole): MenuSection[] {
  if (role === 'TEAM_LEADER') {
    return [
      { title: 'Mi Equipo', items: teamLeaderTeamItems },
      { title: 'Mi Gestión', items: brokerWorkspaceItems },
    ]
  }
  return [{ items: brokerWorkspaceItems }]
}

function getHeaderTitle(role: WorkspaceRole): string {
  return role === 'TEAM_LEADER' ? 'Panel de Líder de Equipo' : 'Panel de Broker'
}

function getRoleLabel(role: WorkspaceRole): string {
  return role === 'TEAM_LEADER' ? 'Líder de Equipo' : 'Broker'
}

interface WorkspaceLayoutProps {
  children: React.ReactNode
  allowedRoles: WorkspaceRole[]
}

export function WorkspaceLayout({ children, allowedRoles }: WorkspaceLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, logout } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !allowedRoles.includes(user.role as WorkspaceRole))) {
      router.push('/login')
    }
  }, [loading, user, router, allowedRoles])

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

  if (!user || !allowedRoles.includes(user.role as WorkspaceRole)) {
    return null
  }

  const role = user.role as WorkspaceRole
  const menuSections = getMenuSections(role)

  return (
    <div className="min-h-screen bg-background">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
            <Logo size="sm" showText={true} className="text-sidebar-foreground" />
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            {menuSections.map((section, sectionIndex) => (
              <div
                key={section.title ?? `section-${sectionIndex}`}
                className={sectionIndex > 0 ? 'mt-4' : ''}
              >
                {section.title && (
                  <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span>{section.title}</span>
                  </p>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.href}>
                        <Button
                          asChild
                          variant={isActive ? 'default' : 'ghost'}
                          className={cn(
                            'w-full justify-start text-left transition-colors',
                            isActive
                              ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <Link href={item.href} onClick={() => setIsSidebarOpen(false)}>
                            <item.icon className="mr-3 h-5 w-5" />
                            <span>{item.label}</span>
                          </Link>
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>

          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-sidebar-foreground"><span>{user.nombre}</span></span>
                <span className="text-xs text-muted-foreground"><span>{getRoleLabel(role)}</span></span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:ml-64">
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
              <h1 className="text-lg font-semibold text-foreground"><span>{getHeaderTitle(role)}</span></h1>
            </div>

            <div className="flex items-center space-x-4">
              <ThemeToggle />

              <div className="hidden md:flex items-center space-x-3 text-sm">
                <div className="flex flex-col text-right">
                  <span className="font-medium text-foreground"><span>{user.nombre}</span></span>
                  <span className="text-xs text-muted-foreground"><span>{user.email}</span></span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 bg-background min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
