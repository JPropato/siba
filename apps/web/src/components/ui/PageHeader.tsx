import { memo, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

interface PageHeaderProps {
  icon?: ReactNode;
  breadcrumb?: string[];
  title: string;
  subtitle?: string;
  count?: number;
  action?: ReactNode;
}

export const PageHeader = memo(function PageHeader({
  icon,
  breadcrumb,
  title,
  subtitle,
  count,
  action,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between min-h-[48px]">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg bg-brand/10 text-brand border border-brand/20">
            {icon}
          </div>
        )}
        <div className="flex flex-col justify-center gap-0.5">
          {breadcrumb && breadcrumb.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              {breadcrumb.map((item, index) => (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight className="h-3 w-3" />}
                  <span>{item}</span>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[var(--foreground)] tracking-tight">{title}</h1>
            {count !== undefined && (
              <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md tabular-nums">
                {count}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 hidden sm:block">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
});
