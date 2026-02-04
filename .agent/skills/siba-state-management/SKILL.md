---
name: siba-state-management
description: Cuándo usar Zustand, TanStack Query o estado local en React
---

# SIBA State Management

Lineamientos para elegir el tipo de estado correcto en cada situación.

## Cuándo Usar

- Decidir **dónde guardar estado**
- Entender **Zustand vs Query vs useState**
- Evitar **over-engineering** del estado
- Sincronizar estado entre componentes

---

## Tipos de Estado

| Tipo             | Herramienta     | Duración    | Ejemplos               |
| ---------------- | --------------- | ----------- | ---------------------- |
| **Server State** | TanStack Query  | Cache       | Datos de API           |
| **Client State** | Zustand         | Persistente | Auth, tema, sidebar    |
| **UI State**     | useState        | Efímero     | Modal abierto, loading |
| **URL State**    | React Router    | Navegación  | Filtros, tabs, page    |
| **Form State**   | React Hook Form | Sesión      | Inputs del form        |

---

## Árbol de Decisión

```
¿Viene de una API?
├─ SÍ → TanStack Query
│
└─ NO → ¿Necesita persistir o compartirse entre páginas?
        ├─ SÍ → Zustand
        │
        └─ NO → ¿Debe reflejarse en la URL?
                ├─ SÍ → URL State (useSearchParams)
                │
                └─ NO → useState local
```

---

## Server State (TanStack Query)

**Cuándo**: Datos que vienen del servidor.

```tsx
// ✅ CORRECTO - Datos de API
const { data: tickets, isLoading } = useQuery({
  queryKey: ['tickets', filters],
  queryFn: () => fetchTickets(filters),
});

const { mutate: createTicket } = useMutation({
  mutationFn: api.createTicket,
  onSuccess: () => queryClient.invalidateQueries(['tickets']),
});

// ❌ EVITAR - Guardar respuesta de API en Zustand
// Zustand no maneja cache, refetch, invalidación
```

**Beneficios**:

- Cache automático
- Refetch en background
- Invalidación declarativa
- Loading/error states

---

## Client State (Zustand)

**Cuándo**: Estado global que no viene del servidor.

```tsx
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

// stores/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      theme: 'light',
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'ui-preferences' }
  )
);
```

**Usar para**:

- Autenticación (user, token)
- Preferencias de UI (theme, sidebar)
- Carrito de compras
- Wizard/stepper multi-paso

---

## UI State (useState)

**Cuándo**: Estado local que no se comparte.

```tsx
// ✅ CORRECTO - Estado local
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);

// En el mismo componente o pasar como props
<Button onClick={() => setIsModalOpen(true)}>Abrir</Button>
<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

// ❌ EVITAR - Estado local en Zustand
// No crear un store para "isModalOpen" de un solo componente
```

**Usar para**:

- Modal abierto/cerrado
- Dropdown expandido
- Hover states
- Loading de un botón específico
- Selección temporal

---

## URL State

**Cuándo**: Estado que debe persistir en la URL (para compartir, bookmark, back button).

```tsx
// ✅ Filtros en URL
const [searchParams, setSearchParams] = useSearchParams();

const filters = {
  page: Number(searchParams.get('page')) || 1,
  estado: searchParams.get('estado') || '',
  search: searchParams.get('search') || '',
};

const updateFilters = (newFilters: Partial<typeof filters>) => {
  setSearchParams({
    ...Object.fromEntries(searchParams),
    ...newFilters,
  });
};

// La URL refleja el estado: /tickets?page=2&estado=NUEVO&search=test

// ❌ EVITAR - Filtros en useState
// Perdés el estado al refrescar o compartir link
```

**Usar para**:

- Paginación (page, limit)
- Filtros de tabla
- Tab activo
- Modal de detalle (?id=123)
- Ordenamiento

---

## Form State (React Hook Form)

**Cuándo**: Manejo de formularios.

```tsx
// ✅ CORRECTO - React Hook Form maneja todo
const {
  register,
  handleSubmit,
  formState: { errors },
  reset,
} = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialData,
});

// RHF maneja: valores, errores, touched, dirty, isSubmitting

// ❌ EVITAR - useState para cada campo
const [nombre, setNombre] = useState('');
const [email, setEmail] = useState('');
// Más código, menos features
```

---

## Patrones Comunes

### Selección + Modal

```tsx
// UI state local - perfecto
const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
const [isDrawerOpen, setIsDrawerOpen] = useState(false);

const handleViewTicket = (ticket: Ticket) => {
  setSelectedTicket(ticket);
  setIsDrawerOpen(true);
};

// O usar URL si querés que sea compartible
navigate(`/tickets?selected=${ticket.id}`);
```

### Filtros + Datos

```tsx
// URL state para filtros
const [searchParams] = useSearchParams();
const filters = parseFilters(searchParams);

// Server state para datos
const { data } = useQuery({
  queryKey: ['tickets', filters], // Filters en key!
  queryFn: () => fetchTickets(filters),
});
```

### Auth + API Calls

```tsx
// Client state para auth
const token = useAuthStore((s) => s.token);

// Server state con token
const { data } = useQuery({
  queryKey: ['profile'],
  queryFn: fetchProfile,
  enabled: !!token, // Solo si hay token
});
```

---

## Anti-Patterns

```tsx
// ❌ Duplicar server state en Zustand
const ticketsStore = create((set) => ({
  tickets: [],
  fetchTickets: async () => {
    const data = await api.getTickets();
    set({ tickets: data });
  },
}));
// Problema: No hay cache, no hay refetch, no hay invalidación

// ❌ Estado global para UI local
const modalStore = create((set) => ({
  isCreateModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  // 20 modales...
}));
// Problema: Over-engineering, useState es suficiente

// ❌ Ignorar URL state
const [page, setPage] = useState(1);
// Problema: Refresh = página 1, no se puede compartir link
```

---

## Resumen Rápido

| Pregunta                    | Respuesta           |
| --------------------------- | ------------------- |
| ¿Datos de API?              | TanStack Query      |
| ¿Auth, tema, preferencias?  | Zustand con persist |
| ¿Modal abierto, loading?    | useState            |
| ¿Filtros, paginación, tabs? | URL (searchParams)  |
| ¿Formulario?                | React Hook Form     |

---

## Checklist

- [ ] Datos de API en TanStack Query
- [ ] Auth y preferencias en Zustand
- [ ] UI efímera en useState
- [ ] Filtros/paginación en URL
- [ ] No duplicar server state en stores
- [ ] No over-engineer con stores para todo
