# Tests Directory

Este directorio contiene todos los tests del proyecto organizados según mejores prácticas de testing.

## 📁 Estructura

```
tests/
├── setup.ts              # Configuración global de Vitest
├── mocks/                # Mocks compartidos
├── fixtures/             # Datos de prueba reutilizables
├── unit/                 # Tests unitarios
│   ├── domain/          # Lógica de dominio
│   └── utils/           # Utilidades y helpers
├── integration/          # Tests de integración
│   ├── api/             # Rutas API
│   └── use-cases/       # Casos de uso
└── e2e/                 # Tests end-to-end (futuro)
```

## 🚀 Comandos Rápidos

```bash
# Desarrollo
pnpm test                 # Watch mode
pnpm test:ui             # Interfaz gráfica

# CI/CD
pnpm test:run            # Ejecución única
pnpm test:coverage       # Con cobertura

# Específicos
pnpm test:unit           # Solo unitarios
pnpm test:integration    # Solo integración
```

## 📚 Guías

- **Documentación completa**: Ver [TESTING.md](../TESTING.md)
- **Cobertura actual**: Ejecutar `pnpm test:coverage`
- **Mejores prácticas**: Ver sección en TESTING.md

## 🔧 Fixtures Disponibles

- `user.fixtures.ts` - Usuarios (admin, broker, inactive)
- `edificio.fixtures.ts` - Edificios, tipos de unidad, unidades
- `cliente.fixtures.ts` - Clientes con diferentes configuraciones
- `lead.fixtures.ts` - Leads en diferentes estados

## 📝 Ejemplo Rápido

```typescript
import { describe, it, expect } from 'vitest'
import { prismaMock } from '../mocks/prisma'
import { mockUsers } from '../fixtures/user.fixtures'

describe('My Feature', () => {
  it('should work correctly', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

    const result = await myFunction()

    expect(result).toBeDefined()
  })
})
```

## ✅ Checklist para Nuevos Tests

- [ ] Import necesarios de vitest
- [ ] Mock de Prisma si es necesario
- [ ] Usar fixtures existentes
- [ ] Limpiar mocks en beforeEach
- [ ] Nombres descriptivos
- [ ] Casos de éxito y error
- [ ] Casos límite

## 🎯 Objetivos de Cobertura

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

Para más información, consulta [TESTING.md](../TESTING.md)
