/** Typed API endpoint functions. */
import { apiFetch, apiPost, apiPostWithMeta } from './client';
import type {
  KPIResponse,
  MonthlyRow,
  ChannelRow,
  ChannelUserRow,
  UserRow,
  LanguageRow,
  InputTypeRow,
  OutputTypeRow,
  VideoRow,
  VideoExplorerResponse,
  PaginatedResponse,
  QualitySummary,
  DurationBucketRow,
  DimensionsResponse,
  ForecastResponse,
  QueryRequest,
  QueryResponse,
  ClientSummaryRow,
  FunnelResponse,
  GrowthResponseRaw,
  LagResponseRaw,
  MultiDimensionalResponse,
  TeamRow,
  ChannelHealthRow,
  UserProductivityRow,
  ConcentrationResponse,
  QualityExtendedResponse,
  SLABreachResponse,
  BacklogResponse,
  AgingResponse,
  DQFieldReport,
  DQRulesResponse,
  DQIssueRow,
  BenchmarkResponse,
  GrowthDriversResponse,
  PublishingPlatformCount,
  RegistryMetric,
  AgentQueryRequest,
  AgentPlanResponse,
  AgentQueryResponse,
  EmailSendResponse,
  SendReportRequest,
  SendTestEmailRequest,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionResponse,
  AlertRuleCreate,
  AlertRuleUpdate,
  AlertRuleResponse,
  DeliveryLogPage,
} from './types';

// Domain-prefixed canonical paths (Phase 4)
const CORE    = '/api/v1/core';
const TRENDS  = '/api/v1/trends';
const PERF    = '/api/v1/performance';
const FUNNEL  = '/api/v1/funnel-efficiency';
const CONTENT = '/api/v1/content';
const DIAG    = '/api/v1/diagnostics';
const DETAIL  = '/api/v1/detail';
const AGENT   = '/api/v1/agent';

// ── Core ───────────────────────────────────────────────────────────────────────
export const fetchKpis = (qs: string) =>
  apiFetch<KPIResponse>(`${CORE}/kpis${qs ? '?' + qs : ''}`);

export const fetchDimensions = () =>
  apiFetch<DimensionsResponse>(`${CORE}/dimensions`);

export const fetchRegistryMetrics = () =>
  apiFetch<RegistryMetric[]>(`${CORE}/registry/metrics`);

// ── Trends ─────────────────────────────────────────────────────────────────────
export const fetchMonthly = (qs: string) =>
  apiFetch<MonthlyRow[]>(`${TRENDS}/monthly${qs ? '?' + qs : ''}`);

export const fetchGrowth = (qs: string) =>
  apiFetch<GrowthResponseRaw>(`${TRENDS}/growth${qs ? '?' + qs : ''}`);

export const fetchForecast = (metric: string, horizon = 6, qs = '') =>
  apiFetch<ForecastResponse>(`${TRENDS}/forecast/${metric}?horizon=${horizon}${qs ? '&' + qs : ''}`);

export const fetchGrowthDrivers = (dimension: string, qs: string) =>
  apiFetch<GrowthDriversResponse>(
    `${TRENDS}/growth/drivers?dim=${encodeURIComponent(dimension)}${qs ? '&' + qs : ''}`
  );

// ── Performance ────────────────────────────────────────────────────────────────
export const fetchChannels = (qs: string) =>
  apiFetch<ChannelRow[]>(`${PERF}/channels${qs ? '?' + qs : ''}`);

export const fetchChannelUsers = (channel?: string) => {
  const qs = channel ? `?channel=${encodeURIComponent(channel)}` : '';
  return apiFetch<ChannelUserRow[]>(`${PERF}/channels/users${qs}`);
};

export const fetchUsers = (qs: string) =>
  apiFetch<UserRow[]>(`${PERF}/users${qs ? '?' + qs : ''}`);

export const fetchTeams = (qs: string) =>
  apiFetch<TeamRow[]>(`${PERF}/teams${qs ? '?' + qs : ''}`);

export const fetchClientsSummary = (qs: string) =>
  apiFetch<ClientSummaryRow[]>(`${PERF}/clients/summary${qs ? '?' + qs : ''}`);

export const fetchChannelHealth = (qs: string) =>
  apiFetch<ChannelHealthRow[]>(`${PERF}/analytics/channel-health${qs ? '?' + qs : ''}`);

export const fetchUserProductivity = (qs: string) =>
  apiFetch<UserProductivityRow[]>(`${PERF}/analytics/user-productivity${qs ? '?' + qs : ''}`);

// ── Funnel & Efficiency ────────────────────────────────────────────────────────
export const fetchFunnel = (qs: string) =>
  apiFetch<FunnelResponse>(`${FUNNEL}/funnel${qs ? '?' + qs : ''}`);

export const fetchFunnelBySegment = (qs: string, segment: string, segmentValue: string) => {
  const params = new URLSearchParams(qs);
  params.set('segment', segment);
  params.set('segment_value', segmentValue);
  return apiFetch<FunnelResponse>(`${FUNNEL}/funnel/by-segment?${params.toString()}`);
};

export const fetchLag = (qs: string) =>
  apiFetch<LagResponseRaw>(`${FUNNEL}/lag${qs ? '?' + qs : ''}`);

export const fetchLagSlaBreaches = (qs: string, slaDays = 7) =>
  apiFetch<SLABreachResponse>(
    `${FUNNEL}/lag/sla-breaches?sla_days=${slaDays}${qs ? '&' + qs : ''}`
  );

export const fetchPublishingByChannel = (qs: string) =>
  apiFetch<PublishingPlatformCount[]>(`${FUNNEL}/publishing/by-channel${qs ? '?' + qs : ''}`);

export const fetchDurationBuckets = () =>
  apiFetch<DurationBucketRow[]>(`${FUNNEL}/processing/duration-buckets`);

// ── Content ────────────────────────────────────────────────────────────────────
export const fetchInputTypes = (qs: string) =>
  apiFetch<InputTypeRow[]>(`${CONTENT}/input-types${qs ? '?' + qs : ''}`);

export const fetchOutputTypes = (qs: string) =>
  apiFetch<OutputTypeRow[]>(`${CONTENT}/output-types${qs ? '?' + qs : ''}`);

export const fetchLanguages = (qs: string) =>
  apiFetch<LanguageRow[]>(`${CONTENT}/languages${qs ? '?' + qs : ''}`);

// ── Multi-Dimensional ──────────────────────────────────────────────────────────
export const fetchMultiDimensional = (
  qs: string,
  dim1: string,
  dim2: string,
  metric = 'uploaded',
  topN = 10,
) => {
  const params = new URLSearchParams(qs);
  params.set('dim1', dim1);
  params.set('dim2', dim2);
  params.set('metric', metric);
  params.set('top_n', String(topN));
  return apiFetch<MultiDimensionalResponse>(`${DETAIL}/multi-dimensional?${params.toString()}`);
};

// ── Diagnostics ────────────────────────────────────────────────────────────────
export const fetchQualitySummary = () =>
  apiFetch<QualitySummary>(`${DIAG}/quality/summary`);

export const fetchQualityExtended = () =>
  apiFetch<QualityExtendedResponse>(`${DIAG}/quality/extended`);

export const fetchQualityFields = () =>
  apiFetch<DQFieldReport[]>(`${DIAG}/quality/fields`);

export const fetchQualityRules = () =>
  apiFetch<DQRulesResponse>(`${DIAG}/quality/rules`);

export const fetchQualityIssues = (category?: string, limit = 100) => {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  params.set('limit', String(limit));
  return apiFetch<DQIssueRow[]>(`${DIAG}/quality/issues?${params.toString()}`);
};

export const fetchConcentration = (qs: string) =>
  apiFetch<ConcentrationResponse>(`${DIAG}/concentration${qs ? '?' + qs : ''}`);

export const fetchBenchmarks = (dimension: string, metric: string, qs: string) =>
  apiFetch<BenchmarkResponse>(
    `${DIAG}/benchmarks/${encodeURIComponent(dimension)}?metric=${encodeURIComponent(metric)}${qs ? '&' + qs : ''}`
  );

export const fetchLagBacklog = (qs: string) =>
  apiFetch<BacklogResponse>(`${DIAG}/backlog${qs ? '?' + qs : ''}`);

export const fetchLagAging = (qs: string) =>
  apiFetch<AgingResponse>(`${DIAG}/aging${qs ? '?' + qs : ''}`);

// ── Detail / Query ─────────────────────────────────────────────────────────────
export const fetchVideos = (
  qs: string,
  page = 1,
  pageSize = 50,
  search?: string,
) => {
  const params = new URLSearchParams(qs);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (search) params.set('search', search);
  return apiFetch<PaginatedResponse<VideoRow>>(`${DETAIL}/videos?${params.toString()}`);
};

export const fetchVideoExplorer = (
  qs: string,
  page = 1,
  pageSize = 50,
  search?: string,
  preset?: string,
) => {
  const params = new URLSearchParams(qs);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (search) params.set('search', search);
  if (preset) params.set('preset', preset);
  return apiFetch<VideoExplorerResponse>(`${DETAIL}/videos/explorer?${params.toString()}`);
};

export const runQuery = (req: QueryRequest) =>
  apiPost<QueryResponse>(`${DETAIL}/query`, req);

export const planAgentQuery = (req: AgentQueryRequest, qs = '') =>
  apiPostWithMeta<AgentPlanResponse>(`${AGENT}/plan${qs ? '?' + qs : ''}`, req);

export const runAgentQuery = (req: AgentQueryRequest, qs = '') =>
  apiPostWithMeta<AgentQueryResponse>(`${AGENT}/query${qs ? '?' + qs : ''}`, req);

// ── Notifications ──────────────────────────────────────────────────────────────
const NOTIF = '/api/v1/notifications';

export const sendReport = (req: SendReportRequest) =>
  apiPost<EmailSendResponse>(`${NOTIF}/email/send-report`, req);

export const sendTestEmail = (req: SendTestEmailRequest) =>
  apiPost<EmailSendResponse>(`${NOTIF}/email/send-test`, req);

// Subscriptions
export const fetchSubscriptions = () =>
  apiFetch<SubscriptionResponse[]>(`${NOTIF}/subscriptions`);

export const createSubscription = (body: SubscriptionCreate) =>
  apiPost<SubscriptionResponse>(`${NOTIF}/subscriptions`, body);

export const updateSubscription = (id: string, body: SubscriptionUpdate) =>
  apiFetch<SubscriptionResponse>(`${NOTIF}/subscriptions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteSubscription = (id: string) =>
  apiFetch<void>(`${NOTIF}/subscriptions/${id}`, { method: 'DELETE' });

// Alert rules
export const fetchAlertRules = () =>
  apiFetch<AlertRuleResponse[]>(`${NOTIF}/alerts`);

export const createAlertRule = (body: AlertRuleCreate) =>
  apiPost<AlertRuleResponse>(`${NOTIF}/alerts`, body);

export const updateAlertRule = (id: string, body: AlertRuleUpdate) =>
  apiFetch<AlertRuleResponse>(`${NOTIF}/alerts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });

export const deleteAlertRule = (id: string) =>
  apiFetch<void>(`${NOTIF}/alerts/${id}`, { method: 'DELETE' });

// Delivery logs
export const fetchDeliveryLogs = (page = 1, pageSize = 50, subscriptionId?: string) => {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (subscriptionId) params.set('subscription_id', subscriptionId);
  return apiFetch<DeliveryLogPage>(`${NOTIF}/delivery-logs?${params}`);
};
