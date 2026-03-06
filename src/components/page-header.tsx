import React from 'react';
import { cn } from '@/lib/utils';
import { Download, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: { label: string; variant?: 'red' | 'blue' | 'green' | 'amber' };
  actions?: React.ReactNode;
  onRefresh?: () => void;
  onDownload?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  onRefresh,
  onDownload,
  className,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-start justify-between mb-6 gap-4', className)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-semibold text-white tracking-tight">{title}</h1>
          {badge && (
            <span
              className={cn(
                'mt-0.5',
                badge.variant === 'red' && 'badge-red',
                badge.variant === 'blue' && 'badge-blue',
                badge.variant === 'green' && 'badge-green',
                badge.variant === 'amber' && 'badge-amber',
                !badge.variant && 'badge-red'
              )}
            >
              {badge.label}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-[#71717A]">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 px-3 text-xs text-[#A1A1AA] hover:text-white bg-[#111111] border border-[#27272A] hover:border-[#3F3F46] rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        )}
        {onDownload && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="h-8 px-3 text-xs text-[#A1A1AA] hover:text-white bg-[#111111] border border-[#27272A] hover:border-[#3F3F46] rounded-lg"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export
          </Button>
        )}
        {actions}
      </div>
    </motion.div>
  );
};
