import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/FilterContext';
import { FilterChip } from './FilterChip';
import { FilterDropdown } from './FilterDropdown';
import { ComparisonToggle } from './ComparisonToggle';
import { useDimensions } from '@/hooks/useApi';

const ALL_OPT = { value: 'all', label: 'All' };

interface FilterBarProps {
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ className }) => {
  const { filters, updateFilters, resetFilters, activeFilterCount } = useFilters();
  const { data: dimensions } = useDimensions();

  const clientOptions = [
    { value: 'all', label: 'All Clients' },
    ...(dimensions?.clients ?? []).map((d) => ({ value: d.value, label: d.label })),
  ];
  const channelOptions = [
    { value: 'all', label: 'All Channels' },
    ...(dimensions?.channels ?? []).map((d) => ({ value: d.value, label: d.label })),
  ];
  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    ...(dimensions?.languages ?? []).map((d) => ({ value: d.value, label: d.label })),
  ];
  const inputTypeOptions = [
    { value: 'all', label: 'All Input Types' },
    ...(dimensions?.input_types ?? []).map((d) => ({ value: d.value, label: d.label })),
  ];
  const outputTypeOptions = [
    { value: 'all', label: 'All Output Types' },
    ...(dimensions?.output_types ?? []).map((d) => ({ value: d.value, label: d.label })),
  ];

  // Build label maps for display in filter chips
  const labelMap: Record<string, Record<string, string>> = {
    client: Object.fromEntries(clientOptions.map((o) => [o.value, o.label])),
    channel: Object.fromEntries(channelOptions.map((o) => [o.value, o.label])),
    language: Object.fromEntries(languageOptions.map((o) => [o.value, o.label])),
    inputType: Object.fromEntries(inputTypeOptions.map((o) => [o.value, o.label])),
    outputType: Object.fromEntries(outputTypeOptions.map((o) => [o.value, o.label])),
  };

  const chips: { key: keyof typeof filters; label: string }[] = [
    { key: 'client', label: 'Client' },
    { key: 'channel', label: 'Channel' },
    { key: 'language', label: 'Language' },
    { key: 'inputType', label: 'Input' },
    { key: 'outputType', label: 'Output' },
  ];

  const activeChips = chips.filter(
    (c) => filters[c.key as keyof typeof filters] !== 'all'
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Filter icon + count */}
      <div className="flex items-center gap-1.5 text-[#52525B]">
        <SlidersHorizontal size={14} />
        {activeFilterCount > 0 && (
          <span className="text-[10px] font-semibold bg-frammer-red/20 text-frammer-red px-1.5 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </div>

      {/* Dropdowns */}
      <FilterDropdown
        label="Client"
        value={filters.client}
        options={clientOptions}
        onChange={(v) => updateFilters({ client: v })}
        showSearch={clientOptions.length > 5}
      />
      <FilterDropdown
        label="Channel"
        value={filters.channel}
        options={channelOptions}
        onChange={(v) => updateFilters({ channel: v })}
        showSearch={channelOptions.length > 5}
      />
      <FilterDropdown
        label="Language"
        value={filters.language}
        options={languageOptions}
        onChange={(v) => updateFilters({ language: v })}
        showSearch={languageOptions.length > 5}
      />
      <FilterDropdown
        label="Input"
        value={filters.inputType}
        options={inputTypeOptions}
        onChange={(v) => updateFilters({ inputType: v })}
        showSearch={inputTypeOptions.length > 5}
      />
      <FilterDropdown
        label="Output"
        value={filters.outputType}
        options={outputTypeOptions}
        onChange={(v) => updateFilters({ outputType: v })}
        showSearch={outputTypeOptions.length > 5}
      />

      {/* Comparison toggle */}
      <ComparisonToggle />

      {/* Active chips */}
      {activeChips.map((chip) => {
        const val = filters[chip.key as keyof typeof filters] as string;
        const label = labelMap[chip.key as string]?.[val] ?? val;
        return (
          <FilterChip
            key={chip.key}
            label={chip.label}
            value={label}
            onRemove={() => updateFilters({ [chip.key]: 'all' } as any)}
          />
        );
      })}

      {/* Reset */}
      {activeFilterCount > 0 && (
        <button
          onClick={resetFilters}
          className="inline-flex items-center gap-1 text-xs text-[#71717A] hover:text-white transition-colors"
        >
          <RotateCcw size={11} />
          Reset
        </button>
      )}
    </div>
  );
};
