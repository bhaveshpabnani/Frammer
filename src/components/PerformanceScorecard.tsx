import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScoreCategory {
  label: string;
  score: number; // 0-100
  icon: React.ReactNode;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface PerformanceScorecardProps {
  overallScore: number;
  categories: ScoreCategory[];
  title?: string;
  className?: string;
}

const STATUS_STYLES = {
  excellent: { color: 'text-green-400', bar: 'bg-green-500', icon: <CheckCircle2 size={12} /> },
  good: { color: 'text-blue-400', bar: 'bg-blue-500', icon: <TrendingUp size={12} /> },
  fair: { color: 'text-amber-400', bar: 'bg-amber-500', icon: <Clock size={12} /> },
  poor: { color: 'text-red-400', bar: 'bg-red-500', icon: <AlertTriangle size={12} /> },
};

export const PerformanceScorecard: React.FC<PerformanceScorecardProps> = ({
  overallScore,
  categories,
  title = 'Platform Health Score',
  className,
}) => {
  const stars = Math.round((overallScore / 100) * 5);

  return (
    <div className={cn('frammer-card p-5 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#71717A] uppercase tracking-wider font-semibold mb-1">{title}</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-white font-metric">{overallScore}</span>
            <span className="text-[#71717A] text-sm mb-1">/100</span>
          </div>
          <div className="flex gap-0.5 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < stars ? 'text-amber-400 fill-amber-400' : 'text-[#27272A]'}
              />
            ))}
          </div>
        </div>
        <div
          className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
          style={{
            borderColor:
              overallScore >= 80 ? '#22C55E' : overallScore >= 60 ? '#3B82F6' : overallScore >= 40 ? '#F59E0B' : '#E8212B',
          }}
        >
          <span
            className="text-base font-bold font-metric"
            style={{
              color:
                overallScore >= 80 ? '#22C55E' : overallScore >= 60 ? '#3B82F6' : overallScore >= 40 ? '#F59E0B' : '#E8212B',
            }}
          >
            {overallScore >= 80 ? 'A' : overallScore >= 60 ? 'B' : overallScore >= 40 ? 'C' : 'D'}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => {
          const s = STATUS_STYLES[cat.status];
          return (
            <div key={cat.label}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={cn('flex items-center', s.color)}>{cat.icon}</span>
                  <span className="text-xs text-[#A1A1AA]">{cat.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-[10px] font-semibold', s.color)}>
                    {cat.status.charAt(0).toUpperCase() + cat.status.slice(1)}
                  </span>
                  <span className="text-xs font-metric text-white">{cat.score}</span>
                </div>
              </div>
              <div className="h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', s.bar)}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
