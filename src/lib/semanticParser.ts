/**
 * semanticParser — client-side semantic query layer.
 *
 * Parses plain-English questions into structured query plans that can be
 * executed against the backend.
 *
 * Pipeline:
 *  1. Tokenize the question
 *  2. Map tokens → metric keys (via metric registry + synonym map)
 *  3. Map tokens → dimension keys
 *  4. Detect time range
 *  5. Detect extra filters
 *  6. Choose chart type rule
 *  7. Generate logical SQL plan
 *  8. Return ParseResult with confidence score
 */

import type { RegistryMetric } from '@/api/types';

// ── Built-in synonym maps ─────────────────────────────────────────────────────

const METRIC_SYNONYMS: Record<string, string> = {
  // uploaded
  'uploaded': 'total_uploaded',
  'uploads': 'total_uploaded',
  'videos': 'total_uploaded',
  'video count': 'total_uploaded',
  'input': 'total_uploaded',
  'ingest': 'total_uploaded',

  // published
  'published': 'total_published',
  'publishes': 'total_published',
  'output': 'total_published',
  'clips published': 'total_published',

  // processed
  'processed': 'total_processed',
  'processing': 'total_processed',

  // duration
  'hours': 'uploaded_duration_hrs',
  'duration': 'uploaded_duration_hrs',
  'hours processed': 'uploaded_duration_hrs',
  'content hours': 'uploaded_duration_hrs',

  // rates
  'publish rate': 'publish_rate',
  'publishing rate': 'publish_rate',
  'conversion rate': 'publish_rate',
  'publish conversion': 'publish_conversion_pct',

  // lag
  'lag': 'avg_processing_lag_min',
  'processing lag': 'avg_processing_lag_min',
  'delay': 'avg_processing_lag_min',
  'turnaround': 'avg_publishing_lag_min',

  // quality
  'quality': 'dq_score',
  'dq score': 'dq_score',
  'data quality': 'dq_score',
  'quality score': 'dq_score',

  // growth
  'growth': 'mom_growth_pct',
  'growth rate': 'mom_growth_pct',
  'month over month': 'mom_growth_pct',
  'mom': 'mom_growth_pct',
};

const DIMENSION_SYNONYMS: Record<string, string> = {
  'channel': 'channel',
  'channels': 'channel',
  'client': 'client',
  'clients': 'client',
  'language': 'language',
  'languages': 'language',
  'user': 'user',
  'users': 'user',
  'team': 'team_name',
  'teams': 'team_name',
  'input type': 'input_type',
  'content type': 'input_type',
  'output type': 'output_type',
  'clip type': 'output_type',
  'platform': 'published_platform',
  'platforms': 'published_platform',
  'month': 'month',
  'monthly': 'month',
  'over time': 'month',
  'time': 'month',
  'trend': 'month',
};

const TIME_RANGE_SYNONYMS: Record<string, string> = {
  'last 7 days':    'last_7d',
  'last week':      'last_7d',
  'last 30 days':   'last_30d',
  'last month':     'last_30d',
  'this month':     'last_30d',
  'last 90 days':   'last_90d',
  'last quarter':   'last_90d',
  'last 3 months':  'last_90d',
  'last 6 months':  'last_180d',
  'last year':      'last_365d',
  'this year':      'last_365d',
  'all time':       'all',
  'all':            'all',
};

// ── Chart type selection rules ────────────────────────────────────────────────

type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'table';

function selectChartType(dimension: string | null, metric: string | null): ChartType {
  if (dimension === 'month') return 'line';
  if (!dimension) return 'table';
  if (['channel', 'client', 'user', 'team_name', 'input_type', 'output_type'].includes(dimension ?? '')) return 'bar';
  if (dimension === 'language') return 'pie';
  return 'bar';
}

// ── SQL generation ────────────────────────────────────────────────────────────

function generateSQL(
  metric: string,
  dimension: string | null,
  dateRange: string,
  filters: Record<string, string>,
): string {
  const metricCol = metric === 'total_uploaded' ? 'COUNT(*)'
    : metric === 'total_published' ? 'SUM(CASE WHEN published_flag=true THEN 1 ELSE 0 END)'
    : metric === 'uploaded_duration_hrs' ? 'SUM(duration_min / 60.0)'
    : metric === 'publish_rate' ? 'AVG(CASE WHEN published_flag=true THEN 1.0 ELSE 0 END)'
    : `AVG(${metric})`;

  const groupBy = dimension && dimension !== 'month' ? `, ${dimension}` : '';
  const orderByClause = dimension === 'month'
    ? 'ORDER BY year, month'
    : `ORDER BY ${metricCol.includes('(') ? metricCol : metric} DESC`;

  const whereParts: string[] = [];
  if (dateRange && dateRange !== 'all') {
    const daysMap: Record<string, number> = { last_7d: 7, last_30d: 30, last_90d: 90, last_180d: 180, last_365d: 365 };
    const days = daysMap[dateRange];
    if (days) whereParts.push(`uploaded_at >= NOW() - INTERVAL '${days} days'`);
  }
  for (const [k, v] of Object.entries(filters)) {
    whereParts.push(`${k} = '${v}'`);
  }
  const where = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

  const selectDim = dimension === 'month'
    ? "TO_CHAR(uploaded_at, 'Mon YYYY') AS month_label, EXTRACT(YEAR FROM uploaded_at) AS year, EXTRACT(MONTH FROM uploaded_at) AS month,"
    : dimension
      ? `${dimension},`
      : '';

  return `SELECT ${selectDim} ${metricCol} AS ${metric}
FROM videos
${where}
GROUP BY ${dimension === 'month' ? 'year, month, month_label' : dimension ?? '1'}
${orderByClause}
LIMIT 50;`.trim();
}

// ── Main parse function ───────────────────────────────────────────────────────

export interface ParseResult {
  /** The detected metric key */
  metric: string | null;
  /** Human-readable metric label */
  metricLabel: string;
  /** The detected dimension key */
  dimension: string | null;
  /** Human-readable dimension label */
  dimensionLabel: string;
  /** Detected date range */
  dateRange: string;
  /** Detected extra filter key→value pairs */
  filters: Record<string, string>;
  /** Chart type recommendation */
  chartType: ChartType;
  /** Natural language interpretation */
  interpreted: string;
  /** Logical SQL plan */
  sql: string;
  /** Confidence 0–100 */
  confidence: number;
  /** Ambiguity messages */
  ambiguities: string[];
  /** Did-you-mean suggestions */
  suggestions: string[];
}

function tokenize(text: string): string[] {
  return text.toLowerCase().trim().replace(/[^a-z0-9% ]/g, ' ').split(/\s+/).filter(Boolean);
}

function longestMatch(text: string, dict: Record<string, string>): [string, string] | null {
  const sorted = Object.keys(dict).sort((a, b) => b.length - a.length);
  for (const phrase of sorted) {
    if (text.includes(phrase)) return [phrase, dict[phrase]];
  }
  return null;
}

export function parseQuestion(
  question: string,
  registryMetrics?: RegistryMetric[],
): ParseResult {
  const lower = question.toLowerCase().trim();
  const ambiguities: string[] = [];
  const suggestions: string[] = [];
  let confidence = 50;

  // Build extended metric map from registry
  const metricMap: Record<string, string> = { ...METRIC_SYNONYMS };
  if (registryMetrics) {
    for (const m of registryMetrics) {
      metricMap[m.label.toLowerCase()] = m.name;
      metricMap[m.name.toLowerCase()] = m.name;
    }
  }

  // 1. Detect metric
  const metricMatch = longestMatch(lower, metricMap);
  const metric      = metricMatch ? metricMatch[1] : null;
  const metricLabel = metricMatch
    ? registryMetrics?.find(m => m.name === metric)?.label ?? metricMatch[0]
    : 'unknown metric';

  if (!metricMatch) {
    ambiguities.push('Could not identify a metric in your question.');
    suggestions.push('Try phrases like "uploaded videos", "published clips", "processing lag"');
    confidence -= 20;
  } else {
    confidence += 20;
  }

  // 2. Detect dimension
  const dimMatch    = longestMatch(lower, DIMENSION_SYNONYMS);
  const dimension   = dimMatch ? dimMatch[1] : null;
  const dimensionLabel = dimMatch ? dimMatch[0] : 'none';

  if (dimMatch) confidence += 15;

  // 3. Detect time range
  const timeMatch = longestMatch(lower, TIME_RANGE_SYNONYMS);
  const dateRange = timeMatch ? timeMatch[1] : 'last_30d';
  if (timeMatch) confidence += 10;

  // 4. Detect extra filters
  const filters: Record<string, string> = {};
  const byChannelMatch = lower.match(/(?:for|by|channel)\s+([a-z0-9_-]+)/);
  if (byChannelMatch) {
    filters['channel'] = byChannelMatch[1];
    confidence += 5;
  }
  const byClientMatch = lower.match(/(?:client)\s+([a-z0-9_-]+)/);
  if (byClientMatch) {
    filters['client_slug'] = byClientMatch[1];
    confidence += 5;
  }

  // 5. Chart type
  const chartType = selectChartType(dimension, metric);

  // 6. Generate SQL
  const sql = metric
    ? generateSQL(metric, dimension, dateRange, filters)
    : '-- Cannot generate SQL: metric not detected';

  // 7. Build interpretation
  const parts: string[] = [];
  if (metric) parts.push(`metric: **${metricLabel}**`);
  if (dimension && dimension !== 'month') parts.push(`grouped by **${dimensionLabel}**`);
  if (dimension === 'month') parts.push('as a **time series**');
  if (dateRange !== 'all') {
    const labelMap: Record<string, string> = {
      last_7d: 'last 7 days', last_30d: 'last 30 days',
      last_90d: 'last 90 days', last_180d: 'last 6 months', last_365d: 'last year',
    };
    parts.push(`for **${labelMap[dateRange] ?? dateRange}**`);
  }
  if (Object.keys(filters).length > 0) {
    parts.push(`filtered to ${Object.entries(filters).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  }

  const interpreted = parts.length > 0
    ? `Showing ${parts.join(', ')}`
    : 'Unable to interpret question — please try rephrasing';

  confidence = Math.min(100, Math.max(0, confidence));

  // Low confidence suggestions
  if (confidence < 50 && registryMetrics) {
    const sample = registryMetrics.slice(0, 3).map(m => `"${m.label}"`).join(', ');
    suggestions.push(`Try using specific metric names like ${sample}`);
  }

  return {
    metric,
    metricLabel,
    dimension,
    dimensionLabel,
    dateRange,
    filters,
    chartType,
    interpreted,
    sql,
    confidence,
    ambiguities,
    suggestions,
  };
}

// ── Knowledge base ────────────────────────────────────────────────────────────

export const EXAMPLE_PROMPTS = [
  'Show uploaded videos by channel last 30 days',
  'What is the publish rate trend over time?',
  'Top users by productivity index last 90 days',
  'Processing lag by channel',
  'Language distribution of published content',
  'DQ score trend over the last year',
  'Uploaded hours by client',
  'Compare publish conversion rates by output type',
];

export const CHART_RULES = [
  { rule: 'Use line chart when dimension is time (month, week)', chartType: 'line' },
  { rule: 'Use bar chart for categorical dimensions (channel, user, type)', chartType: 'bar' },
  { rule: 'Use pie chart for distribution (language, output type as share)', chartType: 'pie' },
  { rule: 'Use scatter for quadrant analysis (volume vs conversion)', chartType: 'scatter' },
  { rule: 'Default to table when no clear dimension', chartType: 'table' },
];
