import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  Activity,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowRight,
  GitCompare,
  Hash,
  Timer,
  Percent,
} from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { useMonthly, useGrowth, useLag, useKpis, useChannels } from '@/hooks/useApi';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type MetricMode = 'count' | 'duration' | 'conversion';

interface InsightCard {
  title: string;
  body: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label, unit = '' }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl z-50">
      {label && <p className="text-[#71717A] mb-1 font-medium">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mt-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color ?? p.fill }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">
            {typeof p.value === 'number'
              ? `${p.value.toLocaleString()}${unit}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/** 3-month rolling average */
function withRollingAvg<T extends Record<string, any>>(
  rows: T[],
  key: string,
  window = 3,
): (T & { rollingAvg: number | null })[] {
  return rows.map((row, i) => {
    if (i < window - 1) return { ...row, rollingAvg: null };
    const slice = rows.slice(i - window + 1, i + 1);
    const avg = slice.reduce((s, r) => s + (r[key] ?? 0), 0) / window;
    return { ...row, rollingAvg: Math.round(avg * 10) / 10 };
  });
}

/** Z-score anomaly: returns months with |z| > threshold as anomaly markers */
function anomalyMonths(
  rows: { month: string; value: number }[],
  threshold = 1.6,
): Set<string> {
  if (rows.length < 4) return new Set();
  const mean = rows.reduce((s, r) => s + r.value, 0) / rows.length;
  const std = Math.sqrt(rows.reduce((s, r) => s + (r.value - mean) ** 2, 0) / rows.length);
  if (std === 0) return new Set();
  return new Set(rows.filter((r) => Math.abs((r.value - mean) / std) > threshold).map((r) => r.month));
}

function pctChange(curr: number, prev: number) {
  if (!prev) return null;
  return ((curr - prev) / prev) * 100;
}

function insightColor(type: InsightCard['type']) {
  return {
    positive: 'border-green-600/40 bg-green-950/20 text-green-400',
    negative: 'border-red-600/40 bg-red-950/20 text-red-400',
    warning: 'border-amber-600/40 bg-amber-950/20 text-amber-400',
    neutral: 'border-zinc-600/40 bg-zinc-900/30 text-zinc-400',
  }[type];
}

// ─────────────────────────────────────────────────────────────────────────────
// MetricToggle component
// ─────────────────────────────────────────────────────────────────────────────
const MetricToggle: React.FC<{
  value: MetricMode;
  onChange: (m: MetricMode) => void;
}> = ({ value, onChange }) => {
  const opts: { key: MetricMode; label: string; icon: React.ReactNode }[] = [
    { key: 'count', label: 'Count', icon: <Hash size={12} /> },
    { key: 'duration', label: 'Duration', icon: <Timer size={12} /> },
    { key: 'conversion', label: 'Conversion', icon: <Percent size={12} /> },
  ];
  return (
    <div className="flex items-center gap-1 bg-[#18181B] border border-[#27272A] rounded-md p-0.5">
      {opts.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            value === o.key
              ? 'bg-[#27272A] text-white'
              : 'text-[#71717A] hover:text-[#A1A1AA]'
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// InsightPanel
// ─────────────────────────────────────────────────────────────────────────────
const InsightPanel: React.FC<{ cards: InsightCard[] }> = ({ cards }) => {
  const [open, setOpen] = useState(false);
  if (!cards.length) return null;
  return (
    <div className="mb-4 rounded-lg border border-[#27272A] bg-[#0F0F0F] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[#A1A1AA] hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Activity size={14} className="text-amber-400" />
          Why did it change? — {cards.length} insight{cards.length !== 1 ? 's' : ''} detected
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cards.map((c, i) => (
                <div key={i} className={`rounded-md border px-3 py-2.5 text-xs ${insightColor(c.type)}`}>
                  <p className="font-semibold mb-1">{c.title}</p>
                  <p className="opacity-80 leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
const UsageTrends: React.FC = () => {
  const [metricMode, setMetricMode] = useState<MetricMode>('count');
  const [compareOpen, setCompareOpen] = useState(false);

  const { data: monthly } = useMonthly();
  const { data: growth } = useGrowth();
  const { data: lag } = useLag();
  const { data: kpis } = useKpis();
  const { data: channels } = useChannels();

  // ── Core trend data ────────────────────────────────────────────────────────
  const rawTrend = useMemo(() => {
    if (!monthly) return [];
    return monthly.map((r) => ({
      month: r.month,
      uploaded: r.videosProcessed,
      published: r.videosPublished,
      clips: r.clipsGenerated,
      uploadedHrs: Math.round((r.hoursProcessed ?? 0) * 10) / 10,
      publishedHrs: Math.round((r._raw?.published_duration_hrs ?? 0) * 10) / 10,
      clipsHrs: Math.round((r._raw?.created_duration_hrs ?? 0) * 10) / 10,
      publishConvPct:
        r.videosProcessed > 0
          ? Math.round((r.videosPublished / r.videosProcessed) * 1000) / 10
          : 0,
    }));
  }, [monthly]);

  // Rolling avg (applied to the primary metric key for the current mode)
  const trendData = useMemo(() => {
    const key =
      metricMode === 'count'
        ? 'uploaded'
        : metricMode === 'duration'
          ? 'uploadedHrs'
          : 'publishConvPct';
    return withRollingAvg(rawTrend, key, 3);
  }, [rawTrend, metricMode]);

  // Anomaly months for primary metric
  const anomalySet = useMemo(() => {
    const key =
      metricMode === 'count'
        ? 'uploaded'
        : metricMode === 'duration'
          ? 'uploadedHrs'
          : 'publishConvPct';
    return anomalyMonths(trendData.map((r) => ({ month: r.month, value: r[key] ?? 0 })));
  }, [trendData, metricMode]);

  // ── KPI summary ────────────────────────────────────────────────────────────
  const momPct = growth?.mom_growth_pct ?? null;
  const rolling30Pct = growth?.rolling_30d_growth_pct ?? null;
  const avgProcessingHrs = lag?.overall?.avg_processing_lag_hrs ?? null;

  // Publish rate derived from latest month
  const latestMonth = rawTrend[rawTrend.length - 1];
  const prevMonth = rawTrend[rawTrend.length - 2];
  const publishRateDelta =
    latestMonth && prevMonth
      ? pctChange(latestMonth.publishConvPct, prevMonth.publishConvPct)
      : null;

  // Volume delta (uploaded) last vs prev month
  const volumeDelta =
    latestMonth && prevMonth
      ? pctChange(latestMonth.uploaded, prevMonth.uploaded)
      : null;

  // Duration delta
  const durationDelta =
    latestMonth && prevMonth
      ? pctChange(latestMonth.uploadedHrs, prevMonth.uploadedHrs)
      : null;

  // ── Period comparison chart data ───────────────────────────────────────────
  const compareData = useMemo(() => {
    if (!growth?.current || !growth.previous) return [];
    const curr = growth.current;
    const prev = growth.previous;
    return [
      {
        metric: 'Uploaded',
        current: curr.total_uploaded,
        previous: prev.total_uploaded,
      },
      {
        metric: 'Published',
        current: curr.total_published,
        previous: prev.total_published,
      },
      {
        metric: 'Duration (hrs)',
        current: Math.round(curr.uploaded_duration_hrs),
        previous: Math.round(prev.uploaded_duration_hrs),
      },
    ];
  }, [growth]);

  // ── Duration by channel (replaces lag chart since processed_at is unavailable) ──
  const channelDurationData = useMemo(() => {
    if (!channels?.length) return [];
    return channels
      .filter((c) => c.totalDurationHours > 0)
      .sort((a, b) => b.totalDurationHours - a.totalDurationHours)
      .slice(0, 12)
      .map((c) => ({
        channel: c.obfuscatedCode,
        uploadedHrs: Math.round(c.totalDurationHours * 10) / 10,
        avgMin: Math.round((c.avgProcessingTimeMin ?? 0) * 10) / 10,
      }));
  }, [channels]);

  // ── Auto-generated insight cards ───────────────────────────────────────────
  const insightCards = useMemo((): InsightCard[] => {
    const cards: InsightCard[] = [];

    // Volume MoM
    if (momPct != null) {
      cards.push({
        title: `Upload volume ${momPct >= 0 ? 'grew' : 'declined'} ${Math.abs(momPct).toFixed(1)}% MoM`,
        body:
          momPct >= 10
            ? 'Strong month-over-month growth. Check if a new client or channel drove the spike.'
            : momPct >= 0
              ? 'Modest growth. Volume is stable with a small upward trend.'
              : momPct > -10
                ? 'Slight dip. Could be seasonality or reduced activity from a single channel.'
                : 'Significant volume drop. Investigate if a major channel or client went inactive.',
        type: momPct >= 5 ? 'positive' : momPct < -5 ? 'negative' : 'neutral',
      });
    }

    // Rolling 30d
    if (rolling30Pct != null) {
      cards.push({
        title: `Rolling 30-day growth: ${rolling30Pct >= 0 ? '+' : ''}${rolling30Pct.toFixed(1)}%`,
        body:
          rolling30Pct > 0
            ? 'Rolling window shows continued positive momentum beyond the single-month view.'
            : 'Rolling window is negative — consecutive period trend may be softening.',
        type: rolling30Pct >= 0 ? 'positive' : 'warning',
      });
    }

    // Publish conversion delta
    if (publishRateDelta != null) {
      cards.push({
        title: `Publish conversion ${publishRateDelta >= 0 ? 'improved' : 'dropped'} ${Math.abs(publishRateDelta).toFixed(1)}% vs prior month`,
        body:
          publishRateDelta >= 0
            ? 'A higher share of uploaded videos were published this month — good funnel health.'
            : 'Fewer uploads converted to publishes. Check for backlog or publishing bottlenecks.',
        type: publishRateDelta >= 0 ? 'positive' : 'negative',
      });
    }

    // Anomaly detection
    if (anomalySet.size > 0) {
      cards.push({
        title: `${anomalySet.size} anomalous month${anomalySet.size > 1 ? 's' : ''} detected`,
        body: `Months ${[...anomalySet].join(', ')} deviate significantly from the historical average. These may indicate one-off events, data spikes, or operational changes.`,
        type: 'warning',
      });
    }

    // Processing lag
    if (avgProcessingHrs != null && avgProcessingHrs > 48) {
      cards.push({
        title: `High avg processing lag: ${avgProcessingHrs.toFixed(1)} hrs`,
        body: 'Average upload-to-processed time exceeds 48 hours. Review queue health and channel-level lag for bottlenecks.',
        type: 'warning',
      });
    }

    // Duration vs volume divergence
    if (durationDelta != null && volumeDelta != null && Math.abs(durationDelta - volumeDelta) > 15) {
      cards.push({
        title: 'Duration and count trends are diverging',
        body:
          durationDelta > volumeDelta
            ? `Duration grew ${durationDelta.toFixed(1)}% while count grew only ${volumeDelta.toFixed(1)}%. Average video length may be increasing.`
            : `Count grew ${volumeDelta.toFixed(1)}% while duration grew only ${durationDelta.toFixed(1)}%. Shorter videos are being uploaded more frequently.`,
        type: 'neutral',
      });
    }

    return cards;
  }, [momPct, rolling30Pct, publishRateDelta, anomalySet, avgProcessingHrs, durationDelta, volumeDelta]);

  // ── Chart metric config ────────────────────────────────────────────────────
  const chartConfig = useMemo(() => {
    if (metricMode === 'count') {
      return {
        primary: { key: 'uploaded', label: 'Uploaded', color: CHART_COLORS.blue },
        secondary: { key: 'published', label: 'Published', color: CHART_COLORS.green },
        tertiary: { key: 'clips', label: 'Clips Out', color: CHART_COLORS.red },
        unit: '',
        areaKey: 'uploadedHrs',
        areaLabel: 'Upload Hrs',
        areaColor: CHART_COLORS.purple,
        areaUnit: ' hrs',
      };
    }
    if (metricMode === 'duration') {
      return {
        primary: { key: 'uploadedHrs', label: 'Uploaded Hrs', color: CHART_COLORS.blue },
        secondary: { key: 'publishedHrs', label: 'Published Hrs', color: CHART_COLORS.green },
        tertiary: { key: 'clipsHrs', label: 'Clips Hrs', color: CHART_COLORS.red },
        unit: ' hrs',
        areaKey: 'uploadedHrs',
        areaLabel: 'Upload Hrs',
        areaColor: CHART_COLORS.purple,
        areaUnit: ' hrs',
      };
    }
    // conversion
    return {
      primary: { key: 'publishConvPct', label: 'Publish Rate %', color: CHART_COLORS.amber },
      secondary: null,
      tertiary: null,
      unit: '%',
      areaKey: 'publishConvPct',
      areaLabel: 'Publish Rate %',
      areaColor: CHART_COLORS.amber,
      areaUnit: '%',
    };
  }, [metricMode]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Usage & Trends"
        subtitle="Upload · processing · publish volumes, conversion rates, lag, and growth diagnostics over time"
      />

      {/* KPI row */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StatsCard
          title="MoM Upload Growth"
          value={momPct != null ? `${momPct > 0 ? '+' : ''}${momPct.toFixed(1)}%` : '—'}
          trend={momPct != null ? { value: momPct, label: 'MoM' } : undefined}
          icon={momPct != null && momPct >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        />
        <StatsCard
          title="Rolling 30d Growth"
          value={rolling30Pct != null ? `${rolling30Pct > 0 ? '+' : ''}${rolling30Pct.toFixed(1)}%` : '—'}
          trend={rolling30Pct != null ? { value: rolling30Pct, label: 'prev 30d' } : undefined}
          icon={<BarChart3 size={16} />}
        />
        <StatsCard
          title="Publish Rate (latest)"
          value={latestMonth ? `${latestMonth.publishConvPct.toFixed(1)}%` : '—'}
          trend={
            publishRateDelta != null
              ? { value: publishRateDelta, label: 'vs prev month' }
              : undefined
          }
          icon={<TrendingUp size={16} />}
        />
        <StatsCard
          title="Avg Duration / Video"
          value={kpis?.avgProcessingTimeMin != null ? `${kpis.avgProcessingTimeMin.toFixed(1)} min` : '—'}
          icon={<Timer size={16} />}
          accentColor="blue"
        />
        <StatsCard
          title="Avg Duration (Latest)"
          value={
            monthly?.[monthly.length - 1]?.avgDurationMin != null
              ? `${(monthly[monthly.length - 1].avgDurationMin as number).toFixed(1)} min`
              : '—'
          }
          icon={<Clock size={16} />}
          accentColor="amber"
        />
        <StatsCard
          title="Active Channels"
          value={kpis?.activeChannels != null ? String(kpis.activeChannels) : '—'}
          icon={<Activity size={16} />}
        />
      </motion.div>

      {/* Controls bar */}
      <motion.div
        className="flex flex-wrap items-center justify-between gap-3 mb-5 px-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#71717A] font-medium">Metric:</span>
          <MetricToggle value={metricMode} onChange={setMetricMode} />
        </div>
        <button
          onClick={() => setCompareOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
            compareOpen
              ? 'bg-blue-900/30 border-blue-600/50 text-blue-400'
              : 'bg-[#18181B] border-[#27272A] text-[#71717A] hover:text-[#A1A1AA]'
          }`}
        >
          <GitCompare size={12} />
          Compare period
        </button>
      </motion.div>

      {/* Auto-generated insight panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <InsightPanel cards={insightCards} />
      </motion.div>

      {/* Main trend chart */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <ChartCard
          title={
            metricMode === 'count'
              ? 'Monthly Volume Trend'
              : metricMode === 'duration'
                ? 'Monthly Duration Trend'
                : 'Monthly Publish Conversion Rate'
          }
          subtitle={
            metricMode === 'count'
              ? 'Uploaded · published · clips out with 3-month rolling average'
              : metricMode === 'duration'
                ? 'Uploaded · published · clips duration (hrs) with 3-month rolling average'
                : 'Published ÷ uploaded per month with 3-month rolling average'
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717A' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#71717A' }}
                unit={metricMode === 'conversion' ? '%' : metricMode === 'duration' ? ' h' : ''}
              />
              <Tooltip content={<DarkTooltip unit={chartConfig.unit} />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }} />

              {/* Anomaly reference lines */}
              {[...anomalySet].map((month) => (
                <ReferenceLine
                  key={month}
                  x={month}
                  stroke={CHART_COLORS.amber}
                  strokeDasharray="4 2"
                  strokeOpacity={0.5}
                  label={{ value: '⚠', position: 'top', fontSize: 10, fill: CHART_COLORS.amber }}
                />
              ))}

              <Bar
                dataKey={chartConfig.primary.key}
                name={chartConfig.primary.label}
                fill={chartConfig.primary.color}
                opacity={0.75}
                radius={[3, 3, 0, 0]}
              />
              {chartConfig.secondary && (
                <Bar
                  dataKey={chartConfig.secondary.key}
                  name={chartConfig.secondary.label}
                  fill={chartConfig.secondary.color}
                  opacity={0.75}
                  radius={[3, 3, 0, 0]}
                />
              )}
              {chartConfig.tertiary && (
                <Bar
                  dataKey={chartConfig.tertiary.key}
                  name={chartConfig.tertiary.label}
                  fill={chartConfig.tertiary.color}
                  opacity={0.55}
                  radius={[3, 3, 0, 0]}
                />
              )}
              <Line
                type="monotone"
                dataKey="rollingAvg"
                name="3-mo Avg"
                stroke={CHART_COLORS.amber}
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Duration area chart — always visible in count/duration mode; conversion shows rate area */}
        <ChartCard
          title={metricMode === 'conversion' ? 'Publish Rate Over Time' : 'Duration Trend (Hours)'}
          subtitle={
            metricMode === 'conversion'
              ? 'Monthly publish conversion % as an area trend'
              : 'Total uploaded and published duration per month'
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717A' }} unit={metricMode === 'conversion' ? '%' : ' h'} />
              <Tooltip content={<DarkTooltip unit={metricMode === 'conversion' ? '%' : ' hrs'} />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }} />
              {metricMode === 'conversion' ? (
                <Area
                  type="monotone"
                  dataKey="publishConvPct"
                  name="Publish Rate %"
                  fill={CHART_COLORS.amber}
                  stroke={CHART_COLORS.amber}
                  fillOpacity={0.2}
                />
              ) : (
                <>
                  <Area
                    type="monotone"
                    dataKey="uploadedHrs"
                    name="Uploaded Hrs"
                    fill={CHART_COLORS.purple}
                    stroke={CHART_COLORS.purple}
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="publishedHrs"
                    name="Published Hrs"
                    fill={CHART_COLORS.green}
                    stroke={CHART_COLORS.green}
                    fillOpacity={0.2}
                    strokeWidth={1.5}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>

      {/* Period comparison (visible when compare mode is on, or always shown if growth data exists) */}
      <AnimatePresence>
        {(compareOpen || compareData.length > 0) && (
          <motion.div
            key="compare"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
          >
            <ChartCard
              title="Current vs Previous Period"
              subtitle={`${growth?.current?.label ?? 'Current'} vs ${growth?.previous?.label ?? 'Previous'}`}
            >
              {compareData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={compareData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#71717A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
                    <Tooltip content={<DarkTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }} />
                    <Bar dataKey="current" name={growth?.current?.label ?? 'Current'} fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} />
                    <Bar dataKey="previous" name={growth?.previous?.label ?? 'Previous'} fill={CHART_COLORS.blue} opacity={0.35} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-[#52525B] text-sm">
                  No previous period data available for comparison.
                </div>
              )}
            </ChartCard>

            {/* Contribution-to-change summary */}
            <ChartCard
              title="Period Delta Summary"
              subtitle="Absolute and relative change between current and previous period"
            >
              {compareData.length > 0 ? (
                <div className="flex flex-col gap-3 pt-2">
                  {compareData.map((d) => {
                    const delta = d.current - d.previous;
                    const pct = d.previous > 0 ? (delta / d.previous) * 100 : null;
                    const isPositive = delta >= 0;
                    return (
                      <div key={d.metric} className="flex items-center gap-3 px-2">
                        <div className="w-28 text-xs text-[#A1A1AA] font-medium flex-shrink-0">{d.metric}</div>
                        <div className="flex-1 h-2 rounded bg-[#27272A] overflow-hidden">
                          <div
                            className="h-full rounded transition-all"
                            style={{
                              width: `${Math.min(100, (d.current / Math.max(d.current, d.previous)) * 100)}%`,
                              background: isPositive ? CHART_COLORS.green : CHART_COLORS.red,
                            }}
                          />
                        </div>
                        <div className="w-20 text-right">
                          <span className={`text-xs font-semibold font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{delta.toLocaleString()}
                          </span>
                          {pct != null && (
                            <span className={`text-[10px] ml-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              ({pct > 0 ? '+' : ''}{pct.toFixed(1)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-3 pt-3 border-t border-[#27272A] px-2">
                    <p className="text-xs text-[#52525B] leading-relaxed">
                      Comparison period: <span className="text-[#A1A1AA]">{growth?.previous?.label ?? 'N/A'}</span>
                      {' → '}
                      <span className="text-[#A1A1AA]">{growth?.current?.label ?? 'N/A'}</span>.
                      Expand the date range filter to see longer periods.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-[#52525B] text-sm">
                  No comparison data available.
                </div>
              )}
            </ChartCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clips trend + Lag row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <ChartCard title="Clips Generated per Month" subtitle="Output clips count trend over time">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rawTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717A' }} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="clips" name="Clips" radius={[3, 3, 0, 0]}>
                {rawTrend.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={anomalySet.has(entry.month) ? CHART_COLORS.amber : CHART_COLORS.red}
                    opacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Upload Duration by Channel"
          subtitle="Total uploaded hours and avg video duration per channel"
        >
          {channelDurationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={channelDurationData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717A' }} unit=" h" />
                <YAxis
                  type="category"
                  dataKey="channel"
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  width={90}
                />
                <Tooltip content={<DarkTooltip unit=" hrs" />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#A1A1AA' }} />
                <Bar dataKey="uploadedHrs" name="Uploaded (hrs)" fill={CHART_COLORS.blue} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex flex-col items-center justify-center gap-2 text-[#52525B] text-sm">
              <Timer size={20} className="opacity-30" />
              <span>No duration data available for the selected filters.</span>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Monthly publish rate trend */}
      <motion.div
        className="grid grid-cols-1 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
      >
        <ChartCard
          title="Monthly Publish Conversion Rate"
          subtitle="% of uploaded videos that were published — month-by-month funnel health indicator"
        >
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={rawTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#71717A' }} />
              <YAxis tick={{ fontSize: 11, fill: '#71717A' }} unit="%" domain={([dataMin, dataMax]: [number, number]) => [Math.max(0, dataMin * 0.8), Math.min(100, dataMax * 1.2)]} />
              <Tooltip content={<DarkTooltip unit="%" />} />
              <ReferenceLine y={50} stroke="#52525B" strokeDasharray="4 2" label={{ value: '50%', fill: '#52525B', fontSize: 10 }} />
              <Area
                type="monotone"
                dataKey="publishConvPct"
                name="Publish Rate %"
                fill={CHART_COLORS.green}
                stroke={CHART_COLORS.green}
                fillOpacity={0.15}
                strokeWidth={2}
              />
              {/* Anomaly markers for conversion rate */}
              {[...anomalyMonths(rawTrend.map((r) => ({ month: r.month, value: r.publishConvPct })))].map((m) => (
                <ReferenceLine
                  key={m}
                  x={m}
                  stroke={CHART_COLORS.amber}
                  strokeDasharray="4 2"
                  strokeOpacity={0.4}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </motion.div>
    </DashboardLayout>
  );
};

export default UsageTrends;
