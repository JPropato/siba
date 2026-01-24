# Sistema Bauman - Convenciones de Git

> **Versión**: 1.0

---

## 🌿 Estructura de Branches

```
main (producción)
  │
  └── uat (testing/pre-prod) ← rama por defecto para desarrollo
        │
        ├── feature/nombre-feature
        ├── fix/nombre-fix
        └── hotfix/nombre-hotfix
```

### Branches Principales

| Branch | Propósito | Protegida |
|--------|-----------|-----------|
| `main` | Producción | ✅ Sí |
| `uat` | Testing/Pre-prod, rama por defecto | ✅ Sí |

| Prefijo | Uso | Ejemplo |
|---------|-----|---------|
| `feature/` | Nueva funcionalidad | `feature/modulo-clientes` |
| `fix/` | Corrección de bugs | `fix/login-redirect` |
| `hotfix/` | Fix urgente en producción | `hotfix/security-patch` |
| `refactor/` | Mejoras de código | `refactor/api-structure` |
| `docs/` | Solo documentación | `docs/readme-update` |

---

## 📝 Formato de Commits

### Conventional Commits

```
<tipo>(<scope>): <descripción>

[cuerpo opcional]
```

### Tipos Permitidos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formateo (sin cambio de lógica) |
| `refactor` | Refactor (sin feat ni fix) |
| `test` | Agregar/modificar tests |
| `chore` | Tareas de mantenimiento |

### Scopes (módulos)

| Scope | Módulo |
|-------|--------|
| `auth` | Autenticación/Seguridad |
| `clientes` | Módulo Clientes |
| `tickets` | Módulo Tickets |
| `obras` | Módulo Obras |
| `finanzas` | Módulo Finanzas |
| `api` | Backend general |
| `ui` | Frontend general |
| `db` | Base de datos |
| `infra` | Infraestructura/DevOps |

### Ejemplos

```bash
# Feature
feat(clientes): agregar listado con paginación

# Fix
fix(auth): corregir redirect después de login

# Refactor
refactor(api): extraer validación a middleware

# Docs
docs(readme): agregar instrucciones de setup
```

---

## 🔄 Flujo de Trabajo

### 1. Crear Branch

```bash
# Desde develop
git checkout develop
git pull origin develop
git checkout -b feature/mi-feature
```

### 2. Commits Pequeños y Frecuentes

```bash
git add .
git commit -m "feat(modulo): descripción clara"
```

### 3. Sincronizar con Develop

```bash
git fetch origin
git rebase origin/develop
```

### 4. Push y PR

```bash
git push origin feature/mi-feature
# Crear PR en GitHub
```

### 5. Merge a Develop

```bash
# Después de aprobar PR
git checkout develop
git merge --no-ff feature/mi-feature
git push origin develop
```

---

## 🚀 Deploy a Producción

```bash
# Desde develop actualizado
git checkout main
git merge --no-ff develop
git tag v1.0.0
git push origin main --tags
```

---

## 📋 Pull Request Template

```markdown
## Descripción
Breve descripción del cambio.

## Tipo de cambio
- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs

## Checklist
- [ ] Código formateado (Prettier)
- [ ] Linting sin errores
- [ ] Tests pasan
- [ ] Documentación actualizada
```

---

## ⚠️ Reglas

1. **Nunca pushear directo a `main`**
2. **Commits en español** (descripción clara)
3. **Branch names en inglés** (kebab-case)
4. **Rebase antes de PR** (mantener historial limpio)
5. **Squash si hay muchos commits pequeños**
