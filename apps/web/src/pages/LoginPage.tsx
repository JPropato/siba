import { useState } from 'react';
import api from '../lib/api';
import { useAuthStore } from '../stores/auth-store';
import { useNavigate } from 'react-router-dom';
import logoBauman from '../assets/logo-bauman.png';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data;

      setAuth(user, accessToken); // Save user & token in store

      navigate('/dashboard'); // Auto-redirect

    } catch (err: unknown) {
      console.error('Login failed', err);
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión. Verifique sus credenciales.';
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[var(--background)]">
      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[400px] flex flex-col items-center">
          {/* Logo Section - Same Line */}
          <div className="w-full flex items-center justify-center gap-6 mb-12 px-2">
            <img
              src={logoBauman}
              alt="Bauman"
              className="h-16 w-auto object-contain dark:brightness-0 dark:invert flex-shrink-0"
            />
            <div className="flex flex-col border-l-2 border-slate-900/10 dark:border-white/10 pl-6">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                SIBA
              </h1>
              <p className="text-slate-900 dark:text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase mt-1">
                Sistema Bauman
              </p>
            </div>
          </div>

          {/* Login Card */}
          <div className="w-full bg-[var(--surface)] rounded-xl luxury-shadow p-6 sm:p-8 border border-[var(--border)]">
            <div className="mb-8 text-center">
              <h2 className="text-lg font-semibold tracking-tight mb-1 text-[var(--foreground)]">
                Bienvenido
              </h2>
              <p className="text-[var(--muted-foreground)] text-[9px] font-bold tracking-[0.18em] uppercase">
                Plataforma Corporativa
              </p>
            </div>


            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-3 text-center">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] px-1">
                  Correo Electrónico
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-[18px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[38px] pl-10 pr-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none transition-all placeholder:text-[var(--muted-foreground)] text-xs text-[var(--foreground)] focus:border-brand focus:ring-1 focus:ring-brand/20"
                    placeholder="usuario@siba.com"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted)] px-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] text-[18px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[38px] pl-10 pr-10 bg-[var(--surface)] border border-[var(--border)] rounded-lg outline-none transition-all placeholder:text-[var(--muted-foreground)] text-xs text-[var(--foreground)] focus:border-brand focus:ring-1 focus:ring-brand/20"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center text-[var(--muted-foreground)] hover:text-brand transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end -mt-1">
                <a
                  href="#"
                  className="text-[9px] font-bold text-slate-500 hover:text-brand transition-colors uppercase tracking-widest py-1"
                >
                  ¿Olvidó su contraseña?
                </a>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-[40px] bg-brand hover:bg-brand-dark active:scale-[0.98] text-white text-[11px] font-bold rounded-lg shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[18px]">
                      progress_activity
                    </span>
                  ) : (
                    <span className="tracking-[0.18em] uppercase">Iniciar Sesión</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <p className="text-[9px] text-[var(--muted-foreground)] font-bold uppercase tracking-[0.25em]">
              © 2026 Bauman · Soluciones Corporativas
            </p>
          </div>
        </div>
      </main>

      {/* Background Gradients */}
      <div className="fixed top-0 right-0 -z-10 opacity-20 pointer-events-none">
        <div className="w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-[80px] sm:blur-[100px]" />
      </div>
      <div className="fixed bottom-0 left-0 -z-10 opacity-20 pointer-events-none">
        <div className="w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] rounded-full bg-gradient-to-tr from-brand/5 to-transparent blur-[70px] sm:blur-[90px]" />
      </div>
    </div>
  );
}

export default LoginPage;
