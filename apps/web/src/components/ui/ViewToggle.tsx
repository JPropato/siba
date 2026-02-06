import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { LucideIcon } from 'lucide-react';

interface ViewOption<T extends string> {
  value: T;
  icon: LucideIcon;
  label: string;
}

interface ViewToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ViewOption<T>[];
  className?: string;
}

/**
 * ViewToggle - Toggle animado para cambiar entre vistas.
 *
 * @example
 * <ViewToggle
 *   value={viewMode}
 *   onChange={setViewMode}
 *   options={[
 *     { value: 'table', icon: List, label: 'Vista Tabla' },
 *     { value: 'kanban', icon: Columns, label: 'Vista Kanban' },
 *   ]}
 * />
 */
function ViewToggleInner<T extends string>({
  value,
  onChange,
  options,
  className,
}: ViewToggleProps<T>) {
  return (
    <div
      className={cn(
        'relative flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <motion.button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative p-2 rounded-md transition-colors z-10',
              isActive
                ? 'text-brand'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            )}
            title={option.label}
            aria-label={option.label}
            aria-pressed={isActive}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isActive && (
              <motion.div
                layoutId="view-toggle-bg"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-md shadow-sm"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <Icon className="h-5 w-5 relative z-10" />
          </motion.button>
        );
      })}
    </div>
  );
}

export const ViewToggle = memo(ViewToggleInner) as typeof ViewToggleInner;

export default ViewToggle;
