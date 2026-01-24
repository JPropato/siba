import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, helperText, leftIcon, id, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        id={id}
                        ref={ref}
                        className={cn(
                            'w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-900 dark:text-white',
                            'focus:border-brand focus:ring-1 focus:ring-brand/20',
                            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
                            leftIcon && 'pl-10',
                            className
                        )}
                        {...props}
                    />
                </div>
                {error && (
                    <p className="text-[11px] font-medium text-red-500 mt-1">{error}</p>
                )}
                {!error && helperText && (
                    <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
