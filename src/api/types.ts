/** TypeScript interfaces matching backend Pydantic response schemas. */

// ── Response Envelope (Phase 4) ────────────────────────────────────────────────
export interface ResponseMetadata {
  filters_applied: Record<string, unknown>;
  generated_at: string;
  metric_definitions_used: string[];
  source_grain: string;
  caveats: string[];
  unit?: string;
  currency?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ResponseMetadata;
}

// ── KPI ────────────────────────────────────────────────────────────────────────
export interface KPIResponse {
  total_uploaded: number;
  total_created: number;
  total_published: number;
  total_processed: number;
  publish_rate: number;
  processing_rate: number;
  total_uploaded_duration_hrs: number;
  total_created_duration_hrs: number;
  total_published_duration_hrs: number;
  active_channels: number;
  active_users: number;
  active_clients: number;
  active_teams: number;
  mom_growth_pct: number | null;
  avg_clips_per_video: number;
  top_channel: string;
  top_language: string;
  dq_score: number | null;
  compare_mode?: string | null;
  compare_period_label?: string | null;
  comparison_total_uploaded?: number | null;
  comparison_total_published?: number | null;
  comparison_total_processed?: number | null;
  comparison_uploaded_duration_hrs?: number | null;
  comparison_published_duration_hrs?: number | null;
  delta_uploaded_pct?: number | null;
  delta_published_pct?: number | null;
  delta_processed_pct?: number | null;
  delta_duration_pct?: number | null;
}

// ── Monthly ────────────────────────────────────────────────────────────────────
export interface MonthlyRow {
  month_label: string;
  year: number;
  month: number;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
  avg_duration_min: number;
}

// ── Channel ────────────────────────────────────────────────────────────────────
export interface ChannelRow {
  channel: string;
  obfuscated_code: string | null;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
  avg_duration_min: number;
}

// ── User / Team ────────────────────────────────────────────────────────────────
export interface UserRow {
  user: string;
  team_name: string | null;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
  avg_duration_min: number;
}

export interface TeamRow {
  team_name: string;
  total_uploaded: number;
  total_published: number;
  total_users: number;
  uploaded_duration_hrs: number;
  published_duration_hrs: number;
  publish_rate: number;
  avg_duration_min: number;
}

// ── Language ───────────────────────────────────────────────────────────────────
export interface LanguageRow {
  iso_code: string;
  display_name: string;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
  percentage: number;
}

// ── Input Type ─────────────────────────────────────────────────────────────────
export interface InputTypeRow {
  input_type: string;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
}

// ── Output Type ────────────────────────────────────────────────────────────────
export interface OutputTypeRow {
  output_type: string;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
}

// ── Video ──────────────────────────────────────────────────────────────────────
export interface VideoRow {
  id: string;
  video_id: string | null;
  headline: string | null;
  client: string | null;
  channel: string | null;
  user: string | null;
  language: string | null;
  input_type: string | null;
  output_types: string[];
  published: boolean;
  published_platform: string | null;
  uploaded_at: number | null;
  uploaded_duration_hrs: number | null;
  created_duration_hrs: number | null;
  published_duration_hrs: number | null;
}

export interface VideoRowExtended extends VideoRow {
  client_slug?: string | null;
  team_name?: string | null;
  platform?: string | null;
  source_url?: string | null;
  published_url?: string | null;
  billable_flag?: boolean;
  processed_at?: number | null;
  published_at?: number | null;
  created_duration_hrs: number | null;
  processing_lag_min?: number | null;
  publishing_lag_min?: number | null;
  total_cycle_lag_min?: number | null;
  missing_team_flag?: boolean;
  missing_platform_flag?: boolean;
  invalid_url_flag?: boolean;
  duplicate_video_id_flag?: boolean;
  issue_category?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface VideoExplorerResponse {
  items: VideoRowExtended[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  preset?: string | null;
}

// ── Data Quality ───────────────────────────────────────────────────────────────
export interface QualityColumnReport {
  column: string;
  total_rows: number;
  null_count: number;
  null_pct: number;
  distinct_count: number;
  has_issues: boolean;
  issue_description: string | null;
  status: 'good' | 'warning' | 'critical';
}

export interface QualitySummary {
  overall_score: number;
  total_rows: number;
  columns: QualityColumnReport[];
  duplicate_video_ids: number;
  unknown_team_names: number;
}

export interface DQFieldReport {
  field: string;
  table: string;
  total_rows: number;
  null_count: number;
  null_pct: number;
  unknown_count: number;
  unknown_pct: number;
  distinct_count: number;
  status: 'good' | 'warning' | 'critical';
}

export interface DQIssueRow {
  row_id: string;
  video_id: string | null;
  headline: string | null;
  channel: string | null;
  user: string | null;
  issue_category: string;
  issue_detail: string;
  severity: 'critical' | 'warning' | 'info';
  uploaded_at: number | null;
}

export interface DQRuleResult {
  rule_id: string;
  rule_name: string;
  description: string;
  affected_count: number;
  total_rows: number;
  affected_pct: number;
  severity: 'critical' | 'warning' | 'info' | 'ok';
  category: string;
}

export interface DQRulesResponse {
  rules: DQRuleResult[];
  overall_score: number;
  total_rows: number;
  critical_count: number;
  warning_count: number;
}

// ── Processing ─────────────────────────────────────────────────────────────────
export interface DurationBucketRow {
  range: string;
  count: number;
}

// ── Dimensions ─────────────────────────────────────────────────────────────────
export interface DimensionItem {
  value: string;
  label: string;
}

export interface DimensionsResponse {
  clients: DimensionItem[];
  channels: DimensionItem[];
  users: DimensionItem[];
  teams: DimensionItem[];
  languages: DimensionItem[];
  input_types: DimensionItem[];
  output_types: DimensionItem[];
  platforms: DimensionItem[];
  billable_flag_options: DimensionItem[];
  published_flag_options: DimensionItem[];
  date_range_options: DimensionItem[];
}

// ── Forecast ────────────────────────────────────────────────────────────────────
export interface ForecastPoint {
  month_label: string;
  year: number;
  month: number;
  actual: number | null;
  forecast: number | null;
  upper: number | null;
  lower: number | null;
  is_forecast: boolean;
}

export interface ForecastResponse {
  metric: string;
  horizon_months: number;
  monthly_growth_rate: number;
  model_confidence: number;
  data: ForecastPoint[];
}

// ── Channel × User ─────────────────────────────────────────────────────────
export interface ChannelUserRow {
  channel: string;
  user: string;
  total_uploaded: number;
  total_created: number;
  total_published: number;
  uploaded_duration_hrs: number;
  created_duration_hrs: number;
  published_duration_hrs: number;
}

// ── Publishing ─────────────────────────────────────────────────────────────
export interface PublishingPlatformCount {
  channel: string;
  facebook: number;
  instagram: number;
  linkedin: number;
  reels: number;
  shorts: number;
  x: number;
  youtube: number;
  threads: number;
  total: number;
}

export interface PublishingPlatformDuration {
  channel: string;
  facebook_hrs: number;
  instagram_hrs: number;
  linkedin_hrs: number;
  reels_hrs: number;
  shorts_hrs: number;
  x_hrs: number;
  youtube_hrs: number;
  threads_hrs: number;
}

export interface QueryRequest {
  sql: string;
  limit?: number;
}

// ── Client Summary ─────────────────────────────────────────────────────────────
export interface ClientSummaryRow {
  slug: string;
  name: string;
  total_uploaded: number;
  total_published: number;
  total_clips: number;
  publish_rate: number;
  active_channels: number;
  active_users: number;
  uploaded_duration_hrs: number;
}

export interface QueryResponse {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
}

// ── Funnel ────────────────────────────────────────────────────────────────────
export interface FunnelStage {
  stage: string;
  count: number;
  duration_hrs: number;
  conversion_from_prev: number | null;
  conversion_from_first: number | null;
}

export interface FunnelResponse {
  stages: FunnelStage[];
  publish_gap_count: number;
  publish_gap_duration_hrs: number;
}

// ── Growth ────────────────────────────────────────────────────────────────────
export interface GrowthPeriodRaw {
  period_label: string;
  year: number;
  month: number;
  uploaded: number;
  processed: number;
  published: number;
  uploaded_duration_hrs: number;
  published_duration_hrs: number;
}

export interface GrowthResponseRaw {
  current: GrowthPeriodRaw;
  previous: GrowthPeriodRaw | null;
  compare_mode: string;
  mom_uploaded_pct: number | null;
  mom_published_pct: number | null;
  mom_duration_pct: number | null;
  rolling_30d_uploaded: number;
  rolling_30d_published: number;
  rolling_30d_prev_uploaded: number;
}

export interface GrowthPeriod {
  label: string;
  year: number;
  month: number;
  total_uploaded: number;
  total_published: number;
  uploaded_duration_hrs: number;
}

export interface GrowthResponse {
  current: GrowthPeriod;
  previous: GrowthPeriod | null;
  mom_growth_pct: number | null;
  rolling_30d: number;
  rolling_30d_prev: number;
  rolling_30d_growth_pct: number | null;
}

export interface GrowthDriverRow {
  segment: string;
  current_value: number;
  prev_value: number;
  delta: number;
  share_of_total_delta: number;
}

export interface GrowthDriversResponse {
  dimension: string;
  period_current: string;
  period_prev: string;
  total_delta: number;
  drivers: GrowthDriverRow[];
}

// ── Lag ───────────────────────────────────────────────────────────────────────
export interface LagMetricsRowRaw {
  segment: string | null;
  segment_type: string | null;
  count: number;
  avg_processing_lag_min: number | null;
  median_processing_lag_min: number | null;
  p90_processing_lag_min: number | null;
  avg_publishing_lag_min: number | null;
  median_publishing_lag_min: number | null;
  p90_publishing_lag_min: number | null;
  avg_cycle_lag_min: number | null;
}

export interface LagResponseRaw {
  overall: LagMetricsRowRaw;
  by_channel: LagMetricsRowRaw[];
  by_user: LagMetricsRowRaw[];
}

export interface LagMetricsRow {
  group_by: string | null;
  group_value: string | null;
  count: number;
  avg_processing_lag_hrs: number | null;
  median_processing_lag_hrs: number | null;
  p90_processing_lag_hrs: number | null;
  avg_publishing_lag_hrs: number | null;
  avg_cycle_lag_hrs: number | null;
}

export interface LagResponse {
  overall: LagMetricsRow;
  by_channel: LagMetricsRow[];
  by_user: LagMetricsRow[];
}

// ── SLA Breaches ──────────────────────────────────────────────────────────────
export interface SLABreachRow {
  segment: string;
  segment_type: string;
  breach_count: number;
  total_count: number;
  breach_pct: number;
  avg_lag_min: number | null;
  sla_threshold_days: number;
}

export interface SLABreachResponse {
  sla_threshold_days: number;
  overall_breach_count: number;
  overall_breach_pct: number;
  by_channel: SLABreachRow[];
  by_user: SLABreachRow[];
  by_client: SLABreachRow[];
}

// ── Backlog / Aging ───────────────────────────────────────────────────────────
export interface AgingBucket {
  bucket_label: string;
  min_days: number;
  max_days: number | null;
  count: number;
  pct: number;
}

export interface BacklogItem {
  row_id: string;
  video_id: string | null;
  headline: string | null;
  client: string | null;
  channel: string | null;
  user: string | null;
  uploaded_at: number | null;
  days_in_backlog: number;
}

export interface BacklogResponse {
  total_backlog: number;
  oldest_days: number;
  avg_days: number;
  buckets: AgingBucket[];
  oldest_items: BacklogItem[];
}

export interface AgingResponse {
  buckets: AgingBucket[];
  total_backlog: number;
  oldest_item: BacklogItem | null;
}

// ── Multi-Dimensional ──────────────────────────────────────────────────────────
export interface MultiDimensionalCell {
  dim1: string;
  dim2: string;
  uploaded: number;
  published: number;
  duration_hrs: number;
  publish_conversion_pct: number;
  contribution_pct: number;
}

export interface MultiDimensionalResponse {
  dim1: string;
  dim2: string;
  metric: string;
  cells: MultiDimensionalCell[];
  dim1_values: string[];
  dim2_values: string[];
}

// ── Analytics: Channel Health ─────────────────────────────────────────────────
export interface ChannelHealthRow {
  channel: string;
  obfuscated_code: string | null;
  total_uploaded: number;
  total_published: number;
  publish_conversion_pct: number;
  avg_duration_min: number;
  processed_not_published: number;
  health_quadrant: 'star' | 'high_volume' | 'high_efficiency' | 'underperforming';
  health_score: number;
}

// ── Analytics: User Productivity ──────────────────────────────────────────────
export interface UserProductivityRow {
  user: string;
  team_name: string | null;
  total_uploaded: number;
  total_published: number;
  publish_conversion_pct: number;
  uploaded_duration_hrs: number;
  avg_duration_min: number;
  productivity_index: number;
}

// ── Analytics: Concentration ──────────────────────────────────────────────────
export interface ConcentrationChannelItem {
  name: string;
  count: number;
  share_pct: number;
}

export interface ConcentrationResponse {
  total: number;
  top_5_channel_share_pct: number;
  top_5_user_share_pct: number;
  top_channels: ConcentrationChannelItem[];
  top_users: ConcentrationChannelItem[];
}

// ── Benchmarks ────────────────────────────────────────────────────────────────
export interface BenchmarkSegmentRow {
  segment: string;
  segment_type: string;
  metric: string;
  value: number;
  portfolio_avg: number;
  peer_avg: number;
  percentile: number;
  trend_delta: number | null;
}

export interface BenchmarkResponse {
  dimension: string;
  metric: string;
  segments: BenchmarkSegmentRow[];
  portfolio_avg: number;
  portfolio_median: number;
}

// ── Quality Extended ──────────────────────────────────────────────────────────
export interface QualityTrendPoint {
  month_label: string;
  year: number;
  month: number;
  total_rows: number;
  null_channel_pct: number;
  null_user_pct: number;
  null_language_pct: number;
  null_input_type_pct: number;
  overall_score: number;
}

export interface QualityExtendedResponse {
  trend: QualityTrendPoint[];
  by_client: {
    client: string;
    total: number;
    null_channel_pct: number;
    null_user_pct: number;
    null_language_pct: number;
    null_platform_pct: number;
    invalid_url_pct: number;
  }[];
  invalid_url_count: number;
  duplicate_job_id_count: number;
  unknown_language_pct: number;
  unknown_input_type_pct: number;
  unknown_output_type_pct: number;
  null_platform_pct: number;
}

// ── Registry ──────────────────────────────────────────────────────────────────
export interface RegistryMetric {
  name: string;
  label: string;
  formula_sql: string | null;
  numerator: string | null;
  denominator: string | null;
  source_tables: string[];
  caveats: string[];
  valid_dimensions: string[] | 'all';
  valid_time_grains: string[];
  null_handling: string;
  requires_bridge: boolean;
  is_proxy: boolean;
  proxy_note: string | null;
}

export interface RegistryDimension {
  name: string;
  label: string;
  join_template: string;
  name_col_template: string;
  filter_col: string;
  filter_lookup_sql: string | null;
  filter_param: string;
  db_table: string;
  supports_bridge: boolean;
  is_direct: boolean;
  is_flag: boolean;
}
