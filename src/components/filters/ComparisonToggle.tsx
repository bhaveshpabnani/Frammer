import React from 'react';
import { GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/FilterContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const COMPARISON_TYPES = [
  { value: 'month', label: 'vs Previous Month' },
  { value: 'quarter', label: 'vs Previous Quarter' },
  { value: 'year', label: 'vs Previous Year' },
] as const;

export const ComparisonToggle: React.FC = () => {
  const { filters, updateComparison } = useFilters();
  const { comparison } = filters;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium',
            'bg-[#111111] border border-[#27272A] text-[#A1A1AA]',
            'hover:border-[#3F3F46] hover:text-white transition-all',
            comparison.enabled && 'border-frammer-blue/40 text-white bg-frammer-blue/10'
          )}
        >
          <GitCompare size={13} />
          {comparison.enabled ? (
            <span className="text-frammer-blue text-[11px]">
              {COMPARISON_TYPES.find((t) => t.value === comparison.type)?.label ?? 'Comparison on'}
            </span>
          ) : (
            <span>Compare</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-4 bg-[#161616] border-[#27272A] shadow-xl"
        align="end"
        sideOffset={6}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-white font-medium">Enable comparison</Label>
            <Switch
              checked={comparison.enabled}
              onCheckedChange={(v) => updateComparison({ enabled: v })}
              className="data-[state=checked]:bg-frammer-blue"
            />
          </div>
          {comparison.enabled && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-[#52525B] font-semibold">Baseline period</p>
              {COMPARISON_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => updateComparison({ type: t.value })}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors',
                    comparison.type === t.value
                      ? 'bg-frammer-blue/15 text-white border border-frammer-blue/30'
                      : 'text-[#A1A1AA] hover:bg-white/5'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
