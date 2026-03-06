import React from 'react';
import { CheckCircle2, AlertTriangle, Database, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export type DataQualityType = 'actual' | 'estimated' | 'calculated' | 'mixed';

interface DataQualityBadgeProps {
  type: DataQualityType;
  description?: string;
  showLabel?: boolean;
  className?: string;
}

const BADGE_CONFIG: Record<DataQualityType, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  actual: {
    icon: <CheckCircle2 size={10} />,
    label: 'Actual',
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
  },
  estimated: {
    icon: <HelpCircle size={10} />,
    label: '~Est.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  calculated: {
    icon: <Database size={10} />,
    label: 'Calc.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
  },
  mixed: {
    icon: <AlertTriangle size={10} />,
    label: 'Mixed',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
  },
};

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
  type,
  description,
  showLabel = true,
  className,
}) => {
  const config = BADGE_CONFIG[type];
  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium border',
        config.bg,
        config.color,
        className
      )}
    >
      {config.icon}
      {showLabel && config.label}
    </span>
  );

  if (!description) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-56 text-xs bg-[#1C1C1C] border-[#27272A]">
        {description}
      </TooltipContent>
    </Tooltip>
  );
};
