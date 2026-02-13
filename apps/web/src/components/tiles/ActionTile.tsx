import React from 'react';
import type { TileType } from '../../types/tiles';

interface ActionTileProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: TileType;
  badge?: string | number;
  disabled?: boolean;
}

const TILE_VARIANTS = {
  action: {
    bg: 'bg-brand/10',
    text: 'text-brand',
    hoverBg: 'group-hover:bg-brand',
    hoverText: 'group-hover:text-white',
    border: 'border-brand/20',
  },
  query: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-400',
    hoverBg: 'group-hover:bg-slate-200 dark:group-hover:bg-slate-700',
    hoverText: 'group-hover:text-slate-900 dark:group-hover:text-white',
    border: 'border-slate-200 dark:border-slate-700',
  },
  report: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    hoverBg: 'group-hover:bg-indigo-600',
    hoverText: 'group-hover:text-white',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  danger: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    hoverBg: 'group-hover:bg-red-600',
    hoverText: 'group-hover:text-white',
    border: 'border-red-200 dark:border-red-800',
  },
};

export const ActionTile = React.memo(function ActionTile({
  icon,
  title,
  description,
  onClick,
  variant = 'action',
  badge,
  disabled = false,
}: ActionTileProps) {
  const variantStyles = TILE_VARIANTS[variant];

  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={`${title}: ${description}`}
      className={`
        relative flex flex-col items-start gap-2 p-5 rounded-xl
        border-2 ${variantStyles.border}
        bg-white dark:bg-slate-900
        text-left transition-all duration-200
        hover:shadow-md hover:border-brand/30 hover:scale-[1.01]
        active:scale-[0.99]
        focus:outline-none focus:ring-2 focus:ring-brand/20
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        group
      `}
    >
      {/* Badge */}
      {badge !== undefined && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div
        className={`
          p-2.5 rounded-xl transition-all duration-200
          ${variantStyles.bg} ${variantStyles.text}
          ${variantStyles.hoverBg} ${variantStyles.hoverText}
        `}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 w-full">
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{description}</p>
      </div>
    </button>
  );
});
