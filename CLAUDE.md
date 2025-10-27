# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Sistema de Gestión de Brokers y Comisiones** - a Next.js 15 application built with TypeScript for managing real estate contractors and their commissions based on building projects and unit sales. The system features dynamic commission calculations based on sales priority/urgency.

## Development rules
- siempre que crees una nueva entidad, campo, archivo, metodo o variable usa la traducciona al ingles para llevar buenas practicas en el proyecto, solo usa español en las cosas que vera y leera el usuario final, todo lo del back y logica interna debe estar en ingles 

## Development Commands

- **Development server**: `pnpm dev` (uses Turbopack for faster builds)
- **Build**: `pnpm build` (uses Turbopack)
- **Production server**: `pnpm start`
- **Linting**: `pnpm lint`
- **Database**:
  - `pnpm db:generate` (or `npx prisma generate`)
  - `pnpm db:migrate` (or `npx prisma migrate dev`)
  - `pnpm db:studio` (or `npx prisma studio`)

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcryptjs (roles: admin/broker)
- **Styling**: Tailwind CSS v4 with CSS variables
- **UI Components**: shadcn/ui with Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Project Architecture

### Hexagonal Architecture (Clean Architecture)

The project follows **hexagonal architecture** principles with clear separation of concerns:

```
src/
├── app/                     # Next.js App Router
├── core/                    # Business Logic (Hexagonal Architecture)
│   ├── domain/              # Entities, Value Objects, Enums
│   ├── application/         # Use Cases, Ports (Interfaces)
│   └── infrastructure/      # Adapters (Prisma, Services)
├── components/              # UI Components
└── lib/                     # Utilities
```

### Domain Entities

#### Core Business Entities:
- **User**: Authenticated users with roles (ADMIN/BROKER), includes RUT field
- **Edificio**: Real estate projects with base commission, contains multiple unit types
- **TipoUnidadEdificio**: Unit types per building with specific commissions (replaces enum)
- **Unidad**: Individual apartments/units, references TipoUnidadEdificio
- **Cliente**: Clients created by contractors, with RUT and contact info
- ****: Sales contracts with flexible pricing, dates, and optional unit reference
- **Comision**: Commission configurations with percentage rates
- **CambioComisionProgramado**: Scheduled commission changes

#### Key Enums:
```typescript
enum Role { ADMIN, BROKER }
enum EstadoEdificio { PLANIFICACION, CONSTRUCCION, COMPLETADO }
enum EstadoUnidad { DISPONIBLE, RESERVADA, VENDIDA }
enum Estado { ENTREGADO, RESERVA_PAGADA, APROBADO, RECHAZADO }
```
### Style Rules
for every style or design related descition you mae read first the strsucture on de folder /design

### Business Rules

#### Commission System:
- **Edificio**: Has a base commission rate (`comisionId`)
- **TipoUnidadEdificio**: Each unit type can have its own specific commission rate (`comisionId`)
- **Commission calculation**: Final commission comes from TipoUnidadEdificio, not unit priority
- **Flexible structure**: Allows different commission rates per unit type within same building
- **Scheduled changes**: `CambioComisionProgramado` allows future commission updates

#### Contract System:
- **Flexible units**: Contracts can reference existing units OR use manual `codigoUnidad`
- **Multiple dates**: Tracks reservation payment, contract payment, and checkin dates
- **Dual pricing**: Supports both peso amounts (`total`) and UF amounts (`montoUf`)
- **Status tracking**: Contractors update contract status through defined workflow
- **Client ownership**: Each client belongs to the contractor who created them

#### User Roles & Permissions:
- **ADMIN**: Full CRUD operations, commission configuration, analytics, all buildings/units
- **BROKER**: Manage own clients, register sales, view assigned units, view personal history

#### Database Schema Key Changes:
- **Eliminated**: `asignaciones_comision` table (redundant)
- **Eliminated**: `PrioridadVenta` enum (replaced by commission structure)
- **Eliminated**: `TipoUnidad` enum (replaced by `TipoUnidadEdificio` table)
- **Added**: `Cliente` entity with contractor ownership
- **Enhanced**: `` with flexible pricing and dates

### Directory Structure

```
src/
├── app/                           # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── admin/                    # Administrator interface
│   │   ├── edificios/           # Building management
│   │   ├── unidades/            # Unit management
│   │   ├── brokers/        # Contractor management
│   │   ├── comisiones/          # Commission configuration
│   │   └── reportes/            # Reports & analytics
│   ├── broker/             # Contractor interface
│   │   ├── unidades/            # Available units view
│   │   ├── ventas/              # Sales registration
│   │   └── historial/           # Sales history
│   └── api/                     # API Routes
│       ├── auth/
│       ├── edificios/
│       ├── unidades/
│       ├── s/
│       └── comisiones/
├── core/                         # Hexagonal Architecture
│   ├── domain/
│   │   ├── entities/            # Pure business entities
│   │   ├── enums/               # Domain enums
│   │   ├── value-objects/       # Value objects (Email, Money, etc.)
│   │   └── exceptions/          # Domain exceptions
│   ├── application/
│   │   ├── use-cases/           # Business use cases
│   │   ├── ports/               # Interfaces (contracts)
│   │   └── dto/                 # Data transfer objects
│   └── infrastructure/
│       ├── adapters/            # Repository implementations
│       ├── database/            # Database configuration
│       └── services/            # External service adapters
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components
│   ├── forms/                   # Business forms
│   ├── tables/                  # Data tables
│   └── common/                  # Reusable components
└── lib/
    ├── auth.ts                  # Authentication utilities
    ├── db.ts                    # Database client
    ├── validations.ts           # Zod schemas
    └── hooks/                   # Custom React hooks
```

### Use Cases (Application Layer)

#### Administrator Use Cases:
1. **Gestionar Edificios**: CRUD operations for building projects with base commission assignment
2. **Gestionar Tipos de Unidad**: CRUD operations for unit types per building with specific commissions
3. **Gestionar Unidades**: CRUD operations for individual units linked to unit types
4. **Configurar Comisiones**: Create and manage commission rates and schedules
5. **Gestionar Brokers**: CRUD operations for contractor users with RUT validation
6. **Gestionar Clientes**: View all clients across contractors
7. **Ver Analytics**: Dashboard with sales metrics, commission reports, and building performance

#### Contractor Use Cases:
1. **Gestionar Clientes**: CRUD operations for own clients with RUT validation
2. **Ver Unidades Disponibles**: View available units with commission calculation from unit types
3. **Registrar s**: Create contracts with flexible unit reference (existing unit OR manual code)
4. **Gestionar s**: Update contract status through workflow stages
5. **Ver Historial**: View personal sales history and earned commissions
6. **Calcular Comisiones**: Real-time commission calculation based on unit type rates

### API Route Structure

```
/api/
├── auth/
│   ├── login/route.ts           # POST authentication
│   ├── register/route.ts        # POST user registration
│   └── me/route.ts              # GET current user
├── admin/
│   ├── edificios/
│   │   ├── route.ts             # GET, POST buildings with commission
│   │   └── [id]/
│   │       ├── route.ts         # GET, PUT, DELETE building
│   │       └── tipos-unidad/route.ts # GET, POST unit types for building
│   ├── unidades/
│   │   ├── route.ts             # GET, POST units
│   │   └── [id]/route.ts        # GET, PUT, DELETE unit
│   ├── clientes/
│   │   ├── route.ts             # GET all clients (admin view)
│   │   └── [id]/route.ts        # GET, PUT, DELETE client
│   ├── s/
│   │   ├── route.ts             # GET, POST contracts (admin)
│   │   └── [id]/route.ts        # GET, PUT contract details
│   ├── comisiones/
│   │   ├── route.ts             # GET, POST commissions
│   │   ├── [id]/route.ts        # GET, PUT, DELETE commission
│   │   └── programados/route.ts # GET, POST scheduled changes
│   └── brokers/
│       ├── route.ts             # GET, POST contractors
│       └── [id]/route.ts        # GET, PUT, DELETE contractor
├── broker/
│   ├── clientes/
│   │   ├── route.ts             # GET, POST own clients
│   │   └── [id]/route.ts        # GET, PUT, DELETE own client
│   ├── s/
│   │   ├── route.ts             # GET, POST own contracts
│   │   └── [id]/route.ts        # GET, PUT own contract
│   ├── unidades/
│   │   └── disponibles/route.ts # GET available units with commissions
│   └── dashboard/route.ts       # GET contractor metrics
└── shared/
    ├── edificios/
    │   └── [id]/tipos-unidad/route.ts # GET unit types for dropdowns
    └── comisiones/
        └── calculate/route.ts   # POST commission calculations
```

## Development Guidelines

### Architecture Patterns

- **Always follow hexagonal architecture**: Domain → Application → Infrastructure
- **Use dependency injection**: Inject repositories and services through constructor
- **Implement interfaces**: Define ports (interfaces) in application layer
- **Pure domain logic**: No external dependencies in domain entities

### Code Organization

```typescript
// Use Case Example Structure
interface CreateEdificioUseCase {
  execute(input: CreateEdificioDto): Promise<Edificio>
}

class CreateEdificioUseCaseImpl implements CreateEdificioUseCase {
  constructor(private edificioRepository: EdificioRepository) {}
  
  async execute(input: CreateEdificioDto): Promise<Edificio> {
    // Business validation
    // Repository interaction
    // Return result
  }
}
```

### Naming Conventions

- **Files**: kebab-case (`crear-edificio.ts`)
- **Components**: PascalCase (`EdificioForm.tsx`)
- **Variables/Functions**: camelCase (`crearEdificio`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_SECRET`)
- **Database Models**: PascalCase (`Edificio`, `Unidad`)

### Authentication & Authorization

- **JWT tokens**: Stored in httpOnly cookies
- **Role-based access**: Middleware validates user roles
- **Route protection**: Both API routes and pages protected
- **Token validation**: Every request validates JWT and user permissions

### Database Schema (Prisma)

Key models with relationships:
```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  password String
  role     Role   @default(BROKER)
  nombre   String
}

model Edificio {
  id          String @id @default(cuid())
  nombre      String
  direccion   String
  estado      EstadoEdificio
  unidades    Unidad[]
}

model Unidad {
  id          String @id @default(cuid())
  edificioId  String
  tipo        TipoUnidad
  precio      Float
  estado      EstadoUnidad
  prioridad   PrioridadVenta
  edificio    Edificio @relation(fields: [edificioId], references: [id])
  s   []
}
```

### UI Component Guidelines

- **Use shadcn/ui components**: Consistent design system
- **Apply Tailwind classes**: Use `cn()` utility for conditional styles
- **Form validation**: Always use Zod schemas with React Hook Form
- **Loading states**: Implement proper loading and error states
- **Accessibility**: Ensure proper ARIA labels and keyboard navigation

### Environment Variables

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="secure-jwt-secret"
JWT_EXPIRES_IN="7d"
```

## Business Context

This application manages real estate sales with dynamic commission structures:

- **Buildings (Edificios)** contain multiple **Units (Unidades)**
- **Units** have different types and sales priorities
- **Contractors (Brokers)** sell units and earn commissions
- **Commissions** vary based on unit type and sales urgency
- **Administrators** manage the entire system and configure rates

The priority system allows administrators to increase commission rates for units that need urgent sales, incentivizing contractors to focus on specific inventory.

## Current Development Phase

**MVP Core Implementation** focusing on:
1. ✅ Basic authentication with roles
2. 🔄 Building and unit management (CRUD)
3. ⏳ Commission calculation system
4. ⏳ Contract registration for sales
5. ⏳ Basic dashboard for both user types

Always maintain the hexagonal architecture when adding new features and ensure proper separation between business logic and infrastructure concerns.