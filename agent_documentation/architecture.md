# Architecture Documentation

## Pattern: Hexagonal Architecture (Clean Architecture)
```
src/core/
├── domain/        # Entities, Value Objects, Enums — NO external deps
├── application/   # Use Cases, Ports (interfaces), DTOs
└── infrastructure/ # Adapters (Prisma), Services
```

## Rules
- Always follow: Domain → Application → Infrastructure
- Use dependency injection via constructor
- Define ports (interfaces) in application layer
- Domain entities must be pure — no external dependencies

## Use Case Structure
```typescript
interface CreateEdificioUseCase {
  execute(input: CreateEdificioDto): Promise<Edificio>
}

class CreateEdificioUseCaseImpl implements CreateEdificioUseCase {
  constructor(private edificioRepository: EdificioRepository) {}
  async execute(input: CreateEdificioDto): Promise<Edificio> {
    // 1. Business validation
    // 2. Repository interaction
    // 3. Return result
  }
}
```

## Full Directory Structure
```
src/
├── app/                    # Next.js App Router
├── core/
│   ├── domain/
│   │   ├── entities/       # Pure business entities
│   │   ├── enums/
│   │   ├── value-objects/
│   │   └── exceptions/
│   ├── application/
│   │   ├── use-cases/
│   │   ├── ports/          # Interfaces/contracts
│   │   └── dto/
│   └── infrastructure/
│       ├── adapters/       # Repository implementations
│       ├── database/
│       └── services/
├── components/ui, layout, forms, tables, common
├── lib/auth.ts, db.ts, validations.ts, hooks/
└── types/                  # Centralized TypeScript types
```

## Naming Conventions
- Files: kebab-case (`crear-edificio.ts`)
- Components: PascalCase (`EdificioForm.tsx`)
- Variables/Functions: camelCase
- Constants: UPPER_SNAKE_CASE (`JWT_SECRET`)
- Database Models: PascalCase
- **All internal code in English** — Spanish only for user-facing UI text
