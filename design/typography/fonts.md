# Tipografía - RumiRent

## Fuentes Base

El proyecto utiliza **Geist** como familia tipográfica principal:

- **Geist Sans**: Para textos generales, interfaces y navegación
- **Geist Mono**: Para códigos, datos numéricos y elementos técnicos

```css
--font-sans: var(--font-geist-sans);
--font-mono: var(--font-geist-mono);
```

## Escalas Tipográficas

### Títulos y Headings

```css
/* H1 - Títulos principales de página */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
font-weight: 700;

/* H2 - Títulos de secciones */
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
font-weight: 600;

/* H3 - Subtítulos */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
font-weight: 600;

/* H4 - Títulos menores */
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
font-weight: 500;
```

### Textos de Cuerpo

```css
/* Texto principal */
.text-base { font-size: 1rem; line-height: 1.5rem; }
font-weight: 400;

/* Texto grande */
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
font-weight: 400;

/* Texto pequeño */
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
font-weight: 400;

/* Texto muy pequeño */
.text-xs { font-size: 0.75rem; line-height: 1rem; }
font-weight: 400;
```

## Uso por Contexto

### Navegación y Menús
- **Sidebar**: `.text-sm font-medium`
- **Breadcrumbs**: `.text-sm text-muted-foreground`
- **Tabs**: `.text-sm font-medium`

### Formularios
- **Labels**: `.text-sm font-medium`
- **Inputs**: `.text-sm`
- **Help text**: `.text-xs text-muted-foreground`
- **Error messages**: `.text-xs text-destructive`

### Tablas y Datos
- **Headers**: `.text-sm font-semibold`
- **Cells**: `.text-sm`
- **Montos**: `.font-mono text-sm`
- **Códigos**: `.font-mono text-xs`

### Cards y Contenido
- **Card titles**: `.text-lg font-semibold`
- **Card content**: `.text-sm`
- **Metadata**: `.text-xs text-muted-foreground`

### Botones
- **Primarios**: `.text-sm font-medium`
- **Secundarios**: `.text-sm font-medium`
- **Enlaces**: `.text-sm font-medium underline-offset-4`

## Jerarquía Visual

### Títulos de Página
```css
/* Dashboard principal */
.page-title {
  @apply text-3xl font-bold tracking-tight;
}

/* Secciones administrativas */
.section-title {
  @apply text-2xl font-semibold;
}

/* Subtítulos de contenido */
.content-title {
  @apply text-xl font-medium;
}
```

### Contenido Especializado

#### Valores Monetarios
```css
.currency {
  @apply font-mono text-lg font-semibold;
  font-variant-numeric: tabular-nums;
}

.currency-large {
  @apply font-mono text-2xl font-bold;
  font-variant-numeric: tabular-nums;
}
```

#### Estados y Badges
```css
.badge-text {
  @apply text-xs font-medium uppercase tracking-wide;
}

.status-text {
  @apply text-sm font-medium;
}
```

## Responsive Typography

### Mobile First
```css
/* Base mobile */
.responsive-title {
  @apply text-2xl;
}

/* Tablet y desktop */
@media (min-width: 768px) {
  .responsive-title {
    @apply text-3xl;
  }
}

@media (min-width: 1024px) {
  .responsive-title {
    @apply text-4xl;
  }
}
```

## Accesibilidad

- **Contraste mínimo**: WCAG AA (4.5:1 para texto normal)
- **Contraste mejorado**: WCAG AAA (7:1 para texto importante)
- **Tamaño mínimo**: 16px para texto principal en móvil
- **Line height**: Mínimo 1.5 para legibilidad óptima