import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { InfoIcon, DownloadIcon, ExpandIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tooltip?: string;
  className?: string;
  height?: number | string;
  headerExtra?: ReactNode;
  allowDownload?: boolean;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  tooltip,
  className = '',
  height = 280,
  headerExtra,
  allowDownload = false,
}) => {
  return (
    <div className={cn('frammer-card flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#1C1C1C]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
            {tooltip && (
              <TooltipProvider>
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    <InfoIcon className="h-3.5 w-3.5 text-[#52525B] cursor-help flex-shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-[#1C1C1C] border-[#27272A] text-white text-xs max-w-xs"
                  >
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-[#71717A] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1 ml-3 shrink-0">
          {headerExtra}
          {allowDownload && (
            <button
              className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/5 transition-colors"
              title="Download data"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/5 transition-colors"
            title="Expand"
          >
            <ExpandIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Chart body */}
      <div className="flex-1 px-4 py-3">
        <div style={{ height, width: '100%' }} className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
