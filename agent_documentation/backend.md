# Backend Documentation

## Tech Stack
- Next.js 15 API Routes, TypeScript, Prisma ORM, PostgreSQL
- Auth: JWT (httpOnly cookies) + bcryptjs
- Roles: ADMIN, BROKER

## Authentication & Authorization
- JWT stored in httpOnly cookies
- Middleware validates role on every request
- Both API routes and pages are protected

## API Route Structure
```
/api/
├── auth/login, register, me
├── admin/
│   ├── edificios/[id]/tipos-unidad
│   ├── unidades/[id]
│   ├── clientes/[id]
│   ├── comisiones/[id], programados
│   └── brokers/[id]
├── broker/
│   ├── clientes/[id], search
│   ├── leads/[id]
│   ├── proyectos
│   ├── ventas
│   ├── dashboard, dashboard/rumi-race
│   └── reportes/cash-flow, comisiones-mensuales, resumen-anual
└── shared/edificios/[id]/tipos-unidad, comisiones/calculate
```

## Use Cases (Application Layer)

### Admin
- Gestionar Edificios, Tipos de Unidad, Unidades, Comisiones, Brokers, Clientes
- Ver Analytics (dashboard metrics, commission reports, building performance)

### Broker
- Gestionar Clientes (own), Ver Unidades Disponibles, Registrar/Gestionar Ventas
- Ver Historial, Calcular Comisiones

## Environment Variables
```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="secure-jwt-secret"
JWT_EXPIRES_IN="7d"
```

## Commission Business Rules
- Edificio has a base commission rate (`comisionId`)
- TipoUnidadEdificio can override with its own commission (`comisionId`)
- Final commission always comes from TipoUnidadEdificio
- `CambioComisionProgramado` schedules future commission updates

## Contract Business Rules
- Contracts reference existing units OR use manual `codigoUnidad`
- Tracks: reservation payment, contract payment, checkin dates
- Dual pricing: peso `total` + UF `montoUf`
- Client ownership: client belongs to the broker who created them
