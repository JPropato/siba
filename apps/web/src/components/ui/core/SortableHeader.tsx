import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface SortableHeaderProps<T> {
    label: string;
    sortKey: keyof T;
    sortConfig: {
        key: keyof T | null;
        direction: 'asc' | 'desc' | null;
    };
    onSort: (key: keyof T) => void;
    className?: string;
}

export function SortableHeader<T>({
    label,
    sortKey,
    sortConfig,
    onSort,
    className,
}: SortableHeaderProps<T>) {
    const isActive = sortConfig.key === sortKey;

    return (
        <th
            className={cn(
                'px-4 py-3 font-semibold text-slate-900 dark:text-slate-100 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group',
                className
            )}
            onClick={() => onSort(sortKey)}
        >
            <div className="flex items-center gap-2">
                {label}
                {isActive ? (
                    sortConfig.direction === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5 text-brand" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-brand" />
                    )
                ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-30 group-hover:opacity-100 transition-opacity" />
                )}
            </div>
        </th>
    );
}
