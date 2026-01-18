import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useThemeEffect } from './hooks/useThemeColor';
import { Component, type ReactNode, type ErrorInfo } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import ClientsPage from './pages/ClientsPage';
import ZonasPage from './pages/ZonasPage';
import SedesPage from './pages/SedesPage';
import VehiculosPage from './pages/VehiculosPage';
import MaterialesPage from './pages/MaterialesPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import './App.css';

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
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

    return this.props.children;
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
  };

  const getPageInfo = (path: string) => {
    if (path.includes('users')) return { id: 'usuarios', label: 'Usuarios' };
    if (path.includes('roles')) return { id: 'roles', label: 'Roles' };
    if (path.includes('clients')) return { id: 'clientes', label: 'Clientes', parentLabel: 'Administración' };
    if (path.includes('zones')) return { id: 'zonas', label: 'Zonas', parentLabel: 'Administración' };
    if (path.includes('sedes')) return { id: 'sedes', label: 'Sedes', parentLabel: 'Administración' };
    if (path.includes('vehicles')) return { id: 'vehiculos', label: 'Vehículos', parentLabel: 'Administración' };
    if (path.includes('materials')) return { id: 'materiales', label: 'Materiales', parentLabel: 'Catálogo' };
    return { id: 'dashboard', label: 'Dashboard' };
  };

  return (
    <DashboardLayout
      currentPage={getPageInfo(location.pathname)}
      onNavigate={handleNavigate}
    >
      {children}
    </DashboardLayout>
  );
}

export default function App() {
  useThemeEffect();
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <DashboardWrapper><DashboardPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/users" element={
            <DashboardWrapper><UsersPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/roles" element={
            <DashboardWrapper><RolesPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/clients" element={
            <DashboardWrapper><ClientsPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/zones" element={
            <DashboardWrapper><ZonasPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/sedes" element={
            <DashboardWrapper><SedesPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/vehicles" element={
            <DashboardWrapper><VehiculosPage /></DashboardWrapper>
          } />
          <Route path="/dashboard/materials" element={
            <DashboardWrapper><MaterialesPage /></DashboardWrapper>
          } />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
