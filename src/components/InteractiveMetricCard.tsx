import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InteractiveMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  details?: {
    label: string;
    value: string | number;
  }[];
  onClick?: () => void;
  expandable?: boolean;
  className?: string;
}

export const InteractiveMetricCard: React.FC<InteractiveMetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  details,
  onClick,
  expandable = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = details && details.length > 0;
  const isClickable = onClick || (expandable && hasDetails);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (expandable && hasDetails) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div
      className={cn(
        'frammer-card p-4 transition-all duration-200',
        isClickable && 'cursor-pointer hover:border-[#3F3F46]',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#71717A]">
              {title}
            </h3>
            {isClickable && (
              <div className="text-[#52525B]">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </div>
            )}
          </div>

          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-metric text-2xl font-medium text-white">{value}</span>
            {subtitle && (
              <span className="text-sm text-[#71717A]">{subtitle}</span>
            )}
          </div>

          {trend && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs font-medium',
                trend.value >= 0 ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.value >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              <span>
                {trend.value >= 0 ? '+' : ''}
                {trend.value.toFixed(1)}%
              </span>
              <span className="text-[#52525B] font-normal ml-0.5">{trend.label}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 pt-3 border-t border-[#1C1C1C] space-y-1.5 overflow-hidden"
          >
            {details!.map((detail, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-[#71717A]">{detail.label}</span>
                <span className="font-metric font-medium text-white">{detail.value}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
