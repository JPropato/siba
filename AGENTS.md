# SIBA

Sistema de tickets. React + Express + Prisma + PostgreSQL.

## Stack

- **Frontend**: React, Vite, Tailwind, shadcn/ui, Zustand, TanStack Query, RHF+Zod
- **Backend**: Express, Prisma, JWT, MinIO

## Comandos

```bash
npm run dev        # Dev
npm run build      # Build
npm run db:migrate # Migración
```

## Reglas

1. **TypeScript strict** - no `any`
2. **Zod** para validar inputs
3. **Soft delete** - usar `fechaEliminacion`, nunca DELETE
4. **Mobile-first** - diseñar para mobile primero

## Skills

Consultar `.agents/skills/siba-*/SKILL.md` antes de implementar:

| Área | Skills                                                                         |
| ---- | ------------------------------------------------------------------------------ |
| UI   | `components`, `forms`, `tables`, `responsive`, `a11y`, `notifications`         |
| API  | `api-patterns`, `prisma`, `auth`, `error-handling`, `security`                 |
| Data | `caching`, `state-management`, `file-upload`, `pdf-export`                     |
| Ops  | `testing`, `deployment`, `git-workflow`, `logging`, `routing`, `optimizations` |
