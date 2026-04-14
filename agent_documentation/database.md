# Database Documentation

## Tech
- PostgreSQL + Prisma ORM

## Commands
```bash
pnpm db:generate   # npx prisma generate
pnpm db:migrate    # npx prisma migrate dev
pnpm db:studio     # npx prisma studio
```

## Domain Entities
- **User**: roles ADMIN/BROKER, includes RUT
- **Edificio**: real estate project, base commission, multiple unit types
- **TipoUnidadEdificio**: unit type per building, own commission override
- **Unidad**: individual unit, references TipoUnidadEdificio
- **Cliente**: client owned by broker (RUT + contact)
- **Venta/Lead**: sales contract, flexible pricing/dates, optional unit ref
- **Comision**: commission configuration (percentage)
- **CambioComisionProgramado**: scheduled commission changes

## Key Enums
```typescript
enum Role { ADMIN, BROKER }
enum EstadoEdificio { PLANIFICACION, CONSTRUCCION, COMPLETADO }
enum EstadoUnidad { DISPONIBLE, RESERVADA, VENDIDA }
enum Estado { ENTREGADO, RESERVA_PAGADA, APROBADO, RECHAZADO }
```

## Schema Key Decisions
- **Eliminated**: `asignaciones_comision` (redundant), `PrioridadVenta` enum, `TipoUnidad` enum
- **Added**: `Cliente` entity with broker ownership
- **Enhanced**: contracts with flexible pricing + multiple dates

## Prisma Model Snapshots (simplified)
```prisma
model User { id, email, password, role, nombre }
model Edificio { id, nombre, direccion, estado, comisionId, tiposUnidad[], unidades[] }
model TipoUnidadEdificio { id, edificioId, nombre, comisionId }
model Unidad { id, edificioId, tipoUnidadId, precio, estado }
model Cliente { id, brokerId, nombre, rut, email, telefono }
```
