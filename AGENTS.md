# SIBA - Lineamientos para Agentes IA

## 📋 Proyecto

Sistema de gestión interno (ERP) para empresa de construcción.

## 🔗 Documentación Principal

- **Lineamientos**: `docs/preparacion-proyecto/03-lineamientos-generales.md`
- **Diseño Visual**: `docs/preparacion-proyecto/04-diseno-visual.md`
- **Estándares Código**: `docs/preparacion-proyecto/05-estandares-codigo.md`
- **Roadmap**: `docs/preparacion-proyecto/09-roadmap-fases.md`
- **Plan Implementación**: `docs/preparacion-proyecto/11-plan-implementacion.md`

## 🎨 Skill de Diseño

Usar `.agent/skills/bauman-design-system/SKILL.md` para UI.

## 🏗️ Stack

- **Frontend**: React 19 + Vite + TypeScript + shadcn/ui + Tailwind
- **Backend**: Express 5 + TypeScript + Prisma + Zod
- **DB**: PostgreSQL 16
- **Storage**: MinIO

## ⚠️ Reglas Críticas

1. **Soft delete**: Usar `deleted_at`, nunca DELETE físico
2. **Responsive**: Mobile-first, funciona desde 375px
3. **Dual mode**: Light + Dark obligatorio
4. **Iconos**: Lucide React, nunca emojis
5. **Commits**: Esperar validación del usuario antes de commitear

## 🌿 Branches

- `main` = Producción
- `uat` = Testing (default)
