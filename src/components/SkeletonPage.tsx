/**
 * SkeletonPage — full-page skeleton loader.
 * Shows 4 StatsCard skeletons + 2 ChartCard skeletons + a table skeleton.
 */
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-20 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton({ height = 240 }: { height?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-40 mb-1" />
        <Skeleton className="h-3 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full rounded" style={{ height }} />
      </CardContent>
    </Card>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header row */}
          <div className="flex gap-4 pb-2 border-b">
            {[40, 20, 15, 15, 10].map((w, i) => (
              <Skeleton key={i} className="h-3" style={{ width: `${w}%` }} />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 py-1">
              {[40, 20, 15, 15, 10].map((w, j) => (
                <Skeleton key={j} className="h-3" style={{ width: `${w}%` }} />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SkeletonPageProps {
  statsCount?: number;
  chartsCount?: number;
  showTable?: boolean;
}

export function SkeletonPage({
  statsCount = 4,
  chartsCount = 2,
  showTable = true,
}: SkeletonPageProps) {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className={`grid gap-4 grid-cols-2 md:grid-cols-${Math.min(statsCount, 4)}`}>
        {Array.from({ length: statsCount }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: chartsCount }).map((_, i) => (
          <ChartCardSkeleton key={i} />
        ))}
      </div>

      {/* Table */}
      {showTable && <TableSkeleton />}
    </div>
  );
}
