import { useState } from 'react';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <header className="p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">SIBA</h1>
          <button
            onClick={toggleDarkMode}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 font-medium transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </header>
      <main className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              Sistema de Gestión
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Frontend funcionando correctamente. Fase 0 - Setup.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
