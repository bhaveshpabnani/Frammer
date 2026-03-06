import React, { useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  className?: string;
  showSearch?: boolean;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  label,
  value,
  options,
  onChange,
  className,
  showSearch = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selected = options.find((o) => o.value === value);
  const filtered = showSearch
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium',
            'bg-[#111111] border border-[#27272A] text-[#A1A1AA]',
            'hover:border-[#3F3F46] hover:text-white transition-all',
            value !== 'all' && 'border-frammer-red/40 text-white bg-frammer-red/10',
            className
          )}
        >
          <span className="text-[#52525B] text-[10px] uppercase tracking-wide mr-0.5">{label}</span>
          <span className="max-w-24 truncate">{selected?.label ?? value}</span>
          <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-0 bg-[#161616] border-[#27272A] shadow-xl"
        align="start"
        sideOffset={6}
      >
        {showSearch && (
          <div className="flex items-center gap-2 px-2 py-2 border-b border-[#27272A]">
            <Search size={12} className="text-[#52525B] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#52525B]"
            />
          </div>
        )}
        <div className="py-1 max-h-56 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                'w-full flex items-center justify-between px-3 py-1.5 text-xs',
                'hover:bg-white/5 transition-colors',
                opt.value === value ? 'text-white' : 'text-[#A1A1AA]'
              )}
            >
              {opt.label}
              {opt.value === value && <Check size={11} className="text-frammer-red" />}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-3 text-xs text-[#52525B] text-center">No results</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
