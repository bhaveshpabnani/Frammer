// Frammer AI — Mock/seed analytics data
// In production this would come from Supabase / API calls

import type { MonthlyMetrics, ChannelMetrics, TeamMemberMetrics, OutputType } from '@/types';
import { CHART_COLORS } from '@/types';

// ── Monthly trend (Mar 2025 → Feb 2026) ──────────────────────────────────────
export const monthlyMetrics: MonthlyMetrics[] = [
  { month: 'Mar 25', videosProcessed: 48, clipsGenerated: 312, hoursProcessed: 94, avgDurationMin: 118 },
  { month: 'Apr 25', videosProcessed: 61, clipsGenerated: 396, hoursProcessed: 122, avgDurationMin: 120 },
  { month: 'May 25', videosProcessed: 74, clipsGenerated: 481, hoursProcessed: 148, avgDurationMin: 120 },
  { month: 'Jun 25', videosProcessed: 69, clipsGenerated: 455, hoursProcessed: 138, avgDurationMin: 120 },
  { month: 'Jul 25', videosProcessed: 82, clipsGenerated: 534, hoursProcessed: 164, avgDurationMin: 120 },
  { month: 'Aug 25', videosProcessed: 91, clipsGenerated: 592, hoursProcessed: 182, avgDurationMin: 120 },
  { month: 'Sep 25', videosProcessed: 108, clipsGenerated: 702, hoursProcessed: 216, avgDurationMin: 120 },
  { month: 'Oct 25', videosProcessed: 124, clipsGenerated: 806, hoursProcessed: 248, avgDurationMin: 120 },
  { month: 'Nov 25', videosProcessed: 137, clipsGenerated: 891, hoursProcessed: 274, avgDurationMin: 120 },
  { month: 'Dec 25', videosProcessed: 118, clipsGenerated: 767, hoursProcessed: 236, avgDurationMin: 120 },
  { month: 'Jan 26', videosProcessed: 152, clipsGenerated: 988, hoursProcessed: 304, avgDurationMin: 120 },
  { month: 'Feb 26', videosProcessed: 168, clipsGenerated: 1092, hoursProcessed: 336, avgDurationMin: 120 },
];

// ── Channel-wise breakdown ────────────────────────────────────────────────────
export const channelMetrics: ChannelMetrics[] = [
  { channel: 'YouTube', videosProcessed: 412, totalDurationHours: 824, clipsGenerated: 2678, avgProcessingTimeMin: 28 },
  { channel: 'Instagram', videosProcessed: 318, totalDurationHours: 636, clipsGenerated: 2067, avgProcessingTimeMin: 22 },
  { channel: 'LinkedIn', videosProcessed: 241, totalDurationHours: 482, clipsGenerated: 1566, avgProcessingTimeMin: 25 },
  { channel: 'Twitter/X', videosProcessed: 187, totalDurationHours: 374, clipsGenerated: 1216, avgProcessingTimeMin: 18 },
  { channel: 'Podcast', videosProcessed: 142, totalDurationHours: 284, clipsGenerated: 923, avgProcessingTimeMin: 35 },
  { channel: 'Webinar', videosProcessed: 96, totalDurationHours: 192, clipsGenerated: 624, avgProcessingTimeMin: 42 },
];

// ── Team productivity ─────────────────────────────────────────────────────────
export const teamMetrics: TeamMemberMetrics[] = [
  { name: 'Priya S.', videosProcessed: 218, clipsGenerated: 1417, avgProcessingTimeMin: 24, outputTypes: { reel: 412, short: 318, viral_clip: 287, chapter: 241, summary: 159 } },
  { name: 'Arjun M.', videosProcessed: 196, clipsGenerated: 1274, avgProcessingTimeMin: 26, outputTypes: { reel: 370, short: 284, viral_clip: 261, chapter: 212, summary: 147 } },
  { name: 'Zara K.', videosProcessed: 174, clipsGenerated: 1131, avgProcessingTimeMin: 29, outputTypes: { reel: 328, short: 252, viral_clip: 232, chapter: 188, summary: 131 } },
  { name: 'Arnav R.', videosProcessed: 158, clipsGenerated: 1027, avgProcessingTimeMin: 31, outputTypes: { reel: 297, short: 228, viral_clip: 210, chapter: 171, summary: 121 } },
  { name: 'Divya P.', videosProcessed: 143, clipsGenerated: 930, avgProcessingTimeMin: 27, outputTypes: { reel: 271, short: 208, viral_clip: 191, chapter: 156, summary: 104 } },
  { name: 'Karan T.', videosProcessed: 127, clipsGenerated: 826, avgProcessingTimeMin: 33, outputTypes: { reel: 240, short: 185, viral_clip: 170, chapter: 138, summary: 93 } },
];

// ── Output type distribution ──────────────────────────────────────────────────
export const outputTypeData = [
  { type: 'Reel', count: 1918, color: CHART_COLORS.red },
  { type: 'YouTube Short', count: 1475, color: CHART_COLORS.blue },
  { type: 'Viral Clip', count: 1351, color: CHART_COLORS.amber },
  { type: 'Chapter', count: 1106, color: CHART_COLORS.purple },
  { type: 'Summary', count: 755, color: CHART_COLORS.green },
  { type: 'Transcript', count: 469, color: CHART_COLORS.cyan },
];

// ── Language distribution ─────────────────────────────────────────────────────
export const languageData = [
  { language: 'English', count: 2841, percentage: 47.2 },
  { language: 'Hindi', count: 1387, percentage: 23.0 },
  { language: 'Spanish', count: 612, percentage: 10.2 },
  { language: 'French', count: 389, percentage: 6.5 },
  { language: 'German', count: 284, percentage: 4.7 },
  { language: 'Portuguese', count: 231, percentage: 3.8 },
  { language: 'Arabic', count: 169, percentage: 2.8 },
  { language: 'Others', count: 101, percentage: 1.8 },
];

// ── Input type breakdown ──────────────────────────────────────────────────────
export const inputTypeData = [
  { type: 'Long Video', count: 891, hours: 2227, color: CHART_COLORS.red },
  { type: 'Podcast', count: 412, hours: 824, color: CHART_COLORS.blue },
  { type: 'Webinar', count: 287, hours: 861, color: CHART_COLORS.amber },
  { type: 'Interview', count: 246, hours: 369, color: CHART_COLORS.purple },
  { type: 'Live Stream', count: 160, hours: 480, color: CHART_COLORS.green },
];

// ── Processing duration distribution ─────────────────────────────────────────
export const durationBuckets = [
  { range: '< 30 min', count: 287 },
  { range: '30–60 min', count: 512 },
  { range: '1–2 hrs', count: 684 },
  { range: '2–4 hrs', count: 348 },
  { range: '4–8 hrs', count: 127 },
  { range: '> 8 hrs', count: 38 },
];

// ── Headline KPIs ─────────────────────────────────────────────────────────────
export const kpis = {
  totalVideos: 1996,
  totalClips: 12974,
  totalHoursProcessed: 3992,
  avgClipsPerVideo: 6.5,
  avgProcessingTimeMin: 27.4,
  activeClients: 8,
  totalTeamMembers: 12,
  topChannel: 'YouTube',
  topLanguage: 'English',
  momGrowth: 10.5, // month-over-month videos processed growth
  clipsGrowthMom: 10.5,
};
