interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] border-2 border-dashed border-slate-200 dark:border-[var(--border)] rounded-xl bg-[var(--surface)]/50 dark:bg-charcoal/20 backdrop-blur-sm p-12 text-center transition-colors">
      <div className="size-20 bg-brand/10 rounded-full flex items-center justify-center mb-6 border border-brand/20">
        <span className="material-symbols-outlined text-brand text-5xl">{icon}</span>
      </div>
      <div className="max-w-md">
        <h3 className="text-2xl font-bold text-[var(--foreground)] mb-3 tracking-tight">{title}</h3>
        <p className="text-[var(--muted)] text-base mb-8 leading-relaxed">{description}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-6 py-2.5 bg-[var(--surface)] dark:bg-white/5 border border-[var(--border)] text-slate-700 dark:text-slate-300 font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-sm"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="px-6 py-2.5 bg-brand text-white font-bold rounded-lg hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/20 transition-all flex items-center gap-2"
            >
              {primaryAction.icon && (
                <span className="material-symbols-outlined">{primaryAction.icon}</span>
              )}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
