import React from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/FilterContext';
import { FilterChip } from './FilterChip';
import { FilterDropdown } from './FilterDropdown';
import { ComparisonToggle } from './ComparisonToggle';

const CLIENT_OPTIONS = [
  { value: 'all', label: 'All Clients' },
  { value: 'techcorp', label: 'TechCorp' },
  { value: 'mediahub', label: 'MediaHub' },
  { value: 'startupxyz', label: 'StartupXYZ' },
  { value: 'globalco', label: 'GlobalCo' },
  { value: 'brandlabs', label: 'BrandLabs' },
];

const CHANNEL_OPTIONS = [
  { value: 'all', label: 'All Channels' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'webinar', label: 'Webinar' },
];

const LANGUAGE_OPTIONS = [
  { value: 'all', label: 'All Languages' },
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'french', label: 'French' },
  { value: 'german', label: 'German' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'arabic', label: 'Arabic' },
];

const INPUT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Input Types' },
  { value: 'long_video', label: 'Long Video' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'interview', label: 'Interview' },
  { value: 'live_stream', label: 'Live Stream' },
];

const OUTPUT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Output Types' },
  { value: 'reel', label: 'Reel' },
  { value: 'short', label: 'YouTube Short' },
  { value: 'viral_clip', label: 'Viral Clip' },
  { value: 'chapter', label: 'Chapter' },
  { value: 'summary', label: 'Summary' },
  { value: 'transcript', label: 'Transcript' },
];

const LABEL_MAP: Record<string, Record<string, string>> = {
  client: Object.fromEntries(CLIENT_OPTIONS.map((o) => [o.value, o.label])),
  channel: Object.fromEntries(CHANNEL_OPTIONS.map((o) => [o.value, o.label])),
  language: Object.fromEntries(LANGUAGE_OPTIONS.map((o) => [o.value, o.label])),
  inputType: Object.fromEntries(INPUT_TYPE_OPTIONS.map((o) => [o.value, o.label])),
  outputType: Object.fromEntries(OUTPUT_TYPE_OPTIONS.map((o) => [o.value, o.label])),
};

interface FilterBarProps {
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ className }) => {
  const { filters, updateFilters, resetFilters, activeFilterCount } = useFilters();

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
        options={CLIENT_OPTIONS}
        onChange={(v) => updateFilters({ client: v })}
        showSearch={CLIENT_OPTIONS.length > 5}
      />
      <FilterDropdown
        label="Channel"
        value={filters.channel}
        options={CHANNEL_OPTIONS}
        onChange={(v) => updateFilters({ channel: v })}
      />
      <FilterDropdown
        label="Language"
        value={filters.language}
        options={LANGUAGE_OPTIONS}
        onChange={(v) => updateFilters({ language: v })}
        showSearch
      />
      <FilterDropdown
        label="Input"
        value={filters.inputType}
        options={INPUT_TYPE_OPTIONS}
        onChange={(v) => updateFilters({ inputType: v })}
      />
      <FilterDropdown
        label="Output"
        value={filters.outputType}
        options={OUTPUT_TYPE_OPTIONS}
        onChange={(v) => updateFilters({ outputType: v })}
      />

      {/* Comparison toggle */}
      <ComparisonToggle />

      {/* Active chips */}
      {activeChips.map((chip) => {
        const val = filters[chip.key as keyof typeof filters] as string;
        const label = LABEL_MAP[chip.key as string]?.[val] ?? val;
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
