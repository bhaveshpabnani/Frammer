import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface GlossaryEntry {
  term: string;
  definition: string;
  category?: string;
  example?: string;
}

export const FRAMMER_GLOSSARY: Record<string, GlossaryEntry> = {
  'clip_yield': {
    term: 'Clip Yield',
    definition: 'The number of output clips generated per source video. Higher yield indicates more efficient content repurposing.',
    category: 'Efficiency',
    example: 'A 60-min webinar yielding 8 clips → Clip Yield = 8.0',
  },
  'publish_rate': {
    term: 'Publish Rate',
    definition: 'Percentage of processed clips that are published to a channel. Calculated as published_videos / processed_videos × 100.',
    category: 'Conversion',
    example: '312 published out of 412 processed → Publish Rate = 75.7%',
  },
  'processing_time': {
    term: 'Processing Time',
    definition: 'Average time in minutes from video upload to completion of all AI processing steps (transcription, clipping, tagging).',
    category: 'Performance',
  },
  'funnel_throughput': {
    term: 'Funnel Throughput',
    definition: 'Total volume of videos flowing through the Upload → Process → Publish pipeline in the selected period.',
    category: 'Volume',
  },
  'output_type': {
    term: 'Output Type',
    definition: 'The format of the generated clip: Reel (9:16 vertical), Short (YouTube <60s), Viral Clip (hook-first), Chapter (segment), Summary (condensed), Transcript.',
    category: 'Format',
  },
  'avg_processing_time': {
    term: 'Avg Processing Time',
    definition: 'Mean time in minutes to process one source video, including transcription, AI clipping, and tagging steps.',
    category: 'Performance',
  },
  'mom_growth': {
    term: 'MoM Growth',
    definition: 'Month-over-Month percentage change in a metric, comparing the current month to the prior month.',
    category: 'Trend',
    example: 'Jan: 152 → Feb: 168 → MoM Growth = +10.5%',
  },
};

interface TerminologyTooltipProps {
  term: keyof typeof FRAMMER_GLOSSARY;
  children: React.ReactNode;
  className?: string;
}

export const TerminologyTooltip: React.FC<TerminologyTooltipProps> = ({
  term,
  children,
  className,
}) => {
  const entry = FRAMMER_GLOSSARY[term];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            'border-b border-dashed border-[#3F3F46] cursor-help hover:border-[#71717A] transition-colors',
            className
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent
        className="max-w-64 bg-[#1C1C1C] border-[#27272A] shadow-xl"
        sideOffset={6}
      >
        <div className="space-y-1.5 p-0.5">
          {entry?.category && (
            <span className="text-[9px] uppercase tracking-wider text-frammer-red font-semibold">
              {entry.category}
            </span>
          )}
          <p className="text-xs font-semibold text-white">{entry?.term ?? term}</p>
          <p className="text-xs text-[#A1A1AA] leading-relaxed">{entry?.definition}</p>
          {entry?.example && (
            <p className="text-[10px] text-[#52525B] italic border-t border-[#27272A] pt-1.5 mt-1.5">
              {entry.example}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
