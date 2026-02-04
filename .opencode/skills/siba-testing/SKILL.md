---
name: siba-testing
description: Estrategia y patrones de testing para el proyecto SIBA
---

# SIBA Testing

Lineamientos para implementar tests en frontend y backend.

## Cuándo Usar

- Escribas **tests unitarios** para funciones/hooks
- Implementes **tests de integración** para API
- Necesites **tests E2E** para flujos críticos
- Configures **CI/CD** con tests

---

## Stack de Testing

| Área                | Herramienta                    | Propósito            |
| ------------------- | ------------------------------ | -------------------- |
| Backend Unit        | Vitest                         | Funciones, servicios |
| Backend Integration | Supertest                      | Endpoints API        |
| Frontend Unit       | Vitest + React Testing Library | Componentes, hooks   |
| E2E                 | Playwright                     | Flujos completos     |

---

## Backend: Test de Controller

```typescript
// controllers/__tests__/ticket.controller.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';

describe('Ticket Controller', () => {
  let authToken: string;
  let testTicketId: number;

  beforeAll(async () => {
    // Login para obtener token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'test123' });
    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Limpiar datos de test
    if (testTicketId) {
      await prisma.ticket.delete({ where: { id: testTicketId } });
    }
  });

  describe('GET /api/tickets', () => {
    it('debe retornar lista paginada', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toHaveProperty('totalPages');
    });

    it('debe filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ estado: 'NUEVO' });

      expect(res.status).toBe(200);
      res.body.data.forEach((ticket: any) => {
        expect(ticket.estado).toBe('NUEVO');
      });
    });
  });

  describe('POST /api/tickets', () => {
    it('debe crear un ticket válido', async () => {
      const ticketData = {
        descripcion: 'Test ticket',
        rubro: 'ELECTRICIDAD',
        sucursalId: 1,
      };

      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(ticketData);

      expect(res.status).toBe(201);
      expect(res.body.descripcion).toBe(ticketData.descripcion);
      testTicketId = res.body.id;
    });

    it('debe rechazar sin descripción', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ rubro: 'ELECTRICIDAD', sucursalId: 1 });

      expect(res.status).toBe(400);
    });
  });
});
```

---

## Frontend: Test de Componente

```tsx
// components/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/core/Button';

describe('Button', () => {
  it('renderiza con texto', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('ejecuta onClick', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('muestra loading spinner', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('aplica variantes correctamente', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-red-500');
  });
});
```

---

## Frontend: Test de Hook

```tsx
// hooks/__tests__/useTableState.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableState } from '../useTableState';

describe('useTableState', () => {
  it('inicializa con valores por defecto', () => {
    const { result } = renderHook(() => useTableState());

    expect(result.current.page).toBe(1);
    expect(result.current.limit).toBe(10);
    expect(result.current.search).toBe('');
  });

  it('cambia página correctamente', () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.setPage(3);
    });

    expect(result.current.page).toBe(3);
  });

  it('resetea página al buscar', () => {
    const { result } = renderHook(() => useTableState());

    act(() => {
      result.current.setPage(5);
      result.current.setSearch('test');
    });

    expect(result.current.page).toBe(1);
    expect(result.current.search).toBe('test');
  });
});
```

---

## E2E: Flujo de Login

```typescript
// e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('login exitoso', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@siba.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Bienvenido')).toBeVisible();
  });

  test('login fallido muestra error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@email.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Credenciales inválidas')).toBeVisible();
  });
});
```

---

## Configuración Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
});
```

---

## Scripts de Package.json

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:ci": "vitest run && playwright test"
  }
}
```

---

## Qué Testear por Prioridad

| Prioridad | Qué                  | Por qué              |
| --------- | -------------------- | -------------------- |
| 1         | Funciones de negocio | Lógica crítica       |
| 2         | Endpoints API        | Contratos de datos   |
| 3         | Hooks custom         | Lógica reutilizable  |
| 4         | Componentes UI       | Interacciones        |
| 5         | Flujos E2E           | Integración completa |

---

## Checklist

- [ ] Vitest configurado en frontend y backend
- [ ] Tests para funciones de validación
- [ ] Tests de integración para CRUD endpoints
- [ ] Tests de componentes con mocks de API
- [ ] E2E para flujos críticos (login, crear ticket)
- [ ] Coverage mínimo 70%
- [ ] Tests en CI antes de merge
