---
name: siba-git-workflow
description: Convenciones de Git, branches, commits y PRs para el proyecto SIBA
---

# SIBA Git Workflow

Lineamientos para trabajar con Git de forma organizada.

## Cuándo Usar

- Crear **branches** para nuevas features
- Escribir **mensajes de commit** descriptivos
- Hacer **merge** de cambios
- Revisar **Pull Requests**

---

## Estructura de Branches

```
main                    ← Producción
├── develop             ← Desarrollo (staging)
│   ├── feature/XXX     ← Nuevas funcionalidades
│   ├── fix/XXX         ← Corrección de bugs
│   ├── hotfix/XXX      ← Fixes urgentes a prod
│   └── refactor/XXX    ← Mejoras de código
```

### Naming de Branches

| Tipo     | Patrón                         | Ejemplo                                   |
| -------- | ------------------------------ | ----------------------------------------- |
| Feature  | `feature/[ticket]-descripcion` | `feature/TK-123-crear-formulario-cliente` |
| Bug fix  | `fix/[ticket]-descripcion`     | `fix/TK-456-error-paginacion`             |
| Hotfix   | `hotfix/[descripcion]`         | `hotfix/login-crash`                      |
| Refactor | `refactor/[area]`              | `refactor/api-responses`                  |

---

## Commits Convencionales

### Formato

```
<tipo>(<alcance>): <descripción corta>

[cuerpo opcional]

[footer opcional]
```

### Tipos

| Tipo       | Uso                                        |
| ---------- | ------------------------------------------ |
| `feat`     | Nueva funcionalidad                        |
| `fix`      | Corrección de bug                          |
| `refactor` | Mejora de código sin cambiar funcionalidad |
| `style`    | Cambios de formato, espacios, etc.         |
| `docs`     | Documentación                              |
| `test`     | Tests                                      |
| `chore`    | Tareas de mantenimiento                    |

### Ejemplos

```bash
# Feature
feat(tickets): agregar filtro por estado

# Fix
fix(auth): corregir expiración de token JWT

# Refactor
refactor(api): extraer validación a middleware

# Con cuerpo
feat(clientes): implementar búsqueda avanzada

- Agregar filtros por CUIT y razón social
- Incluir ordenamiento por fecha
- Paginación con límite configurable

Closes #123
```

---

## Flujo de Trabajo

### 1. Iniciar Feature

```bash
# Actualizar develop
git checkout develop
git pull origin develop

# Crear branch
git checkout -b feature/TK-123-nueva-funcionalidad
```

### 2. Commits Durante Desarrollo

```bash
# Commits atómicos y frecuentes
git add .
git commit -m "feat(tickets): agregar schema de validación"

git add .
git commit -m "feat(tickets): implementar endpoint create"

git add .
git commit -m "test(tickets): agregar tests de creación"
```

### 3. Mantener Actualizado

```bash
# Cada día o antes de PR
git fetch origin
git rebase origin/develop

# Si hay conflictos
# 1. Resolver conflictos manualmente
# 2. git add .
# 3. git rebase --continue
```

### 4. Push y PR

```bash
git push origin feature/TK-123-nueva-funcionalidad

# Crear PR en GitHub/GitLab con:
# - Título: feat(tickets): crear ticket desde formulario
# - Descripción: qué hace, cómo probarlo
# - Reviewers asignados
```

### 5. Merge

```bash
# Después de aprobación, desde GitHub/GitLab:
# - Squash and merge (preferido)
# - Delete branch

# Localmente
git checkout develop
git pull origin develop
git branch -d feature/TK-123-nueva-funcionalidad
```

---

## Pull Request Template

```markdown
## Descripción

Breve descripción de los cambios realizados.

## Tipo de cambio

- [ ] Nueva funcionalidad
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentación

## Cambios

- Agregar X
- Modificar Y
- Eliminar Z

## Cómo probar

1. Paso 1
2. Paso 2
3. Resultado esperado

## Screenshots (si aplica)

[Imágenes de UI]

## Checklist

- [ ] El código compila sin errores
- [ ] Se agregaron tests
- [ ] La documentación está actualizada
```

---

## Reglas de Merge

| Branch      | Puede mergear a    | Requiere                |
| ----------- | ------------------ | ----------------------- |
| `feature/*` | `develop`          | 1 approval + tests pass |
| `fix/*`     | `develop`          | 1 approval              |
| `develop`   | `main`             | 2 approvals + QA        |
| `hotfix/*`  | `main` + `develop` | 1 approval              |

---

## Comandos Útiles

```bash
# Ver historial limpio
git log --oneline -20

# Ver cambios pendientes
git status

# Descartar cambios locales
git checkout -- .

# Guardar cambios temporalmente
git stash
git stash pop

# Revertir último commit (mantiene cambios)
git reset --soft HEAD~1

# Enmendar último commit
git commit --amend -m "nuevo mensaje"

# Ver diferencias
git diff
git diff --staged
```

---

## .gitignore

```gitignore
# Dependencias
node_modules/
.pnpm-store/

# Build
dist/
build/

# Ambiente
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Test
coverage/

# Prisma
prisma/migrations/*.sql.bak
```

---

## Checklist

- [ ] Branch creado desde develop actualizado
- [ ] Commits con formato convencional
- [ ] Rebase antes de PR
- [ ] PR con descripción y pasos para probar
- [ ] Tests pasan
- [ ] Al menos 1 approval
- [ ] Branch eliminado después de merge
