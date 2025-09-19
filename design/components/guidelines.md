# Guías de Componentes - RumiRent

## Principios de Diseño de Componentes

### Consistencia
- Usar siempre los tokens de color definidos
- Mantener espaciado coherente usando la escala establecida
- Aplicar border radius consistente según el tipo de componente

### Jerarquía Visual
- Componentes primarios usan colores `primary`
- Componentes secundarios usan colores `secondary` o `muted`
- Estados especiales usan colores semánticos (`success`, `warning`, `destructive`)

## Componentes por Función

### Navegación

#### Sidebar
```css
/* Container */
background: var(--sidebar);
border: 1px solid var(--sidebar-border);

/* Items normales */
color: var(--sidebar-foreground);
hover: background: var(--sidebar-accent);

/* Item activo */
background: var(--sidebar-primary);
color: var(--sidebar-primary-foreground);
```

#### Breadcrumbs
```css
color: var(--muted-foreground);
separator: var(--border);
current: var(--foreground);
```

### Formularios

#### Inputs
```css
/* Base */
background: var(--background);
border: 1px solid var(--border);
color: var(--foreground);

/* Focus */
border-color: var(--ring);
box-shadow: 0 0 0 2px var(--ring/20%);

/* Error */
border-color: var(--destructive);
color: var(--destructive);
```

#### Botones
```css
/* Primary */
background: var(--primary);
color: var(--primary-foreground);
hover: opacity: 0.9;

/* Secondary */
background: var(--secondary);
color: var(--secondary-foreground);

/* Outline */
border: 1px solid var(--border);
background: transparent;
color: var(--foreground);
```

### Datos y Contenido

#### Cards
```css
/* Container */
background: var(--card);
border: 1px solid var(--border);
border-radius: var(--radius-lg);
color: var(--card-foreground);

/* Header */
border-bottom: 1px solid var(--border);
font-weight: 600;

/* Content */
padding: var(--spacing-lg);
```

#### Tablas
```css
/* Header */
background: var(--muted);
color: var(--muted-foreground);
font-weight: 600;

/* Rows */
border-bottom: 1px solid var(--border);
hover: background: var(--muted/50%);

/* Striped */
nth-child(even): background: var(--muted/30%);
```

### Estados y Feedback

#### Badges
```css
/* Success (Vendido) */
background: var(--success);
color: var(--success-foreground);

/* Warning (Reservado) */
background: var(--warning);
color: var(--warning-foreground);

/* Default (Disponible) */
background: var(--secondary);
color: var(--secondary-foreground);

/* Destructive (Error) */
background: var(--destructive);
color: var(--destructive-foreground);
```

#### Alerts
```css
/* Info */
background: var(--primary/10%);
border: 1px solid var(--primary/20%);
color: var(--primary);

/* Success */
background: var(--success/10%);
border: 1px solid var(--success/20%);
color: var(--success);

/* Warning */
background: var(--warning/10%);
border: 1px solid var(--warning/20%);
color: var(--warning);
```

## Componentes Específicos del Negocio

### Unidades Inmobiliarias

#### Tarjeta de Unidad
```css
/* Base */
background: var(--card);
border: 2px solid var(--border);
border-radius: var(--radius-lg);

/* Estado Disponible */
border-color: var(--success);
box-shadow: 0 0 0 1px var(--success/20%);

/* Estado Reservado */
border-color: var(--warning);
box-shadow: 0 0 0 1px var(--warning/20%);

/* Estado Vendido */
border-color: var(--muted);
opacity: 0.7;
```

#### Precio y Comisión
```css
/* Precio base */
color: var(--foreground);
font-weight: 700;
font-family: var(--font-mono);

/* Comisión */
color: var(--accent);
font-weight: 600;
font-family: var(--font-mono);

/* Multiplicador de prioridad */
color: var(--destructive);
font-weight: 800;
```

### Dashboard y Analytics

#### Métricas Cards
```css
/* Container */
background: var(--card);
border: 1px solid var(--border);
padding: var(--spacing-6);

/* Valor principal */
font-size: 2rem;
font-weight: 700;
color: var(--primary);
font-family: var(--font-mono);

/* Cambio positivo */
color: var(--success);

/* Cambio negativo */
color: var(--destructive);
```

#### Charts y Gráficos
```css
/* Usa los chart colors definidos */
--chart-1: Verde principal
--chart-2: Azul corporativo
--chart-3: Dorado
--chart-4: Verde éxito
--chart-5: Ámbar
```

## Responsive Behavior

### Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  /* Sidebar colapsada */
  /* Cards en columna única */
  /* Tablas horizontalmente scrollables */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Sidebar expandida */
  /* Cards en 2 columnas */
  /* Tablas completas */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Layout completo */
  /* Cards en 3+ columnas */
  /* Máximo aprovechamiento del espacio */
}
```

## Animaciones y Transiciones

### Sutiles y Profesionales
```css
/* Hover states */
transition: all 0.2s ease-in-out;

/* Focus states */
transition: box-shadow 0.15s ease-in-out;

/* Loading states */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

## Accesibilidad

### Focus Management
- Focus visible en todos los elementos interactivos
- Skip links para navegación con teclado
- ARIA labels descriptivos

### Color Contrast
- Todos los textos cumplen WCAG AA
- Estados de error claramente distinguibles
- Información no dependiente solo del color