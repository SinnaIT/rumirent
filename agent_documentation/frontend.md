# Frontend Documentation

## Tech Stack
- Next.js 15 App Router, TypeScript, Tailwind CSS v4, shadcn/ui, Radix UI
- Forms: React Hook Form + Zod
- Icons: Lucide React

## UI Component Rules
- Use shadcn/ui components — consistent design system
- Use `cn()` utility for conditional Tailwind classes
- Always use Zod schemas with React Hook Form for validation
- Implement loading and error states
- Ensure ARIA labels and keyboard navigation

## Style Rules
- Before any style/design decision, read the `/design` folder structure

## TypeScript Types Structure
Centralized in `src/types/` — one file per entity (~8-40 lines each):

```
src/types/
├── index.ts           # Barrel re-export — always import from '@/types'
├── shared.ts          # TaxType, UserRole
├── enums.ts           # EstadoLead, EstadoUnidad, ESTADOS_LEAD, ESTADOS_LEAD_ACTIVE
├── broker.ts          # BrokerRef, BrokerBasic
├── cliente.ts         # ClienteBasic, ActiveLeadInfo, ClienteWithActiveLead, ClienteWithDates, ClienteWithBroker
├── edificio.ts        # EdificioRef
├── comision.ts        # ComisionRef, ComisionBase, Comision
├── regla-comision.ts  # ReglaComision, CommissionRule, CommissionInfo, MultiCommissionResponse
├── tipo-unidad.ts     # TipoUnidadRef, TipoUnidadBasic, TipoUnidadWithComision
├── unidad.ts          # UnidadRef, UnidadBasic, UnidadOption, UnidadWithEdificio
├── imagen.ts          # Imagen
├── caracteristica.ts  # Caracteristica
├── lead.ts            # LeadFull
├── reports.ts         # ComisionMensual, ResumenAnual, CashFlowDay, CashFlowResponse
└── admin.ts           # Broker (admin full shape with stats)
```

**Rules:**
- Import: `import type { BrokerBasic } from '@/types'`
- Extend with intersection for page-specific needs: `type Broker = BrokerBasic & { totalLeads: number }`
- NEVER define shared interfaces inline in `page.tsx` — always import from `@/types`
- Create `interfaces.ts` in page folder **only** for page-exclusive types (form data, local state, page aggregates)
- When a type is used in 2+ pages, add it to `src/types/`

## Directory Structure (Frontend)
```
src/
├── app/
│   ├── (auth)/login, register
│   ├── admin/         # edificios, unidades, brokers, comisiones, reportes
│   ├── broker/        # unidades, ventas, historial
│   └── api/
├── components/
│   ├── ui/            # shadcn/ui
│   ├── layout/
│   ├── forms/
│   ├── tables/
│   └── common/
└── lib/hooks/
```
