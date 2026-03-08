import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import { InfoIcon, DownloadIcon, Maximize2, Minimize2, AlertCircle, BarChart2 } from 'lucide-react';
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
  onDownload?: () => void;
  isLoading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
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
  onDownload,
  isLoading = false,
  error,
  empty = false,
  emptyMessage = 'No data available for the selected filters.',
}) => {
  const [expanded, setExpanded] = useState(false);

  const header = (
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
        {(allowDownload || onDownload) && (
          <button
            onClick={onDownload}
            className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/5 transition-colors"
            title="Download data"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-lg text-[#52525B] hover:text-white hover:bg-white/5 transition-colors"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );

  const body = (
    <div className="flex-1 px-4 py-3">
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="space-y-2 w-full">
            {[80, 60, 90, 45, 70].map((w, i) => (
              <div key={i} className="h-2 rounded bg-[#1C1C1C] animate-pulse" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 text-[#71717A]" style={{ height }}>
          <AlertCircle className="h-6 w-6 text-red-500/60" />
          <p className="text-xs text-center max-w-[200px]">{error}</p>
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center gap-2 text-[#52525B]" style={{ height }}>
          <BarChart2 className="h-6 w-6" />
          <p className="text-xs text-center max-w-[220px]">{emptyMessage}</p>
        </div>
      ) : (
        <div style={{ height: expanded ? 'calc(100vh - 200px)' : height, width: '100%' }} className="overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );

  if (expanded) {
    return (
      <>
        {/* Overlay backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
        {/* Expanded card */}
        <div className="fixed inset-4 z-50 frammer-card flex flex-col overflow-hidden">
          {header}
          {body}
        </div>
      </>
    );
  }

  return (
    <div className={cn('frammer-card flex flex-col', className)}>
      {header}
      {body}
    </div>
  );
};
