import { Skeleton } from "@/components/ui/skeleton";

export default function ArticlesLoading() {
  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {["All", "Published", "Drafts"].map((tab) => (
          <Skeleton key={tab} className="h-9 w-20 rounded-none" />
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Table header */}
        <div className="bg-muted/30 p-4 grid grid-cols-4 gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16 hidden sm:block" />
          <Skeleton className="h-4 w-16 hidden md:block" />
          <Skeleton className="h-4 w-16 hidden md:block" />
        </div>

        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="p-4 border-t border-border flex items-center gap-4"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 hidden sm:block rounded-full" />
            <Skeleton className="h-4 w-12 hidden md:block" />
            <Skeleton className="h-4 w-20 hidden md:block" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
