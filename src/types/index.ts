// Frammer AI — Core data types for the analytics dashboard

export interface VideoRecord {
  id: string;
  title: string;
  channel: string;
  inputType: 'long_video' | 'podcast' | 'webinar' | 'interview';
  outputTypes: OutputType[];
  languages: string[];
  durationSeconds: number;
  publishedAt: string;
  teamMember: string;
  clipsGenerated: number;
  processingTimeSeconds: number;
  client: string;
}

export type OutputType =
  | 'reel'
  | 'short'
  | 'chapter'
  | 'summary'
  | 'viral_clip'
  | 'transcript'
  | 'thumbnail';

export interface ChannelMetrics {
  channel: string;
  videosProcessed: number;
  totalDurationHours: number;
  clipsGenerated: number;
  avgProcessingTimeMin: number;
}

export interface MonthlyMetrics {
  month: string;   // e.g. "Jan 25"
  videosProcessed: number;
  clipsGenerated: number;
  hoursProcessed: number;
  avgDurationMin: number;
}

export interface TeamMemberMetrics {
  name: string;
  videosProcessed: number;
  clipsGenerated: number;
  avgProcessingTimeMin: number;
  outputTypes: Partial<Record<OutputType, number>>;
}

export interface DashboardFilters {
  dateRange: string;
  client: string;
  channel?: string;
  teamMember?: string;
}

// Chart data colors — Frammer palette
export const CHART_COLORS = {
  red: '#E8212B',
  blue: '#3B82F6',
  amber: '#F59E0B',
  green: '#22C55E',
  purple: '#A78BFA',
  cyan: '#22D3EE',
  rose: '#FB7185',
  orange: '#F97316',
} as const;

export const OUTPUT_TYPE_LABELS: Record<OutputType, string> = {
  reel: 'Reel',
  short: 'YouTube Short',
  chapter: 'Chapter',
  summary: 'Summary',
  viral_clip: 'Viral Clip',
  transcript: 'Transcript',
  thumbnail: 'Thumbnail',
};
