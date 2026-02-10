import { memo, type ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - Memoizado para evitar re-renders innecesarios.
 */
export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-slate-200 dark:border-[var(--border)] rounded-xl bg-[var(--surface)]/50 dark:bg-charcoal/20 backdrop-blur-sm p-6 text-center transition-colors">
      <div className="size-12 bg-brand/10 rounded-full flex items-center justify-center mb-4 border border-brand/20">
        {icon}
      </div>
      <div className="max-w-md">
        <h3 className="text-base font-bold text-[var(--foreground)] mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">{description}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 bg-[var(--surface)] dark:bg-white/5 border border-[var(--border)] text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-4 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/20 transition-all flex items-center gap-2"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default EmptyState;
