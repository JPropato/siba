import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UnderConstructionPage from './pages/UnderConstructionPage';
import DashboardLayout from './components/layout/DashboardLayout';
import Breadcrumbs from './components/layout/Breadcrumbs';
import './App.css';

interface PageInfo {
  id: string;
  label: string;
  parentLabel?: string;
}

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageInfo>({
    id: 'dashboard',
    label: 'Dashboard',
  });
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');

  // Predefined corporate palettes
  const palettes = [
    { label: 'Azul Bauman', color: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    { label: 'Oro Bauman', color: '#bd8e3d', light: '#e6c489', dark: '#a67c35' },
    { label: 'Esmeralda', color: '#10b981', light: '#34d399', dark: '#059669' },
    { label: 'Índigo', color: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    { label: 'Negro Premium', color: '#0f172a', light: '#334155', dark: '#000000' },
    { label: 'Gris Plata', color: '#94a3b8', light: '#cbd5e1', dark: '#475569' },
    { label: 'Slate Real', color: '#475569', light: '#64748b', dark: '#1e293b' },
    { label: 'Bordeaux', color: '#991b1b', light: '#ef4444', dark: '#7f1d1d' },
  ];

  const updatePrimaryColor = (palette: (typeof palettes)[0]) => {
    setPrimaryColor(palette.color);
    document.documentElement.style.setProperty('--brand-color', palette.color);
    document.documentElement.style.setProperty('--brand-light', palette.light);
    document.documentElement.style.setProperty('--brand-dark', palette.dark);
  };

  // Initialize dark mode from system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleNavigate = (pageId: string, label: string, parentLabel?: string) => {
    setCurrentPage({ id: pageId, label, parentLabel });
  };

  // Render page content based on current page
  const renderPageContent = () => {
    if (currentPage.id === 'dashboard') {
      return <DashboardPage />;
    }

    // All other pages show "Under Construction"
    const breadcrumbItems = [
      { label: 'Inicio', href: '#' },
      ...(currentPage.parentLabel ? [{ label: currentPage.parentLabel, href: '#' }] : []),
      { label: currentPage.label },
    ];

    return (
      <>
        <div className="space-y-2">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex items-center justify-between">
            <h2 className="text-3xl md:text-4xl font-black text-[var(--foreground)] tracking-tight">
              {currentPage.label}
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg text-sm font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand/20">
              <span className="material-symbols-outlined text-lg">add</span>
              <span className="hidden sm:inline">Nuevo</span>
            </button>
          </div>
        </div>
        <UnderConstructionPage title={currentPage.label} section={currentPage.parentLabel} />
      </>
    );
  };

  // If not authenticated, show login
  if (!isAuthenticated) {
    return (
      <div className={darkMode ? 'dark' : ''}>
        <div onClick={handleLoginSuccess}>
          <LoginPage />
        </div>
        {/* Floating Controls */}
        <div className="fixed bottom-4 right-4 flex flex-col gap-3 z-50">
          {/* Color Picker (Simple POC) */}
          <div className="flex flex-col-reverse items-end gap-2 group">
            <div className="flex flex-col gap-2 p-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none group-hover:pointer-events-auto">
              {palettes.map((p) => (
                <button
                  key={p.color}
                  onClick={(e) => {
                    e.stopPropagation();
                    updatePrimaryColor(p);
                  }}
                  className="size-8 rounded-full border-2 border-white dark:border-slate-700 transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: p.color }}
                  title={p.label}
                />
              ))}
            </div>
            <button
              onClick={(e) => e.stopPropagation()}
              className="size-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: primaryColor, color: 'white' }}
            >
              <span className="material-symbols-outlined">palette</span>
            </button>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleDarkMode();
            }}
            className="size-12 rounded-full bg-slate-800 text-white dark:bg-white dark:text-slate-800 shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
            title={darkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            <span className="material-symbols-outlined text-2xl">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Authenticated - show dashboard layout
  return (
    <DashboardLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {renderPageContent()}
    </DashboardLayout>
  );
}

export default App;
