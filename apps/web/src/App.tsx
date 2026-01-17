import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Component, type ReactNode, type ErrorInfo } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
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
  };

  const getPageInfo = (path: string) => {
    if (path.includes('users')) return { id: 'usuarios', label: 'Usuarios' };
    if (path.includes('roles')) return { id: 'roles', label: 'Roles' };
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
