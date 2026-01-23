import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color?: 'gold' | 'indigo' | 'orange' | 'emerald' | 'brand';
    description?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
}

export function StatCard({
    title,
    value,
    icon: Icon,
    color = 'brand',
    description,
    trend,
}: StatCardProps) {
    const iconColors = {
        gold: 'bg-amber-500',
        indigo: 'bg-indigo-500',
        orange: 'bg-orange-500',
        emerald: 'bg-emerald-500',
        brand: 'bg-brand',
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 luxury-shadow transition-all hover:border-brand/30 group">
            <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", iconColors[color])}>
                    <Icon className="h-5 w-5 text-white" />
                </div>
                {trend && (
                    <div className={cn(
                        "text-[10px] font-black px-2 py-1 rounded-lg tracking-wider",
                        trend.positive ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                    )}>
                        {trend.value}
                    </div>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {title}
                </h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                        {value}
                    </span>
                </div>
                {description && (
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}
