# Deudas Técnicas - SIBA

Este directorio contiene el inventario consolidado de deudas técnicas del proyecto Sistema Bauman (SIBA).

## 📚 Estructura del Directorio

| Documento                                                            | Descripción                                  | Deudas |
| -------------------------------------------------------------------- | -------------------------------------------- | ------ |
| **[PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md)**               | Plan de acción con checklists por fase       | Todas  |
| **[seguridad-critica.md](./seguridad-critica.md)**                   | Vulnerabilidades bloqueantes para producción | 5 🔴   |
| **[ux-performance.md](./ux-performance.md)**                         | Mejoras de UX/UI y rendimiento               | 25 🟡  |
| **[arquitectura-escalabilidad.md](./arquitectura-escalabilidad.md)** | Refactorings estructurales de largo plazo    | 6 🟢   |
| **[archivo/](./archivo/)**                                           | Auditorías originales (referencia histórica) | -      |

---

## 🚦 Semáforo de Deudas

| Tipo                     | Cantidad | Esfuerzo Estimado | Estado      | Acción                                      |
| ------------------------ | -------- | ----------------- | ----------- | ------------------------------------------- |
| 🔴 **Seguridad Crítica** | 5        | ~2 horas          | **URGENTE** | [Ver plan](./seguridad-critica.md)          |
| 🟡 **UX/Performance**    | 25       | ~40 horas         | IMPORTANTE  | [Ver plan](./ux-performance.md)             |
| 🟢 **Arquitectura**      | 6        | ~80 horas         | PLANIFICADO | [Ver plan](./arquitectura-escalabilidad.md) |
| **TOTAL**                | **36**   | **~122 horas**    | -           | [Roadmap](./PRIORIDADES_ROADMAP.md)         |

---

## 🎯 Cómo Usar Este Directorio

### Para Desarrolladores

1. **Antes de hacer deploy a producción**:

   ```bash
   # Lee este documento primero
   cat docs/deudas/seguridad-critica.md

   # Verifica que las 5 vulnerabilidades críticas estén resueltas
   # Si no, BLOQUEA el deploy
   ```

2. **Al planificar un sprint**:

   ```bash
   # Consulta el roadmap priorizado
   cat docs/deudas/PRIORIDADES_ROADMAP.md

   # Selecciona tareas de la fase actual
   # Marca checkboxes conforme completes
   ```

3. **Al implementar una feature**:

   ```bash
   # Busca si hay deudas relacionadas
   grep -r "ComponentName" docs/deudas/*.md

   # Si encuentras una deuda, considérala durante la implementación
   ```

4. **Post-sprint**:
   ```bash
   # Marca deudas resueltas en los documentos
   # Actualiza checkboxes en PRIORIDADES_ROADMAP.md
   ```

### Para Product Owners

1. **Revisión semanal**:
   - Consultar [PROJECT_MASTER.md](../PROJECT_MASTER.md) → Semáforo de Salud
   - Verificar progreso de Fase actual en [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md)

2. **Priorización**:
   - **Fase 1** (🔴 Seguridad): Bloqueante para producción
   - **Fase 2** (🟡 UX): Competitividad en mercado
   - **Fase 3** (🟢 Arquitectura): Escalabilidad futura

### Para Tech Leads

1. **Sprint Planning**:
   - Incluir al menos 1 deuda crítica por sprint
   - Balancear features nuevas con deuda técnica (regla 70/30)

2. **Code Review**:
   - Verificar que no se introduzcan nuevas deudas
   - Validar que fixes de seguridad incluyan tests

3. **Auditoría**:
   - Actualizar este directorio al completar nuevas auditorías
   - Agregar nuevas deudas a los documentos spoke correspondientes

---

## 📊 Distribución de Deudas por Área

### Frontend (18 deudas)

- 10 Mobile-First (responsive, FAB, bottom nav, etc.)
- 7 Accesibilidad (ARIA attributes, WCAG compliance)
- 1 Performance (lazy loading de routes)

### Backend (12 deudas)

- 5 Seguridad (JWT, rate limiting, upload validation)
- 6 Arquitectura (controllers monolíticos, error handler)
- 1 Performance (Prisma select vs include)

### Infraestructura (6 deudas)

- Testing no configurado (Vitest, Playwright)
- Monitoring ausente (Sentry, OpenTelemetry)
- CI/CD parcial

---

## 🔍 Deudas por Archivo Crítico

| Archivo                                                                         | Deudas | Severidad | Ver en                                                                    |
| ------------------------------------------------------------------------------- | ------ | --------- | ------------------------------------------------------------------------- |
| [auth.middleware.ts](../../apps/api/src/middlewares/auth.middleware.ts)         | 2      | 🔴🔴      | [seguridad-critica.md](./seguridad-critica.md#sec-001)                    |
| [finanzas.controller.ts](../../apps/api/src/controllers/finanzas.controller.ts) | 1      | 🟢        | [arquitectura-escalabilidad.md](./arquitectura-escalabilidad.md#arch-001) |
| [Input.tsx](../../apps/web/src/components/ui/core/Input.tsx)                    | 2      | 🟡        | [ux-performance.md](./ux-performance.md#a11y-001)                         |
| [TicketsPage.tsx](../../apps/web/src/pages/dashboard/tickets/TicketsPage.tsx)   | 3      | 🟡        | [ux-performance.md](./ux-performance.md#mf-002)                           |

---

## 📝 Convenciones de IDs de Deudas

Cada deuda tiene un ID único que sigue este formato:

- `SEC-001` a `SEC-005`: Seguridad crítica
- `UX-001` a `UX-015`: UX/UI
- `MF-001` a `MF-010`: Mobile-First
- `A11Y-001` a `A11Y-007`: Accesibilidad
- `PERF-001` a `PERF-008`: Performance
- `ARCH-001` a `ARCH-006`: Arquitectura

**Ejemplo de referencia**:

```markdown
Resolvimos SEC-001 en el commit abc123
Bloqueado por ARCH-001 (controller muy grande)
```

---

## 🔄 Proceso de Actualización

### Cuando se resuelve una deuda:

1. Marcar checkbox en [PRIORIDADES_ROADMAP.md](./PRIORIDADES_ROADMAP.md)
2. Actualizar estado en documento spoke correspondiente
3. Actualizar semáforo en este README
4. Actualizar [PROJECT_MASTER.md](../PROJECT_MASTER.md)
5. Commit con mensaje descriptivo:

   ```bash
   git commit -m "fix(security): resolve SEC-001 JWT_SECRET validation

   - Add startup validation for JWT_SECRET
   - Ensure minimum 32 characters
   - Throw error if not configured

   Closes SEC-001"
   ```

### Cuando se detecta una nueva deuda:

1. Determinar categoría (Seguridad / UX / Arquitectura)
2. Agregar a documento spoke correspondiente con ID único
3. Actualizar semáforo en este README
4. Agregar al roadmap en fase correspondiente
5. Notificar a Tech Lead en próximo standup

---

## 📚 Auditorías Originales (Archivo Histórico)

Las auditorías completas y detalladas se encuentran en [archivo/](./archivo/):

| Auditoría                                                                          | Fecha      | Tamaño  | Enfoque                                |
| ---------------------------------------------------------------------------------- | ---------- | ------- | -------------------------------------- |
| [auditoria_mobile_first.md](./archivo/auditoria_mobile_first.md)                   | 2026-02-04 | 11.9 KB | Responsive design, ergonomía táctil    |
| [auditoria_skills_alignment.md](./archivo/auditoria_skills_alignment.md)           | 2026-02-04 | 19.9 KB | Alineación código vs skills, seguridad |
| [auditoria_ux_innovation.md](./archivo/auditoria_ux_innovation.md)                 | 2026-02-04 | 12.1 KB | UX/DX, performance, innovación         |
| [auditoria_ux_product.md](./archivo/auditoria_ux_product.md)                       | 2026-02-04 | 13.1 KB | Consistencia visual, feedback          |
| [estrategia_mejora_escalabilidad.md](./archivo/estrategia_mejora_escalabilidad.md) | 2026-02-04 | 14.2 KB | Arquitectura, escalabilidad 10x        |

**Nota**: Estos documentos contienen el análisis completo con contexto, ejemplos extensos y referencias. Los documentos spoke son versiones consolidadas y accionables.

---

## 🎯 Quick Wins Disponibles

Deudas que se pueden resolver en < 1 hora cada una:

| ID       | Tarea                           | Tiempo | Impacto | Archivo                                                |
| -------- | ------------------------------- | ------ | ------- | ------------------------------------------------------ |
| UX-010   | Crear Skeleton component        | 20 min | Alto    | [ux-performance.md](./ux-performance.md#quick-wins)    |
| UX-011   | Crear ConfirmDialog component   | 30 min | Medio   | [ux-performance.md](./ux-performance.md#quick-wins)    |
| MF-001   | Padding responsivo en TopHeader | 10 min | Medio   | [ux-performance.md](./ux-performance.md#mf-001)        |
| A11Y-001 | Agregar aria-invalid en Input   | 20 min | Alto    | [ux-performance.md](./ux-performance.md#a11y-001)      |
| SEC-004  | Aumentar bcrypt rounds a 12     | 5 min  | Medio   | [seguridad-critica.md](./seguridad-critica.md#sec-004) |

**Total de Quick Wins**: 5 tareas = 85 minutos de trabajo con alto impacto

---

## 📞 Contacto y Soporte

Para dudas sobre este directorio o las deudas técnicas:

- **Tech Lead**: Revisar [PROJECT_MASTER.md](../PROJECT_MASTER.md) primero
- **Nuevas Deudas**: Crear issue en el repositorio con label `technical-debt`
- **Priorización**: Discutir en sprint planning semanal

---

**Última actualización**: 2026-02-04
**Próxima revisión**: 2026-02-11 (semanal)
