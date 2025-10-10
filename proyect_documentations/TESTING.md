# Testing Guide

Esta guía describe la estructura y mejores prácticas de testing para el proyecto Sistema de Gestión de Brokers y Comisiones.

## Tabla de Contenidos

1. [Estructura de Testing](#estructura-de-testing)
2. [Tecnologías Utilizadas](#tecnologías-utilizadas)
3. [Tipos de Tests](#tipos-de-tests)
4. [Comandos de Testing](#comandos-de-testing)
5. [Escribiendo Tests](#escribiendo-tests)
6. [Fixtures y Mocks](#fixtures-y-mocks)
7. [Mejores Prácticas](#mejores-prácticas)

## Estructura de Testing

```
tests/
├── setup.ts                          # Configuración global de tests
├── mocks/                            # Mocks globales
│   └── prisma.ts                    # Mock del cliente Prisma
├── fixtures/                         # Datos de prueba reutilizables
│   ├── user.fixtures.ts             # Fixtures de usuarios
│   ├── edificio.fixtures.ts         # Fixtures de edificios
│   ├── cliente.fixtures.ts          # Fixtures de clientes
│   └── lead.fixtures.ts             # Fixtures de leads
├── unit/                            # Tests unitarios
│   ├── domain/                      # Tests de lógica de dominio
│   │   ├── comision.test.ts        # Tests de comisiones
│   │   └── lead.test.ts            # Tests de leads
│   └── utils/                       # Tests de utilidades
│       └── auth.test.ts            # Tests de autenticación
├── integration/                     # Tests de integración
│   ├── api/                        # Tests de rutas API
│   │   ├── auth/
│   │   │   └── login.test.ts       # Tests de login
│   │   └── admin/
│   │       └── edificios.test.ts   # Tests de edificios
│   └── use-cases/                  # Tests de casos de uso
└── e2e/                            # Tests end-to-end (futuro)
```

## Tecnologías Utilizadas

- **Vitest**: Framework de testing moderno y rápido
- **@testing-library/react**: Testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para el DOM
- **vitest-mock-extended**: Mocking avanzado para Prisma y TypeScript
- **jsdom**: Entorno DOM para tests

## Tipos de Tests

### 1. Tests Unitarios (`tests/unit/`)

Tests de funciones puras y lógica de dominio sin dependencias externas.

**Características:**
- Sin llamadas a base de datos
- Sin llamadas HTTP
- Funciones puras y cálculos
- Validaciones de negocio

**Ejemplo:**
```typescript
describe('Commission Calculation', () => {
  it('should calculate commission correctly for standard rate', () => {
    const totalVenta = 50000000
    const porcentaje = 3.5
    const comision = totalVenta * (porcentaje / 100)

    expect(comision).toBe(1750000)
  })
})
```

### 2. Tests de Integración (`tests/integration/`)

Tests de rutas API y casos de uso que involucran múltiples componentes.

**Características:**
- Mock de Prisma Client
- Tests de rutas API completas
- Validación de flujos de negocio
- Tests de autenticación y autorización

**Ejemplo:**
```typescript
describe('POST /api/auth/login', () => {
  it('should login successfully with valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBeDefined()
  })
})
```

### 3. Tests E2E (`tests/e2e/`) - Futuro

Tests de flujos completos de usuario con base de datos real.

## Comandos de Testing

```bash
# Ejecutar todos los tests en modo watch
pnpm test

# Ejecutar tests una vez
pnpm test:run

# Ejecutar tests con interfaz gráfica
pnpm test:ui

# Ejecutar tests en modo watch
pnpm test:watch

# Ejecutar solo tests unitarios
pnpm test:unit

# Ejecutar solo tests de integración
pnpm test:integration

# Ejecutar tests con cobertura
pnpm test:coverage
```

## Escribiendo Tests

### Estructura de un Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks()
  })

  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test data'

      // Act
      const result = myFunction(input)

      // Assert
      expect(result).toBe('expected output')
    })
  })
})
```

### Testing de Rutas API

```typescript
import { describe, it, expect, vi } from 'vitest'
import { GET } from '@/app/api/your-route/route'
import { prismaMock } from '../../mocks/prisma'

// Mock Prisma
vi.mock('@/lib/db', () => ({
  prisma: prismaMock,
}))

describe('GET /api/your-route', () => {
  it('should return data successfully', async () => {
    // Mock database response
    prismaMock.model.findMany.mockResolvedValue([mockData])

    // Create request
    const request = new NextRequest('http://localhost/api/your-route')

    // Execute
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toBeDefined()
  })
})
```

### Testing con Autenticación

```typescript
// Mock auth module
vi.mock('@/lib/auth', () => ({
  verifyAuth: vi.fn(async () => ({
    success: true,
    user: { userId: 'test-id', email: 'test@test.com', role: 'ADMIN' }
  }))
}))
```

## Fixtures y Mocks

### Usando Fixtures

Los fixtures proporcionan datos de prueba consistentes:

```typescript
import { mockUsers } from '../../fixtures/user.fixtures'
import { mockEdificios } from '../../fixtures/edificio.fixtures'

// En tu test
prismaMock.user.findUnique.mockResolvedValue(mockUsers.admin)
prismaMock.edificio.findMany.mockResolvedValue([mockEdificios.edificio1])
```

### Creando Fixtures

```typescript
// tests/fixtures/your-model.fixtures.ts
export const mockYourModel = {
  item1: {
    id: 'test-id-1',
    name: 'Test Item 1',
    // ... más campos
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  item2: {
    // ...
  }
}
```

### Mock de Prisma

```typescript
import { prismaMock } from '../mocks/prisma'

// Mock una query
prismaMock.user.findUnique.mockResolvedValue(mockUser)

// Mock un error
prismaMock.user.create.mockRejectedValue(new Error('Database error'))

// Verificar llamadas
expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1)
expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
  where: { email: 'test@test.com' }
})
```

## Mejores Prácticas

### 1. Principios Generales

- **Test en aislamiento**: Cada test debe ser independiente
- **Usa beforeEach**: Limpia mocks antes de cada test
- **Nombres descriptivos**: Usa nombres claros que describan qué se prueba
- **AAA Pattern**: Arrange, Act, Assert
- **Un concepto por test**: Cada test debe verificar una sola cosa

### 2. Organización

```typescript
describe('Feature', () => {
  describe('Specific Behavior', () => {
    it('should handle success case', () => {})
    it('should handle error case', () => {})
  })

  describe('Edge Cases', () => {
    it('should handle null values', () => {})
    it('should handle empty arrays', () => {})
  })
})
```

### 3. Testing de Errores

```typescript
// Testing de errores síncronos
expect(() => myFunction()).toThrow('Error message')

// Testing de errores asíncronos
await expect(asyncFunction()).rejects.toThrow('Error message')

// Testing de respuestas de error
const response = await POST(request)
expect(response.status).toBe(400)
expect((await response.json()).error).toBe('Expected error message')
```

### 4. Testing de Casos Límite

Siempre incluye tests para:
- Valores null/undefined
- Arrays vacíos
- Strings vacíos
- Valores numéricos límite (0, negativos, muy grandes)
- Validaciones de formato (RUT, email, etc.)

### 5. Cobertura de Código

Objetivos de cobertura:
- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

Ver cobertura:
```bash
pnpm test:coverage
```

### 6. Performance

- Usa `vi.clearAllMocks()` en `beforeEach` para limpiar estado
- No hagas tests dependientes entre sí
- Usa fixtures en lugar de crear datos en cada test
- Agrupa tests relacionados con `describe`

### 7. Testing de Lógica de Negocio

Siempre testea:
- ✅ Cálculos de comisiones
- ✅ Transiciones de estado (Lead, Unidad)
- ✅ Validaciones de RUT
- ✅ Reglas de autorización (ADMIN vs BROKER)
- ✅ Cálculos de UF
- ✅ Fechas y plazos

### 8. Qué NO testear

- ❌ Implementaciones de librerías externas
- ❌ Código generado (Prisma Client)
- ❌ Configuración de Next.js
- ❌ Archivos de tipos TypeScript (.d.ts)

## Integración Continua

Los tests deben ejecutarse en:
- Pre-commit hooks (opcional)
- Pull requests (requerido)
- Antes de merge a main
- En pipeline de CI/CD

## Debugging Tests

```bash
# Ejecutar un archivo específico
pnpm test tests/unit/domain/comision.test.ts

# Ejecutar con logs detallados
pnpm test --reporter=verbose

# Ejecutar en modo debug
pnpm test --inspect-brk
```

## Recursos Adicionales

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Ejemplos por Tipo de Test

### Domain Logic (Unit)
```typescript
// tests/unit/domain/comision.test.ts
describe('Commission Calculation', () => {
  it('should calculate correctly', () => {
    const result = calculateCommission(100000, 5)
    expect(result).toBe(5000)
  })
})
```

### API Route (Integration)
```typescript
// tests/integration/api/edificios.test.ts
describe('POST /api/admin/edificios', () => {
  it('should create edificio', async () => {
    prismaMock.edificio.create.mockResolvedValue(mockEdificio)
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

### State Transitions (Unit)
```typescript
// tests/unit/domain/lead.test.ts
describe('Lead State Transitions', () => {
  it('should allow ENTREGADO to RESERVA_PAGADA', () => {
    expect(canTransition('ENTREGADO', 'RESERVA_PAGADA')).toBe(true)
  })
})
```

---

**Última actualización**: 2025-10-02
**Versión**: 1.0.0
