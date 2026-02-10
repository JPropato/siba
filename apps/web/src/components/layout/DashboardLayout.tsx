import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import { CommandMenu } from './CommandMenu';
import { BottomNav } from './BottomNav';

interface PageInfo {
  id: string;
  label: string;
  parentLabel?: string;
}

interface DashboardLayoutProps {
  children?: React.ReactNode;
  currentPage: PageInfo;
  onNavigate: (pageId: string, label: string, parentLabel?: string) => void;
}

export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Initialize dark mode from system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileMenuOpen(!isMobileMenuOpen);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] text-[var(--foreground)] antialiased transition-colors duration-300">
      <CommandMenu />

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleToggleSidebar}
        currentPage={currentPage.id}
        onNavigate={onNavigate}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          onToggleSidebar={handleToggleSidebar}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">{children}</div>
      </main>

      <BottomNav />
    </div>
  );
}

export default DashboardLayout;
