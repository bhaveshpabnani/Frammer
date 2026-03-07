/**
 * TanStack Query hooks for all API endpoints.
 *
 * Each hook transforms backend snake_case field names into the camelCase
 * shapes already used throughout the frontend pages (matching mockData.ts).
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { toApiParams } from '@/api/client';
import {
  fetchKpis,
  fetchMonthly,
  fetchChannels,
  fetchChannelUsers,
  fetchUsers,
  fetchLanguages,
  fetchInputTypes,
  fetchOutputTypes,
  fetchVideos,
  fetchVideoExplorer,
  fetchQualitySummary,
  fetchQualityFields,
  fetchQualityRules,
  fetchQualityIssues,
  fetchDurationBuckets,
  fetchDimensions,
  fetchForecast,
  fetchClientsSummary,
  runQuery,
  fetchFunnel,
  fetchFunnelBySegment,
  fetchGrowth,
  fetchGrowthDrivers,
  fetchLag,
  fetchLagSlaBreaches,
  fetchLagBacklog,
  fetchLagAging,
  fetchMultiDimensional,
  fetchTeams,
  fetchChannelHealth,
  fetchUserProductivity,
  fetchConcentration,
  fetchBenchmarks,
  fetchPublishingByChannel,
  fetchQualityExtended,
  fetchRegistryMetrics,
} from '@/api/endpoints';
import type {
  QueryRequest,
  GrowthResponseRaw,
  LagResponseRaw,
  LagMetricsRowRaw,
  VideoRowExtended,
} from '@/api/types';
import { CHART_COLORS } from '@/types';

// ── KPIs ───────────────────────────────────────────────────────────────────────
export function useKpis() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['kpis', qs],
    queryFn: () => fetchKpis(qs),
    select: (d) => ({
      totalVideos: d.total_uploaded,
      totalClips: d.total_created,
      totalProcessed: d.total_processed ?? 0,
      totalHoursProcessed: d.total_uploaded_duration_hrs,
      avgClipsPerVideo: d.avg_clips_per_video ?? 1.0,
      avgProcessingTimeMin:
        d.total_uploaded > 0
          ? Math.round((d.total_uploaded_duration_hrs * 60) / d.total_uploaded * 10) / 10
          : 0,
      activeClients: d.active_clients,
      totalTeamMembers: d.active_users,
      activeTeams: d.active_teams ?? 0,
      momGrowth: d.mom_growth_pct ?? 0,
      clipsGrowthMom: d.mom_growth_pct ?? 0,
      topChannel: d.top_channel,
      topLanguage: d.top_language,
      publishRate: d.publish_rate,
      processingRate: d.processing_rate,
      activeChannels: d.active_channels,
      dqScore: d.dq_score ?? null,
    }),
    staleTime: 30_000,
  });
}

// ── Monthly ────────────────────────────────────────────────────────────────────
export function useMonthly() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['monthly', qs],
    queryFn: () => fetchMonthly(qs),
    select: (rows) =>
      rows.map((r) => ({
        month: r.month_label,
        videosProcessed: r.total_uploaded,
        videosPublished: r.total_published,
        clipsGenerated: r.total_created,
        hoursProcessed: r.uploaded_duration_hrs,
        avgDurationMin: r.avg_duration_min,
        // keep raw fields for forecasting
        _raw: r,
      })),
    staleTime: 30_000,
  });
}

// ── Channels ───────────────────────────────────────────────────────────────────
export function useChannels() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['channels', qs],
    queryFn: () => fetchChannels(qs),
    select: (rows) =>
      rows.map((r) => ({
        channel: r.channel,
        obfuscatedCode: r.obfuscated_code ?? r.channel,
        videosProcessed: r.total_uploaded,
        clipsGenerated: r.total_created,
        totalDurationHours: r.uploaded_duration_hrs,
        avgProcessingTimeMin: r.avg_duration_min,
      })),
    staleTime: 30_000,
  });
}

// ── Users / Team ───────────────────────────────────────────────────────────────
export function useUsers() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['users', qs],
    queryFn: () => fetchUsers(qs),
    select: (rows) =>
      rows.map((r) => ({
        name: r.user,
        teamName: r.team_name ?? '',
        videosProcessed: r.total_uploaded,
        clipsGenerated: r.total_created,
        avgProcessingTimeMin: r.avg_duration_min,
        // outputTypes breakdown not available at row level; default zeros
        outputTypes: {
          reel: 0,
          short: 0,
          viral_clip: 0,
          chapter: 0,
          summary: 0,
        } as Record<string, number>,
      })),
    staleTime: 30_000,
  });
}

// ── Languages ──────────────────────────────────────────────────────────────────
const LANG_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
  CHART_COLORS.rose, CHART_COLORS.orange,
];

export function useLanguages() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['languages', qs],
    queryFn: () => fetchLanguages(qs),
    select: (rows) =>
      rows.map((r, i) => ({
        language: r.display_name,
        count: r.total_uploaded,
        percentage: r.percentage,
        color: LANG_COLORS[i % LANG_COLORS.length],
      })),
    staleTime: 30_000,
  });
}

// ── Input Types ────────────────────────────────────────────────────────────────
const INPUT_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.purple, CHART_COLORS.green,
];

export function useInputTypes() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['input-types', qs],
    queryFn: () => fetchInputTypes(qs),
    select: (rows) =>
      rows.map((r, i) => ({
        type: r.input_type,
        count: r.total_uploaded,
        hours: r.uploaded_duration_hrs,
        color: INPUT_COLORS[i % INPUT_COLORS.length],
      })),
    staleTime: 30_000,
  });
}

// ── Output Types ───────────────────────────────────────────────────────────────
const OUTPUT_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.cyan,
];

export function useOutputTypes() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['output-types', qs],
    queryFn: () => fetchOutputTypes(qs),
    select: (rows) =>
      rows.map((r, i) => ({
        type: r.output_type,
        count: r.total_uploaded,
        color: OUTPUT_COLORS[i % OUTPUT_COLORS.length],
      })),
    staleTime: 30_000,
  });
}

// ── Videos ─────────────────────────────────────────────────────────────────────
import type { VideoRecord } from '@/data/videoExplorerData';

export function useVideos(page = 1, pageSize = 100, search?: string) {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['videos', qs, page, pageSize, search],
    queryFn: () => fetchVideos(qs, page, pageSize, search),
    select: (d) => ({
      items: d.items.map((v): VideoRecord => ({
        video_id: v.video_id ?? '',
        headline: v.headline ?? '',
        client: v.client ?? '',
        channel: v.channel ?? '',
        user: v.user ?? '',
        language: v.language ?? '',
        input_type: v.input_type ?? '',
        output_types: v.output_types,
        duration_min: v.uploaded_duration_hrs ? Math.round(v.uploaded_duration_hrs * 60) : 0,
        uploaded_at: v.uploaded_at ? new Date(v.uploaded_at * 1000).toISOString() : '',
        processed_at: v.uploaded_at ? new Date(v.uploaded_at * 1000).toISOString() : '',
        published_at: null,
        published_flag: v.published,
        platform: v.published_platform ?? '',
        clips_generated: 1,
        processing_time_min: v.created_duration_hrs ? Math.round(v.created_duration_hrs * 60) : 0,
      })),
      total: d.total,
      page: d.page,
      pageSize: d.page_size,
      totalPages: d.total_pages,
    }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ── Quality ────────────────────────────────────────────────────────────────────
export function useQuality() {
  return useQuery({
    queryKey: ['quality'],
    queryFn: fetchQualitySummary,
    staleTime: 60_000,
  });
}

// ── Duration Buckets ──────────────────────────────────────────────────────────
export function useDurationBuckets() {
  return useQuery({
    queryKey: ['duration-buckets'],
    queryFn: fetchDurationBuckets,
    staleTime: 60_000,
  });
}

// ── Channel Users (cross-tab) ──────────────────────────────────────────────
export function useChannelUsers(channel?: string) {
  return useQuery({
    queryKey: ['channel-users', channel ?? 'all'],
    queryFn: () => fetchChannelUsers(channel),
    staleTime: 30_000,
  });
}

// ── Forecast ──────────────────────────────────────────────────────────────────
export type ForecastMetric =
  | 'total_uploaded'
  | 'total_published'
  | 'uploaded_duration_hrs'
  | 'created_duration_hrs';

export function useForecast(metric: ForecastMetric, horizon = 6) {
  return useQuery({
    queryKey: ['forecast', metric, horizon],
    queryFn: () => fetchForecast(metric, horizon),
    staleTime: 60_000,
  });
}

// ── Dimensions ─────────────────────────────────────────────────────────────────
export function useDimensions() {
  return useQuery({
    queryKey: ['dimensions'],
    queryFn: fetchDimensions,
    staleTime: 300_000, // rarely changes
  });
}

// ── Clients Summary ────────────────────────────────────────────────────────────
export function useClientsSummary() {
  return useQuery({
    queryKey: ['clients-summary'],
    queryFn: fetchClientsSummary,
    staleTime: 60_000,
  });
}

// ── SQL Query Sandbox ──────────────────────────────────────────────────────────
export function useRunQuery() {
  return useMutation({
    mutationFn: (req: QueryRequest) => runQuery(req),
  });
}

// ── Funnel ────────────────────────────────────────────────────────────────────
export function useFunnel() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['funnel', qs],
    queryFn: () => fetchFunnel(qs),
    staleTime: 30_000,
  });
}

export function useFunnelBySegment(segment: string, segmentValue: string) {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['funnel-segment', qs, segment, segmentValue],
    queryFn: () => fetchFunnelBySegment(qs, segment, segmentValue),
    enabled: !!segment && !!segmentValue,
    staleTime: 30_000,
  });
}

// ── Growth ────────────────────────────────────────────────────────────────────
function _normGrowthPeriod(p: GrowthResponseRaw['current']) {
  return {
    label: p.period_label,
    year: p.year,
    month: p.month,
    total_uploaded: p.uploaded,
    total_published: p.published,
    uploaded_duration_hrs: p.uploaded_duration_hrs,
  };
}

export function useGrowth() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['growth', qs],
    queryFn: () => fetchGrowth(qs),
    select: (d: GrowthResponseRaw) => ({
      current: _normGrowthPeriod(d.current),
      previous: d.previous ? _normGrowthPeriod(d.previous) : null,
      mom_growth_pct: d.mom_uploaded_pct ?? null,
      rolling_30d: d.rolling_30d_uploaded,
      rolling_30d_prev: 0,
      rolling_30d_growth_pct: null as number | null,
    }),
    staleTime: 30_000,
  });
}

// ── Lag ───────────────────────────────────────────────────────────────────────
function _normLagRow(r: LagMetricsRowRaw) {
  const min2hrs = (v: number | null) => (v != null ? Math.round((v / 60) * 100) / 100 : null);
  return {
    group_by: r.segment_type ?? null,
    group_value: r.segment ?? null,
    count: r.count,
    avg_processing_lag_hrs: min2hrs(r.avg_processing_lag_min),
    median_processing_lag_hrs: min2hrs(r.median_processing_lag_min),
    p90_processing_lag_hrs: min2hrs(r.p90_processing_lag_min),
    avg_publishing_lag_hrs: min2hrs(r.avg_publishing_lag_min),
    avg_cycle_lag_hrs: min2hrs(r.avg_cycle_lag_min),
  };
}

export function useLag() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['lag', qs],
    queryFn: () => fetchLag(qs),
    select: (d: LagResponseRaw) => ({
      overall: _normLagRow(d.overall),
      by_channel: d.by_channel.map(_normLagRow),
      by_user: d.by_user.map(_normLagRow),
    }),
    staleTime: 30_000,
  });
}

// ── Multi-Dimensional ──────────────────────────────────────────────────────────
export function useMultiDimensional(
  dim1: string,
  dim2: string,
  metric = 'uploaded',
  topN = 10,
) {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['multi-dimensional', qs, dim1, dim2, metric, topN],
    queryFn: () => fetchMultiDimensional(qs, dim1, dim2, metric, topN),
    enabled: !!dim1 && !!dim2,
    staleTime: 30_000,
  });
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export function useTeams() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['teams', qs],
    queryFn: () => fetchTeams(qs),
    staleTime: 30_000,
  });
}

// ── Channel Health ────────────────────────────────────────────────────────────
export function useChannelHealth() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['channel-health', qs],
    queryFn: () => fetchChannelHealth(qs),
    staleTime: 30_000,
  });
}

// ── User Productivity ─────────────────────────────────────────────────────────
export function useUserProductivity() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['user-productivity', qs],
    queryFn: () => fetchUserProductivity(qs),
    staleTime: 30_000,
  });
}

// ── Concentration ─────────────────────────────────────────────────────────────
export function useConcentration() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['concentration', qs],
    queryFn: () => fetchConcentration(qs),
    // Backend returns top_5_channel_share_pct / top_channels; normalise to ConcentrationResponse shape
    select: (d: any) => ({
      top5_channel_share: d.top_5_channel_share_pct ?? 0,
      top5_user_share:    d.top_5_user_share_pct    ?? 0,
      channel_pareto: (d.top_channels ?? []).map((c: any) => ({
        channel:          c.name,
        count:            c.count,
        cumulative_share: c.share_pct,
      })),
      user_pareto: (d.top_users ?? []).map((u: any) => ({
        user:             u.name,
        count:            u.count,
        cumulative_share: u.share_pct,
      })),
    }),
    staleTime: 30_000,
  });
}

// ── Quality Extended ──────────────────────────────────────────────────────────
export function useQualityExtended() {
  return useQuery({
    queryKey: ['quality-extended'],
    queryFn: fetchQualityExtended,
    staleTime: 60_000,
  });
}

// ── Quality Fields ────────────────────────────────────────────────────────────
export function useQualityFields() {
  return useQuery({
    queryKey: ['quality-fields'],
    queryFn: fetchQualityFields,
    staleTime: 60_000,
  });
}

// ── Quality Rules ─────────────────────────────────────────────────────────────
export function useQualityRules() {
  return useQuery({
    queryKey: ['quality-rules'],
    queryFn: fetchQualityRules,
    staleTime: 60_000,
  });
}

// ── Quality Issues ────────────────────────────────────────────────────────────
export function useQualityIssues(category?: string, limit = 100) {
  return useQuery({
    queryKey: ['quality-issues', category ?? 'all', limit],
    queryFn: () => fetchQualityIssues(category, limit),
    staleTime: 30_000,
  });
}

// ── Benchmarks ────────────────────────────────────────────────────────────────
export function useBenchmarks(dimension: string, metric: string) {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['benchmarks', dimension, metric, qs],
    queryFn: () => fetchBenchmarks(dimension, metric, qs),
    enabled: !!dimension && !!metric,
    staleTime: 60_000,
  });
}

// ── Growth Drivers ────────────────────────────────────────────────────────────
export function useGrowthDrivers(dimension = 'channel') {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['growth-drivers', dimension, qs],
    queryFn: () => fetchGrowthDrivers(dimension, qs),
    staleTime: 30_000,
  });
}

// ── Publishing by Channel ─────────────────────────────────────────────────────
export function usePublishingByChannel() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['publishing-by-channel', qs],
    queryFn: () => fetchPublishingByChannel(qs),
    staleTime: 30_000,
  });
}

// ── SLA Breaches ──────────────────────────────────────────────────────────────
export function useLagSlaBreaches(slaDays = 7) {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['lag-sla-breaches', slaDays, qs],
    queryFn: () => fetchLagSlaBreaches(qs, slaDays),
    staleTime: 30_000,
  });
}

// ── Backlog ───────────────────────────────────────────────────────────────────
export function useLagBacklog() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['lag-backlog', qs],
    queryFn: () => fetchLagBacklog(qs),
    staleTime: 30_000,
  });
}

// ── Aging ─────────────────────────────────────────────────────────────────────
export function useLagAging() {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['lag-aging', qs],
    queryFn: () => fetchLagAging(qs),
    staleTime: 30_000,
  });
}

// ── Video Explorer ────────────────────────────────────────────────────────────
export function useVideoExplorer(
  page = 1,
  pageSize = 50,
  search?: string,
  preset?: string,
) {
  const { filters } = useFilters();
  const qs = toApiParams(filters);
  return useQuery({
    queryKey: ['video-explorer', qs, page, pageSize, search, preset],
    queryFn: () => fetchVideoExplorer(qs, page, pageSize, search, preset),
    select: (d) => ({
      items: d.items as VideoRowExtended[],
      total: d.total,
      page: d.page,
      pageSize: d.page_size,
      totalPages: d.total_pages,
      preset: d.preset,
    }),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

// ── Registry Metrics ──────────────────────────────────────────────────────────
export function useRegistryMetrics() {
  return useQuery({
    queryKey: ['registry-metrics'],
    queryFn: fetchRegistryMetrics,
    staleTime: 300_000,
  });
}

