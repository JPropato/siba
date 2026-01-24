import React from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--muted)]">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
          )}
          {item.href ? (
            <a href={item.href} className="hover:text-brand transition-colors">
              {item.label}
            </a>
          ) : (
            <span className="text-brand/70">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

export default Breadcrumbs;
