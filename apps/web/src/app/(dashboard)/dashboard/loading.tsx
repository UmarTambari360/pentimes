import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-5xl">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-11 w-11 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Secondary stats skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-border bg-card p-4 flex items-center gap-4"
          >
            <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
            <div className="space-y-1">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>

      {/* Articles section skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 p-4 rounded-lg border border-border"
            >
              <Skeleton className="h-24 w-36 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
