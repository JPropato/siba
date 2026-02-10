import { Skeleton } from '../ui/Skeleton';

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="text" className="h-4 w-72" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="text" className="h-3 w-24" />
              <Skeleton variant="circular" width={36} height={36} />
            </div>
            <Skeleton variant="text" className="h-8 w-20" />
            <Skeleton variant="text" className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="rectangular" className="h-56 w-full" />
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <Skeleton variant="text" className="h-4 w-40" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="text" className="h-6 w-20" />
              <Skeleton variant="text" className="h-6 flex-1" />
              <Skeleton variant="text" className="h-5 w-16" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
          <Skeleton variant="text" className="h-4 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circular" width={28} height={28} />
              <div className="flex-1 space-y-1">
                <Skeleton variant="text" className="h-3 w-full" />
                <Skeleton variant="text" className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
