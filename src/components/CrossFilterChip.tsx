/**
 * CrossFilterChip — dismissible chip shown when a chart click has applied a cross-filter.
 * Integrates with FilterContext to clear the specific filter value.
 */
import React from 'react';
import { X } from 'lucide-react';
import { useFilters } from '@/contexts/FilterContext';

const DIMENSION_LABELS: Record<string, string> = {
  channel: 'Channel',
  client: 'Client',
  language: 'Language',
  teamMember: 'Team member',
  inputType: 'Input type',
  outputType: 'Output type',
  publishedPlatform: 'Platform',
  billableFlag: 'Billable',
  publishedFlag: 'Published',
};

interface CrossFilterChipProps {
  /** The filter key in FilterState (e.g. 'channel', 'client') */
  dimension: keyof ReturnType<typeof useFilters>['filters'];
  /** The currently active value */
  value: string;
  className?: string;
}

export function CrossFilterChip({ dimension, value, className = '' }: CrossFilterChipProps) {
  const { updateFilters } = useFilters();

  const label = DIMENSION_LABELS[dimension as string] ?? String(dimension);

  const clear = () => {
    updateFilters({ [dimension]: 'all' } as Parameters<typeof updateFilters>[0]);
  };

  if (!value || value === 'all') return null;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}: <span className="font-semibold">{value}</span>
      <button
        onClick={clear}
        className="ml-0.5 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

/** Renders chips for every active cross-filter dimension */
export function CrossFilterBar() {
  const { filters, updateFilters } = useFilters();

  const activeDimensions: Array<{ key: keyof typeof filters; value: string }> = [
    { key: 'channel', value: filters.channel },
    { key: 'client', value: filters.client },
    { key: 'language', value: filters.language },
    { key: 'teamMember', value: filters.teamMember },
    { key: 'inputType', value: filters.inputType },
    { key: 'outputType', value: filters.outputType },
    { key: 'publishedPlatform', value: filters.publishedPlatform },
  ].filter((d) => d.value && d.value !== 'all');

  if (activeDimensions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-muted-foreground">Active:</span>
      {activeDimensions.map(({ key, value }) => (
        <CrossFilterChip key={key} dimension={key} value={value} />
      ))}
      <button
        onClick={() =>
          updateFilters({
            channel: 'all',
            client: 'all',
            language: 'all',
            teamMember: 'all',
            inputType: 'all',
            outputType: 'all',
            publishedPlatform: 'all',
          })
        }
        className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
      >
        Clear all
      </button>
    </div>
  );
}
