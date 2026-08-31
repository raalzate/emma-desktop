"use client";

/** Placeholder de carga mientras el runtime hidrata o el roadmap se resuelve. */

import { Skeleton } from "@/components/ui/skeleton";

export function ProgressSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-full max-w-xs" />
      <Skeleton className="h-4 w-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
