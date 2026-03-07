/**
 * EmptyState — standardized no-data view.
 * Adapts message based on whether filters are active.
 */
import React from 'react';
import { SearchX, Filter, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  /** Whether any dimension/date filters are currently active */
  hasFilters?: boolean;
  /** Custom title override */
  title?: string;
  /** Custom description override */
  description?: string;
  /** Optional action button */
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  hasFilters = false,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  const Icon = hasFilters ? Filter : Database;

  const defaultTitle = hasFilters
    ? 'No records match your filters'
    : 'No data for this period';

  const defaultDescription = hasFilters
    ? 'Try broadening your filters or selecting a longer date range.'
    : 'There is no data available for the selected time range.';

  return (
    <div
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold">{title ?? defaultTitle}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description ?? defaultDescription}
      </p>
      {action && (
        <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/** Convenience variant: used when a search yields no results. */
export function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <SearchX className="mb-3 h-8 w-8 text-muted-foreground" />
      <h3 className="text-sm font-semibold">No results for &ldquo;{query}&rdquo;</h3>
      <p className="mt-1 text-xs text-muted-foreground">Check the spelling or try a different term.</p>
    </div>
  );
}
