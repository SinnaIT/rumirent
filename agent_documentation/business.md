# Business Context

## System Overview
Sistema de Gestión de Brokers y Comisiones — manages real estate contractors and commissions based on building projects and unit sales.

## Core Flow
- **Edificios** (buildings) contain **Unidades** (units) grouped by **TipoUnidadEdificio**
- **Brokers** sell units and earn commissions
- **Commissions** are defined per unit type (can differ per building)
- **Admins** configure everything; brokers operate within configured rules

## User Roles
- **ADMIN**: Full CRUD, commission config, analytics, all buildings/units
- **BROKER**: Own clients, register sales, view available units, view personal history

## Commission Logic
1. Each building has a base commission
2. Each unit type (TipoUnidadEdificio) can override with its own rate
3. Final commission = TipoUnidadEdificio rate (not unit priority)
4. Future rate changes via CambioComisionProgramado

## Sales/Contract Flow
1. Broker creates client
2. Broker generates lead/contract linked to client + unit (or manual code)
3. Contract tracks: reservation → contract payment → checkin
4. Status workflow: APROBADO → RESERVA_PAGADA → ENTREGADO / RECHAZADO
5. Commission earned based on unit type rate

## Development Phase (as of 2026-04)
- ✅ Auth with roles
- ✅ Building/unit CRUD
- ✅ Commission system
- ✅ Lead/contract registration
- ✅ Dashboard (admin + broker)
- 🔄 Team leader role
