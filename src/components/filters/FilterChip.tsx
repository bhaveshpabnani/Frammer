import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  value: string;
  onRemove: () => void;
  className?: string;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, value, onRemove, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      'bg-frammer-red/15 border border-frammer-red/30 text-white',
      className
    )}
  >
    <span className="text-[#71717A]">{label}:</span>
    <span>{value}</span>
    <button
      onClick={onRemove}
      className="ml-0.5 text-[#71717A] hover:text-white transition-colors rounded-full hover:bg-white/10 p-0.5"
    >
      <X size={10} />
    </button>
  </span>
);
