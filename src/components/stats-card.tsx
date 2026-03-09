import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  accentColor?: 'red' | 'blue' | 'green' | 'amber' | 'purple';
  className?: string;
  loading?: boolean;
}

const accentMap = {
  red: {
    icon: 'text-frammer-red bg-frammer-red/10',
    trend_pos: 'text-green-400',
    trend_neg: 'text-red-400',
    glow: 'hover:shadow-[0_0_24px_rgba(232,33,43,0.12)]',
  },
  blue: {
    icon: 'text-blue-400 bg-blue-500/10',
    trend_pos: 'text-green-400',
    trend_neg: 'text-red-400',
    glow: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.12)]',
  },
  green: {
    icon: 'text-green-400 bg-green-500/10',
    trend_pos: 'text-green-400',
    trend_neg: 'text-red-400',
    glow: 'hover:shadow-[0_0_24px_rgba(34,197,94,0.12)]',
  },
  amber: {
    icon: 'text-amber-400 bg-amber-500/10',
    trend_pos: 'text-green-400',
    trend_neg: 'text-red-400',
    glow: 'hover:shadow-[0_0_24px_rgba(245,158,11,0.12)]',
  },
  purple: {
    icon: 'text-purple-400 bg-purple-500/10',
    trend_pos: 'text-green-400',
    trend_neg: 'text-red-400',
    glow: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.12)]',
  },
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  trend,
  icon,
  accentColor = 'red',
  className,
  loading = false,
}) => {
  const colors = accentMap[accentColor];
  const trendPositive = trend && trend.value >= 0;

  if (loading) {
    return (
      <div className={cn('frammer-card p-5 animate-pulse')}>
        <div className="h-3 w-2/3 bg-[#1C1C1C] rounded mb-3" />
        <div className="h-8 w-1/2 bg-[#1C1C1C] rounded mb-2" />
        <div className="h-3 w-1/3 bg-[#1C1C1C] rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'frammer-card p-5 cursor-default transition-all duration-200',
        colors.glow,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#71717A]">{title}</p>
        {icon && (
          <div className={cn('p-2 rounded-lg', colors.icon)}>
            <div className="w-4 h-4">{icon}</div>
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="font-metric text-3xl font-medium text-white leading-none">
          {value}
        </span>
        {unit && <span className="text-sm text-[#71717A]">{unit}</span>}
      </div>

      {trend !== undefined && (
        <div
          className={cn(
            'mt-0 flex items-center gap-1 text-xs font-medium',
            trendPositive ? colors.trend_pos : colors.trend_neg
          )}
        >
          {trend.value > 0 ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : trend.value < 0 ? (
            <TrendingDown className="w-3.5 h-3.5" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-[#52525B]" />
          )}
          <span>
            {trend.value >= 0 ? '+' : ''}{trend.value.toFixed(1)}%
          </span>
          {trend.label && (
            <span className="text-[#52525B] font-normal ml-0.5">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );
};
