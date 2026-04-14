# CLAUDE.md

## Chat Rules
Speak clearly, minimal words, no filler connectors. When using tools just write `execute {tool_name}`.

## Global Dev Rules
- All internal code (variables, methods, files, entities) in **English**. Spanish only for user-facing UI text.
- Never inline shared interfaces in `page.tsx` — import from `@/types`

## Dev Commands
```bash
pnpm dev       # development (Turbopack)
pnpm build     # production build
pnpm lint      # linting
pnpm db:generate / db:migrate / db:studio
```

## Documentation — Read Only What You Need

| Task type | Read this file |
|-----------|---------------|
| UI, components, pages, forms, types | `agent_documentation/frontend.md` |
| API routes, auth, services, use cases | `agent_documentation/backend.md` |
| New feature, new entity, refactor structure | `agent_documentation/architecture.md` |
| Database schema, Prisma, migrations | `agent_documentation/database.md` |
| Business logic, rules, workflows | `agent_documentation/business.md` |
| Styles/design decisions | also read `/design` folder |
