'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import * as LucideIcons from 'lucide-react'

// Lista de iconos comunes para características de edificios
const COMMON_ICONS = [
  'Building2', 'Home', 'Building', 'Warehouse', 'Castle',
  'Waves', 'Dumbbell', 'Utensils', 'Coffee', 'Wine',
  'Shield', 'Lock', 'Camera', 'Eye', 'ShieldCheck',
  'Trees', 'Leaf', 'Sun', 'Moon', 'CloudRain',
  'Car', 'Bike', 'Bus', 'Train', 'Plane',
  'Wifi', 'Zap', 'Plug', 'Lightbulb', 'Smartphone',
  'Users', 'User', 'Baby', 'Dog', 'Cat',
  'ShoppingCart', 'ShoppingBag', 'Store', 'MapPin', 'Map',
  'Heart', 'Star', 'Award', 'Trophy', 'Medal',
  'Sparkles', 'Flame', 'Droplet', 'Wind', 'Snowflake',
  'Umbrella', 'Sofa', 'Bed', 'Tv', 'Music',
  'Book', 'GraduationCap', 'Briefcase', 'Target', 'TrendingUp',
  'CheckCircle', 'XCircle', 'AlertCircle', 'Info', 'HelpCircle',
  'Settings', 'Tool', 'Wrench', 'Hammer', 'Paintbrush',
  'Image', 'Film', 'Video', 'Aperture',
  'Globe', 'Compass', 'Navigation', 'Anchor', 'Flag'
]

interface IconPickerProps {
  value?: string
  onChange: (iconName: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label = 'Icono' }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  // Filtrar solo iconos que existan en lucide-react
  const filteredIcons = COMMON_ICONS
    .filter(iconName => LucideIcons[iconName as keyof typeof LucideIcons])
    .filter(iconName => iconName.toLowerCase().includes(search.toLowerCase()))

  const SelectedIcon = value && LucideIcons[value as keyof typeof LucideIcons]
    ? (LucideIcons[value as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>)
    : null

  const handleSelectIcon = (iconName: string) => {
    onChange(iconName)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            {SelectedIcon ? (
              <div className="flex items-center gap-2">
                <SelectedIcon className="h-4 w-4" />
                <span>{value}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">Seleccionar icono...</span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Seleccionar Icono</DialogTitle>
            <DialogDescription>
              Elige un icono de Lucide React para representar esta característica
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              placeholder="Buscar icono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.map((iconName) => {
                  const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>

                  // Seguridad adicional: solo renderizar si el icono existe
                  if (!IconComponent) return null

                  return (
                    <Button
                      key={iconName}
                      variant={value === iconName ? 'default' : 'outline'}
                      className="h-16 w-16 flex flex-col items-center justify-center p-2"
                      onClick={() => handleSelectIcon(iconName)}
                      title={iconName}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-[10px] mt-1 truncate w-full text-center">
                        {iconName}
                      </span>
                    </Button>
                  )
                })}
              </div>

              {filteredIcons.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No se encontraron iconos
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
