import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useThemeEffect } from './hooks/useThemeColor';
import { Component, lazy, Suspense, type ReactNode, type ErrorInfo } from 'react';
import { Skeleton } from './components/ui/Skeleton';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import './App.css';

// Lazy loading de páginas para reducir bundle inicial (~2MB → ~500KB)
// LoginPage y DashboardLayout no se lazy-load porque se necesitan inmediatamente
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const RolesPage = lazy(() => import('./pages/RolesPage'));
const ClientsPage = lazy(() => import('./pages/ClientsPage'));
const ZonasPage = lazy(() => import('./pages/ZonasPage'));
const SedesPage = lazy(() => import('./pages/SedesPage'));
const VehiculosPage = lazy(() => import('./pages/VehiculosPage'));
const MaterialesPage = lazy(() => import('./pages/MaterialesPage'));
const EmpleadosPage = lazy(() => import('./pages/EmpleadosPage'));
const VacacionesPage = lazy(() => import('./pages/VacacionesPage'));
const SueldosPage = lazy(() => import('./pages/SueldosPage'));
const AusenciasPage = lazy(() => import('./pages/AusenciasPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const TicketDetailPage = lazy(() => import('./pages/TicketDetailPage'));
const ObrasPage = lazy(() => import('./features/obras').then((m) => ({ default: m.ObrasPage })));
const FinanzasDashboard = lazy(() =>
  import('./features/finanzas').then((m) => ({ default: m.FinanzasDashboard }))
);
const MovimientosPage = lazy(() =>
  import('./features/finanzas').then((m) => ({ default: m.MovimientosPage }))
);
const CuentasPage = lazy(() =>
  import('./features/finanzas').then((m) => ({ default: m.CuentasPage }))
);
const InversionesPage = lazy(() =>
  import('./features/finanzas').then((m) => ({ default: m.InversionesPage }))
);

// --- Page Loading Fallback ---
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-6xl p-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Error Boundary ---
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 min-h-screen">
          <h1 className="text-3xl font-bold mb-4">💥 Something went wrong.</h1>
          <pre className="bg-red-100 p-4 rounded text-sm overflow-auto border border-red-200">
            {this.state.error?.toString()}
          </pre>
          <button
            className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return (
      <div className="contents">
        <Toaster position="top-right" richColors closeButton />
        {this.props.children}
      </div>
    );
  }
}

function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (id: string) => {
    if (id === 'dashboard') navigate('/dashboard');
    if (id === 'usuarios') navigate('/dashboard/users');
    if (id === 'roles') navigate('/dashboard/roles');
    if (id === 'clientes') navigate('/dashboard/clients');
    if (id === 'zonas') navigate('/dashboard/zones');
    if (id === 'sedes') navigate('/dashboard/sedes');
    if (id === 'vehiculos') navigate('/dashboard/vehicles');
    if (id === 'materiales') navigate('/dashboard/materials');
    if (id === 'empleados') navigate('/dashboard/empleados');
    if (id === 'vacaciones') navigate('/dashboard/vacaciones');
    if (id === 'sueldos') navigate('/dashboard/sueldos');
    if (id === 'ausencias') navigate('/dashboard/ausencias');
    if (id === 'tickets') navigate('/dashboard/tickets');
    if (id === 'obras') navigate('/dashboard/obras');
    if (id === 'finanzas-dashboard') navigate('/dashboard/finanzas');
    if (id === 'finanzas-movimientos') navigate('/dashboard/finanzas/movimientos');
    if (id === 'finanzas-cuentas') navigate('/dashboard/finanzas/cuentas');
    if (id === 'finanzas-inversiones') navigate('/dashboard/finanzas/inversiones');
  };

  const getPageInfo = (path: string) => {
    if (path.includes('users')) return { id: 'usuarios', label: 'Usuarios' };
    if (path.includes('roles')) return { id: 'roles', label: 'Roles' };
    if (path.includes('clients'))
      return { id: 'clientes', label: 'Clientes', parentLabel: 'Administración' };
    if (path.includes('zones'))
      return { id: 'zonas', label: 'Zonas', parentLabel: 'Administración' };
    if (path.includes('sedes'))
      return { id: 'sedes', label: 'Sedes', parentLabel: 'Administración' };
    if (path.includes('vehicles'))
      return { id: 'vehiculos', label: 'Vehículos', parentLabel: 'Administración' };
    if (path.includes('materials'))
      return { id: 'materiales', label: 'Materiales', parentLabel: 'Catálogo' };
    if (path.includes('empleados'))
      return { id: 'empleados', label: 'Empleados', parentLabel: 'Recursos Humanos' };
    if (path.includes('vacaciones'))
      return { id: 'vacaciones', label: 'Vacaciones', parentLabel: 'Recursos Humanos' };
    if (path.includes('sueldos'))
      return { id: 'sueldos', label: 'Sueldos', parentLabel: 'Recursos Humanos' };
    if (path.includes('ausencias'))
      return { id: 'ausencias', label: 'Ausencias', parentLabel: 'Recursos Humanos' };
    if (path.match(/\/tickets\/\d+/))
      return { id: 'tickets', label: 'Detalle Ticket', parentLabel: 'Comercial' };
    if (path.includes('tickets'))
      return { id: 'tickets', label: 'Tickets', parentLabel: 'Comercial' };
    if (path.includes('obras')) return { id: 'obras', label: 'Obras', parentLabel: 'Comercial' };
    if (path.includes('finanzas/movimientos'))
      return { id: 'finanzas-movimientos', label: 'Movimientos', parentLabel: 'Finanzas' };
    if (path.includes('finanzas/cuentas'))
      return { id: 'finanzas-cuentas', label: 'Cuentas/Bancos', parentLabel: 'Finanzas' };
    if (path.includes('finanzas/inversiones'))
      return { id: 'finanzas-inversiones', label: 'Inversiones', parentLabel: 'Finanzas' };
    if (path.includes('finanzas'))
      return { id: 'finanzas-dashboard', label: 'Dashboard', parentLabel: 'Finanzas' };
    return { id: 'dashboard', label: 'Dashboard' };
  };

  return (
    <DashboardLayout currentPage={getPageInfo(location.pathname)} onNavigate={handleNavigate}>
      {children}
    </DashboardLayout>
  );
}

export default function App() {
  useThemeEffect();
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <DashboardWrapper>
                  <DashboardPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <DashboardWrapper>
                  <UsersPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/roles"
              element={
                <DashboardWrapper>
                  <RolesPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/clients"
              element={
                <DashboardWrapper>
                  <ClientsPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/zones"
              element={
                <DashboardWrapper>
                  <ZonasPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/sedes"
              element={
                <DashboardWrapper>
                  <SedesPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/vehicles"
              element={
                <DashboardWrapper>
                  <VehiculosPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/materials"
              element={
                <DashboardWrapper>
                  <MaterialesPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/empleados"
              element={
                <DashboardWrapper>
                  <EmpleadosPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/vacaciones"
              element={
                <DashboardWrapper>
                  <VacacionesPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/sueldos"
              element={
                <DashboardWrapper>
                  <SueldosPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/ausencias"
              element={
                <DashboardWrapper>
                  <AusenciasPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/tickets"
              element={
                <DashboardWrapper>
                  <TicketsPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/tickets/:id"
              element={
                <DashboardWrapper>
                  <TicketDetailPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/obras"
              element={
                <DashboardWrapper>
                  <ObrasPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/finanzas"
              element={
                <DashboardWrapper>
                  <FinanzasDashboard />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/finanzas/movimientos"
              element={
                <DashboardWrapper>
                  <MovimientosPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/finanzas/cuentas"
              element={
                <DashboardWrapper>
                  <CuentasPage />
                </DashboardWrapper>
              }
            />
            <Route
              path="/dashboard/finanzas/inversiones"
              element={
                <DashboardWrapper>
                  <InversionesPage />
                </DashboardWrapper>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
