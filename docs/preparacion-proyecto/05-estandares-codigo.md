# Sistema Bauman - Estándares y Calidad de Código

> **Fecha**: 2026-01-17  
> **Versión**: 1.0

---

## 🎯 Objetivo

Garantizar código consistente, seguro y mantenible mediante herramientas automáticas que validan **antes de cada commit**.

---

## 🛠️ Stack de Herramientas

| Herramienta | Propósito |
|-------------|-----------|
| **ESLint** | Detectar errores y malas prácticas |
| **Prettier** | Formateo automático de código |
| **TypeScript strict** | Tipado estricto |
| **Husky** | Ejecutar validaciones pre-commit |
| **lint-staged** | Validar solo archivos modificados |

---

## 📦 Instalación

### 1. ESLint + TypeScript

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks
```

### 2. Prettier

```bash
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
```

### 3. Husky + lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

---

## ⚙️ Configuración

### eslint.config.js (ESLint 9+ Flat Config)

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      
      // React
      'react/react-in-jsx-scope': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // General
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  }
);
```

### .prettierrc

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### .prettierignore

```
node_modules
dist
build
.next
coverage
```

### tsconfig.json (Strict Mode)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### package.json (Scripts + lint-staged)

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "type-check": "tsc --noEmit"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,css}": [
      "prettier --write"
    ]
  }
}
```

### .husky/pre-commit

```bash
#!/bin/sh
npx lint-staged
```

---

## 🔄 Flujo Pre-Commit

```
git commit -m "feat: nuevo componente"
        │
        ▼
┌───────────────────────────────┐
│     HUSKY PRE-COMMIT          │
├───────────────────────────────┤
│  lint-staged ejecuta:         │
│  ├─ ESLint --fix              │
│  └─ Prettier --write          │
└───────────────────────────────┘
        │
   ┌────┴────┐
   │         │
   ▼         ▼
✅ OK     ❌ Error
Commit    Commit rechazado
          (fix errores primero)
```

---

## 📋 Reglas Clave

### Obligatorias (Error)

| Regla | Descripción |
|-------|-------------|
| `no-explicit-any` | Prohibido usar `any` |
| `no-unused-vars` | Prohibido variables sin usar |
| `react-hooks/rules-of-hooks` | Hooks solo en componentes |
| `prefer-const` | Usar `const` si no se reasigna |

### Advertencias (Warn)

| Regla | Descripción |
|-------|-------------|
| `no-console` | Evitar console.log en producción |
| `explicit-function-return-type` | Tipar retornos de funciones |

---

## 🚀 Setup Rápido (Copy-Paste)

Ejecutar en el root del proyecto:

```bash
# Instalar dependencias
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks prettier eslint-config-prettier eslint-plugin-prettier husky lint-staged

# Inicializar Husky
npx husky init

# Crear hook pre-commit
echo "npx lint-staged" > .husky/pre-commit
```

---

## ✅ Checklist de Setup

- [ ] ESLint instalado y configurado
- [ ] Prettier instalado y configurado
- [ ] TypeScript en modo strict
- [ ] Husky inicializado
- [ ] lint-staged configurado en package.json
- [ ] Pre-commit hook creado
- [ ] Primer commit de prueba exitoso
