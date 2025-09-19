# Guía de Uso de Colores

## Aplicación por Contexto

### Verde Esmeralda (Primary)
**Cuándo usar:**
- Botones principales de acción (Crear, Guardar, Confirmar)
- Enlaces importantes
- Estados activos en navegación
- Indicadores de éxito en ventas

**Ejemplos:**
- Botón "Registrar Venta"
- Estado activo en sidebar
- Badges de "Vendido"
- Progress bars de comisiones

### Azul Corporativo (Secondary)
**Cuándo usar:**
- Botones secundarios
- Headers y títulos importantes
- Bordes de elementos destacados
- Iconos de navegación

**Ejemplos:**
- Títulos de secciones
- Botones "Ver Detalles"
- Bordes de cards importantes
- Iconos en la barra lateral

### Dorado (Accent)
**Cuándo usar:**
- Elementos relacionados con comisiones
- Highlights especiales
- Valores monetarios importantes
- Estados premium/urgentes

**Ejemplos:**
- Montos de comisiones
- Badges de "Prioridad Alta"
- Destacados en reportes
- Elementos de valor económico

## Semántica de Colores

### Por Tipo de Unidad
- **Studio**: Verde claro `oklch(0.75 0.12 160)`
- **1 Dormitorio**: Verde medio `oklch(0.65 0.15 155)`
- **2 Dormitorios**: Verde oscuro `oklch(0.55 0.18 150)`
- **3 Dormitorios**: Azul-verde `oklch(0.45 0.20 180)`
- **Penthouse**: Dorado `oklch(0.65 0.18 80)`

### Por Estado de Unidad
- **Disponible**: Verde `oklch(0.55 0.15 145)`
- **Reservada**: Ámbar `oklch(0.70 0.15 65)`
- **Vendida**: Gris `oklch(0.50 0.05 220)`

### Por Prioridad de Venta
- **Baja**: Gris `oklch(0.60 0.08 220)`
- **Media**: Azul `oklch(0.55 0.12 220)`
- **Alta**: Naranja `oklch(0.65 0.15 50)`
- **Urgente**: Rojo `oklch(0.55 0.22 25)`

## Contraste y Accesibilidad

### Niveles de Contraste WCAG
- **AAA**: Textos principales sobre fondo
- **AA**: Textos secundarios y elementos UI
- **Mínimo**: Bordes y elementos decorativos

### Combinaciones Recomendadas
```css
/* Texto sobre fondo claro */
color: oklch(0.15 0.025 220);
background: oklch(0.99 0.005 80);

/* Botón primario */
color: oklch(0.99 0.005 80);
background: oklch(0.35 0.15 160);

/* Texto sobre primary */
color: oklch(0.99 0.005 80);
background: oklch(0.35 0.15 160);
```