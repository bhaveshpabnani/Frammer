import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface FunnelStage {
  label: string;
  value: number;
  color?: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  className?: string;
  showConversionRate?: boolean;
}

export const FunnelChart: React.FC<FunnelChartProps> = ({
  stages,
  className,
  showConversionRate = true,
}) => {
  const maxValue = stages[0]?.value ?? 1;

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {stages.map((stage, i) => {
        const widthPct = (stage.value / maxValue) * 100;
        const conversionRate =
          i > 0 && stages[i - 1].value > 0
            ? ((stage.value / stages[i - 1].value) * 100).toFixed(1)
            : null;
        const dropOff =
          i > 0 && stages[i - 1].value > 0
            ? (((stages[i - 1].value - stage.value) / stages[i - 1].value) * 100).toFixed(1)
            : null;

        const colors = [
          { bg: 'bg-frammer-red', text: 'text-frammer-red', bar: '#E8212B' },
          { bg: 'bg-orange-500', text: 'text-orange-400', bar: '#F97316' },
          { bg: 'bg-amber-500', text: 'text-amber-400', bar: '#F59E0B' },
        ];
        const c = colors[i % colors.length];

        return (
          <div key={stage.label} className="relative">
            {/* Drop-off connector */}
            {i > 0 && dropOff && showConversionRate && (
              <div className="flex items-center gap-2 mb-1 px-2">
                <div className="h-3 w-px bg-[#27272A] mx-auto" />
                <span className="absolute left-1/2 -translate-x-1/2 -top-1 text-[10px] text-red-400 font-medium bg-[#0A0A0A] px-1.5">
                  ↓ −{dropOff}%
                </span>
              </div>
            )}

            <div className="relative flex flex-col items-center">
              {/* Bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                className="h-10 rounded-lg flex items-center px-3 gap-2 relative overflow-hidden"
                style={{ backgroundColor: `${stage.color ?? c.bar}22`, border: `1px solid ${stage.color ?? c.bar}44`, minWidth: '180px' }}
              >
                <span className="text-sm font-semibold text-white font-metric">{stage.value.toLocaleString()}</span>
                <span className="text-xs text-[#71717A]">{stage.label}</span>
                {conversionRate && showConversionRate && (
                  <span className="ml-auto text-[11px] text-green-400 font-medium">
                    {conversionRate}% conv
                  </span>
                )}
                {/* Gradient shine */}
                <div
                  className="absolute inset-0 opacity-10 rounded-lg"
                  style={{ background: `linear-gradient(90deg, ${stage.color ?? c.bar} 0%, transparent 100%)` }}
                />
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
