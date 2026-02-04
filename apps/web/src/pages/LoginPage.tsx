import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../lib/api';
import { useAuthStore } from '../stores/auth-store';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/core/Button';
import { Input } from '../components/ui/core/Input';
import logoBauman from '../assets/logo-bauman.png';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

// Schema de validación con Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);

    try {
      const response = await api.post('/auth/login', data);
      const { user, accessToken } = response.data;

      setAuth(user, accessToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      // No usar console.error en producción - solo setError
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(
        axiosError.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.'
      );
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 rounded-lg p-3 text-center">
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {error}
                  </p>
                </div>
              )}

              {/* Email Field */}
              <Input
                id="email"
                type="email"
                label="Correo Electrónico"
                placeholder="usuario@siba.com"
                error={errors.email?.message}
                leftIcon={<Mail className="h-[18px] w-[18px]" />}
                {...register('email')}
              />

              {/* Password Field */}
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  label="Contraseña"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  leftIcon={<Lock className="h-[18px] w-[18px]" />}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-9 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-brand transition-colors focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
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
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSubmitting}
                  className="w-full uppercase tracking-wider"
                >
                  {!isSubmitting && 'Iniciar Sesión'}
                </Button>
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
