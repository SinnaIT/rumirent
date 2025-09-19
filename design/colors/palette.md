# Paleta de Colores - RumiRent

## Filosofía de Color

RumiRent utiliza una paleta de colores basada en **azul y blanco** que transmite **confianza**, **profesionalismo** y **claridad** en el sector inmobiliario. Para el modo oscuro, combinamos azul con tonos grises para mantener la legibilidad y elegancia.

## Colores Principales

### 🔵 Primario - Azul Profesional
**OKLCH**: `oklch(0.45 0.18 240)` (Light) / `oklch(0.65 0.20 240)` (Dark)
**Significado**: Confianza, estabilidad, profesionalismo
**Uso**: Botones principales, elementos de navegación activos, indicadores importantes

### 🔷 Secundario - Azul Profundo
**OKLCH**: `oklch(0.35 0.15 240)` (Light) / `oklch(0.70 0.18 240)` (Dark)
**Significado**: Solidez, experiencia, autoridad
**Uso**: Texto secundario, iconos, elementos de apoyo

### 💙 Acento - Azul Brillante
**OKLCH**: `oklch(0.55 0.20 240)` (Light) / `oklch(0.75 0.22 240)` (Dark)
**Significado**: Dinamismo, interactividad, destacado
**Uso**: Enlaces, elementos interactivos, llamadas a la acción

## Colores de Estado

### ✅ Éxito - Verde Natural
**OKLCH**: `oklch(0.55 0.15 145)` (Light) / `oklch(0.70 0.18 145)` (Dark)
**Uso**: Ventas completadas, confirmaciones, estados positivos

### ⚠️ Advertencia - Amarillo Cálido
**OKLCH**: `oklch(0.70 0.15 65)` (Light) / `oklch(0.75 0.18 65)` (Dark)
**Uso**: Alertas, procesos pendientes, información importante

### ❌ Error - Rojo Profesional
**OKLCH**: `oklch(0.55 0.22 25)` (Light) / `oklch(0.65 0.24 25)` (Dark)
**Uso**: Errores, rechazos, estados críticos

## Tonos Neutros

### Background/Foreground
- **Light Mode**: Fondo blanco puro `oklch(1.00 0.000 0)` + Texto azul oscuro `oklch(0.15 0.020 240)`
- **Dark Mode**: Fondo azul muy oscuro `oklch(0.12 0.010 240)` + Texto gris claro `oklch(0.95 0.005 0)`

### Cards y Superficies
- **Light Mode**: Blanco suave `oklch(0.99 0.002 240)`
- **Dark Mode**: Azul oscuro `oklch(0.15 0.015 240)`

### Bordes y Separadores
- **Light Mode**: Gris muy claro `oklch(0.92 0.008 240)`
- **Dark Mode**: Gris azulado `oklch(0.25 0.020 240)`

## Uso en el Contexto Inmobiliario

- **Azul**: Color universalmente asociado con confianza y profesionalismo
- **Blanco**: Limpieza, transparencia y honestidad en las transacciones
- **Grises azulados**: En modo oscuro proporcionan sofisticación y elegancia
- **Contraste claro**: Facilita la lectura de información financiera importante

## Ventajas de la Paleta Azul/Blanco

1. **Universalidad**: Funciona en cualquier cultura y contexto
2. **Legibilidad**: Alto contraste para datos financieros
3. **Profesionalismo**: Inspira confianza en transacciones inmobiliarias
4. **Accesibilidad**: Cumple estándares WCAG AAA
5. **Versatilidad**: Fácil combinación con otros elementos de marca

## Implementación Técnica

Todos los colores están definidos usando el espacio de color **OKLCH** para garantizar:
- Consistencia perceptual entre tonos
- Mejor soporte para modo oscuro
- Accesibilidad mejorada (contraste AAA)
- Escalabilidad para futuras variaciones

## Tokens CSS

```css
:root {
  /* Light Mode - Blue & White */
  --primary: oklch(0.45 0.18 240);
  --secondary: oklch(0.35 0.15 240);
  --accent: oklch(0.55 0.20 240);
  --background: oklch(1.00 0.000 0);
  --foreground: oklch(0.15 0.020 240);
}

.dark {
  /* Dark Mode - Blue & Grey */
  --primary: oklch(0.65 0.20 240);
  --secondary: oklch(0.70 0.18 240);
  --accent: oklch(0.75 0.22 240);
  --background: oklch(0.12 0.010 240);
  --foreground: oklch(0.95 0.005 0);
}
```

## Comparación con Paleta Anterior

### Antes: Verde Esmeralda + Dorado
- Colores más específicos del sector inmobiliario
- Verde asociado con crecimiento y prosperidad
- Dorado para highlighting de comisiones

### Ahora: Azul + Blanco
- Mayor universalidad y profesionalismo
- Mejor legibilidad y contraste
- Más versátil para diferentes tipos de usuarios
- Inspirado en plataformas financieras exitosas (Stripe, PayPal)