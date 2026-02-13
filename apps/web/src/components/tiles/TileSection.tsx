import React from 'react';

interface TileSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
}

export function TileSection({ title, icon, children, collapsible = false }: TileSectionProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-slate-600 dark:text-slate-400">{icon}</div>}
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {title}
          </h2>
        </div>
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            aria-label={isCollapsed ? `Expandir ${title}` : `Colapsar ${title}`}
          >
            <svg
              className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Section Content */}
      {!isCollapsed && children}
    </div>
  );
}
