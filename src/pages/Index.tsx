import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Video, Scissors, Clock, Users, Play, TrendingUp, ShieldCheck,
  AlertTriangle, CheckCircle2, ArrowRight, TrendingDown, FileWarning,
  Activity, Target, Zap,
} from 'lucide-react';
import {
  kpis as mockKpis, monthlyMetrics as mockMonthly,
  channelMetrics as mockChannels, outputTypeData as mockOutputTypes,
  languageData as mockLanguages,
} from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { formatNumber, cn } from '@/lib/utils';
import { FunnelChart } from '@/components/FunnelChart';
import {
  useKpis, useMonthly, useChannels, useOutputTypes, useLanguages,
  useFunnel, useGrowth, useQuality, useConcentration,
  useLagBacklog, useGrowthDrivers, useQualityRules, useLagAging,
} from '@/hooks/useApi';
import { InsightStrip, buildInsights } from '@/components/InsightStrip';

// Custom tooltip component for charts
const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const fadeIn  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// ── Risk badge ──────────────────────────────────────────────────────────────────
const RiskBadge = ({ level }: { level: 'critical' | 'warning' | 'ok' }) => {
  const map = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ok:       'bg-green-500/15 text-green-400 border-green-500/30',
  };
  const labels = { critical: 'Critical', warning: 'Warning', ok: 'Good' };
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide', map[level])}>
      {labels[level]}
    </span>
  );
};

// ── Section label ───────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold uppercase tracking-widest text-[#52525B] mb-2">{children}</p>
);

const Overview: React.FC = () => {
  const navigate = useNavigate();

  // Data hooks
  const { data: liveKpis,   isLoading: kpisLoading } = useKpis();
  const { data: liveMonthly }                         = useMonthly();
  const { data: liveChannels }                        = useChannels();
  const { data: liveOutputTypes }                     = useOutputTypes();
  const { data: liveLanguages }                       = useLanguages();
  const { data: funnelData }                          = useFunnel();
  const { data: growthData }                          = useGrowth();
  const { data: qualityData }                         = useQuality();
  const { data: concentrationData }                   = useConcentration();
  const { data: backlogData }                         = useLagBacklog();
  const { data: growthDrivers }                       = useGrowthDrivers('channel');
  const { data: qualityRules }                        = useQualityRules();
  const { data: agingData }                           = useLagAging();

  // Merge live data with mock fallbacks
  const kpis       = { ...mockKpis,       ...liveKpis };
  const monthlyData  = liveMonthly    ?? mockMonthly;
  const channelData  = liveChannels   ?? mockChannels;
  const outputTypes  = liveOutputTypes ?? mockOutputTypes;
  const languageData = liveLanguages  ?? mockLanguages;

  // ── Derived funnel figures (prefer funnel endpoint, fall back to kpis) ──────
  // Stage names are Title Case from the backend ("Uploaded", "Processed", "Published")
  const findStage = (label: string) =>
    funnelData?.stages?.find(s => s.stage.toLowerCase() === label);
  const uploaded  = findStage('uploaded')?.count  ?? kpis.totalVideos;
  const processed = findStage('processed')?.count ?? (kpis as any).totalProcessed ?? uploaded;
  const published = findStage('published')?.count ?? Math.round(uploaded * ((kpis as any).publishRate ?? 0));
  // Prefer dedicated backlog endpoint
  const backlog   = backlogData?.total_backlog ?? Math.max(0, processed - published);
  const oldestDays = backlogData?.oldest_days ?? agingData?.oldest_item
    ? Math.ceil((Date.now() - (agingData!.oldest_item!.uploaded_at ?? Date.now())) / 86_400_000) : null;

  const processingRate        = uploaded  > 0 ? (processed / uploaded)  * 100 : 0;
  const publishConversionRate = processed > 0 ? (published / processed) * 100 : 0;
  const endToEndRate          = uploaded  > 0 ? (published / uploaded)  * 100 : 0;

  // Fall back to kpi-level rates when funnel data not yet loaded
  const displayProcessingRate = processingRate        > 0 ? processingRate        : ((kpis as any).processingRate ?? 1) * 100;
  const displayConversionRate = publishConversionRate > 0 ? publishConversionRate : ((kpis as any).publishRate   ?? 0) * 100;
  const displayE2ERate        = endToEndRate          > 0 ? endToEndRate          : ((kpis as any).publishRate   ?? 0) * 100;

  // ── Backlog KPI from dedicated endpoint ─────────────────────────────────────
  const backlogAvgDays = backlogData?.avg_days ?? null;
  const criticalRulesCount = qualityRules?.critical_count ?? 0;

  // ── Risk signals for the alert strip ────────────────────────────────────────
  const dqScore  = (kpis as any).dqScore ?? qualityData?.overall_score ?? null;
  const dqRisk: 'ok' | 'warning' | 'critical' =
    dqScore == null ? 'warning' : dqScore >= 80 ? 'ok' : dqScore >= 60 ? 'warning' : 'critical';
  const momGrowth     = growthData?.mom_growth_pct ?? kpis.momGrowth ?? 0;
  const top5ChanShare = concentrationData?.top5_channel_share ?? null;

  // ── Alert items ─────────────────────────────────────────────────────────────
  type AlertLevel = 'critical' | 'warning' | 'ok';
  const alerts = useMemo<{ icon: React.ReactNode; text: string; level: AlertLevel; action?: string; route?: string }[]>(() => {
    const items: { icon: React.ReactNode; text: string; level: AlertLevel; action?: string; route?: string }[] = [];

    if (dqScore != null && dqScore < 80) {
      items.push({
        icon:  <FileWarning size={13} />,
        text:  `Data quality score ${dqScore.toFixed(0)}/100 — field completeness needs attention`,
        level: dqScore < 60 ? 'critical' : 'warning',
        action: 'View DQ', route: '/quality',
      });
    }
    if (backlog > 0) {
      items.push({
        icon:  <AlertTriangle size={13} />,
        text:  `${backlog.toLocaleString()} videos processed but not yet published`,
        level: backlog > 50 ? 'warning' : 'ok',
        action: 'Investigate', route: '/videos',
      });
    }
    if (displayConversionRate > 0 && displayConversionRate < 60) {
      items.push({
        icon:  <TrendingDown size={13} />,
        text:  `Publish conversion ${displayConversionRate.toFixed(1)}% is below the 60% benchmark`,
        level: displayConversionRate < 40 ? 'critical' : 'warning',
      });
    }
    if (top5ChanShare != null && top5ChanShare > 80) {
      items.push({
        icon:  <Target size={13} />,
        text:  `Top 5 channels account for ${top5ChanShare.toFixed(0)}% of volume — concentration risk`,
        level: 'warning',
        action: 'Channels', route: '/channels',
      });
    }
    if (items.length === 0) {
      items.push({ icon: <CheckCircle2 size={13} />, text: 'All key indicators are within healthy range', level: 'ok' });
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dqScore, backlog, displayConversionRate, top5ChanShare]);

  // ── Chart data shapes ────────────────────────────────────────────────────────
  const channelBar = channelData.slice(0, 6).map(c => ({
    channel:  c.channel,
    Uploaded: c.videosProcessed,
    Clips:    c.clipsGenerated,
  }));

  const trendData = monthlyData.map(m => ({
    month:     m.month,
    Uploaded:  m.videosProcessed,
    Published: (m as any).videosPublished ?? 0,
    Clips:     m.clipsGenerated,
  }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout title="Overview" subtitle="Product usage analytics · Mar 2025 – Feb 2026">
      <div className="space-y-6 animate-fade-in">

        {/* Page header */}
        <PageHeader
          title="Product Overview"
          subtitle="Executive diagnostics across clients, channels, and content types"
          badge={{ label: 'LIVE', variant: 'red' }}
          onDownload={() => {}}
        />

        {/* ── Alert strip ──────────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-lg border text-xs',
                alert.level === 'critical' && 'bg-red-500/10 border-red-500/25 text-red-300',
                alert.level === 'warning'  && 'bg-amber-500/10 border-amber-500/25 text-amber-300',
                alert.level === 'ok'       && 'bg-green-500/10 border-green-500/25 text-green-300',
              )}
            >
              <span className="flex-shrink-0">{alert.icon}</span>
              <span className="flex-1">{alert.text}</span>
              {alert.action && alert.route && (
                <button
                  onClick={() => navigate(alert.route!)}
                  className="flex items-center gap-1 font-semibold opacity-80 hover:opacity-100 transition-opacity whitespace-nowrap"
                >
                  {alert.action} <ArrowRight size={11} />
                </button>
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Content pipeline KPIs (uploaded / processed / published + rates) ─── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <SectionLabel>Content Pipeline</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                title: 'Videos Uploaded',
                value: formatNumber(uploaded),
                trend: { value: momGrowth, label: 'MoM' },
                icon: <Video size={15} />,
                accentColor: 'red' as const,
              },
              {
                title: 'Videos Processed',
                value: formatNumber(processed),
                icon: <Activity size={15} />,
                accentColor: 'blue' as const,
              },
              {
                title: 'Videos Published',
                value: formatNumber(published),
                icon: <Play size={15} />,
                accentColor: 'green' as const,
              },
              {
                title: 'Processing Rate',
                value: `${displayProcessingRate.toFixed(1)}%`,
                icon: <Zap size={15} />,
                accentColor: 'amber' as const,
              },
              {
                title: 'Publish Conversion',
                value: `${displayConversionRate.toFixed(1)}%`,
                icon: <Target size={15} />,
                accentColor: displayConversionRate < 60 ? ('red' as const) : ('green' as const),
              },
              {
                title: 'E2E Publish Rate',
                value: `${displayE2ERate.toFixed(1)}%`,
                icon: <TrendingUp size={15} />,
                accentColor: 'blue' as const,
              },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeIn}>
                <StatsCard {...card} loading={kpisLoading} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Platform activity KPIs ────────────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <SectionLabel>Platform Activity</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: 'Clips Generated',
                value: formatNumber(kpis.totalClips),
                trend: { value: kpis.clipsGrowthMom, label: 'MoM' },
                icon: <Scissors size={15} />,
                accentColor: 'red' as const,
              },
              {
                title: 'Hours Processed',
                value: formatNumber(kpis.totalHoursProcessed),
                unit: 'hrs',
                icon: <Clock size={15} />,
                accentColor: 'blue' as const,
              },
              {
                title: 'Active Clients',
                value: kpis.activeClients,
                icon: <Users size={15} />,
                accentColor: 'green' as const,
              },
              {
                title: 'DQ Score',
                value: dqScore != null ? dqScore.toFixed(0) : '—',
                unit: dqScore != null ? '/100' : undefined,
                icon: <ShieldCheck size={15} />,
                accentColor: dqRisk === 'ok' ? ('green' as const) : dqRisk === 'warning' ? ('amber' as const) : ('red' as const),
              },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeIn}>
                <StatsCard {...card} loading={kpisLoading} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Top Movers (growth drivers) + Top Risks ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Movers */}
          <div className="frammer-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
                Top Movers — Channel (MoM)
              </p>
              {growthDrivers && (
                <span className="text-[10px] text-[#52525B]">
                  Δ {growthDrivers.total_delta >= 0 ? '+' : ''}{growthDrivers.total_delta}
                </span>
              )}
            </div>
            {growthDrivers?.drivers?.length ? (
              <div className="space-y-1.5">
                {growthDrivers.drivers.slice(0, 5).map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#A1A1AA] truncate max-w-[140px]">{d.segment}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#71717A] font-mono text-[10px]">
                        {d.current_value} vs {d.prev_value}
                      </span>
                      <span className={cn(
                        'font-semibold font-mono min-w-[44px] text-right',
                        d.delta >= 0 ? 'text-green-400' : 'text-red-400',
                      )}>
                        {d.delta >= 0 ? '+' : ''}{d.delta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-[#52525B] italic">No driver data available yet.</p>
            )}
          </div>

          {/* Top Risks */}
          <div className="frammer-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-3">Top Risks</p>
            <div className="space-y-1.5">
              {criticalRulesCount > 0 && (
                <div
                  className="flex items-center gap-2 text-xs text-red-400 cursor-pointer hover:text-red-300"
                  onClick={() => navigate('/quality')}
                >
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  <span>{criticalRulesCount} critical DQ rule{criticalRulesCount !== 1 ? 's' : ''} failing</span>
                  <ArrowRight size={10} className="ml-auto" />
                </div>
              )}
              {backlog > 100 && (
                <div
                  className="flex items-center gap-2 text-xs text-amber-400 cursor-pointer hover:text-amber-300"
                  onClick={() => navigate('/videos')}
                >
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  <span>{backlog.toLocaleString()} items in publish backlog</span>
                  <ArrowRight size={10} className="ml-auto" />
                </div>
              )}
              {(oldestDays ?? 0) > 14 && (
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertTriangle size={12} className="flex-shrink-0" />
                  <span>Oldest backlog item: {oldestDays} days waiting</span>
                </div>
              )}
              {backlogAvgDays != null && (
                <div className="flex items-center gap-2 text-xs text-[#71717A]">
                  <Activity size={12} className="flex-shrink-0" />
                  <span>Avg backlog age: {backlogAvgDays.toFixed(1)} days</span>
                </div>
              )}
              {criticalRulesCount === 0 && backlog <= 100 && (
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 size={12} />
                  <span>No critical risks detected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 3-column diagnostic layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Left — Funnel + backlog ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <ChartCard
              title="Content Funnel"
              subtitle="Upload → Process → Publish"
              height={220}
              tooltip="Stage-by-stage conversion from uploaded videos to published output."
            >
              <FunnelChart
                stages={[
                  { label: 'Uploaded',  value: uploaded,  color: CHART_COLORS.red   },
                  { label: 'Processed', value: processed, color: CHART_COLORS.blue  },
                  { label: 'Published', value: published, color: CHART_COLORS.green },
                ]}
                showConversionRate
              />
            </ChartCard>

            {/* Backlog snapshot */}
            <div className="frammer-card p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">Backlog Snapshot</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: 'Processed Gap',
                    value: backlog > 0 ? backlog.toLocaleString() : 'Clear',
                    color: backlog > 0 ? 'text-amber-400' : 'text-green-400',
                  },
                  {
                    label: 'Avg Clips / Video',
                    value: `${kpis.avgClipsPerVideo}×`,
                    color: 'text-blue-400',
                  },
                  {
                    label: 'Active Channels',
                    value: String((kpis as any).activeChannels ?? '—'),
                    color: 'text-white',
                  },
                  {
                    label: 'Active Teams',
                    value: String((kpis as any).activeTeams ?? '—'),
                    color: 'text-white',
                  },
                ].map((item, i) => (
                  <div key={i} className="bg-[#111] rounded-lg p-3">
                    <p className="text-[10px] text-[#52525B] mb-1">{item.label}</p>
                    <p className={cn('font-metric text-lg font-semibold', item.color)}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle — Triple monthly trend ──────────────────────────────────── */}
          <div className="lg:col-span-6">
            <ChartCard
              title="Monthly Pipeline Trend"
              subtitle="Uploaded · Published · Clips generated over time"
              height={380}
              tooltip="Month-by-month counts for uploaded, published, and clips generated."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRed2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.red}   stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.red}   stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradGreen2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.green} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="gradBlue2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={CHART_COLORS.blue}  stopOpacity={0.15} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue}  stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis                 tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend
                    formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>}
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  <Area type="monotone" dataKey="Uploaded"  stroke={CHART_COLORS.red}   strokeWidth={2}   fill="url(#gradRed2)"    dot={false} />
                  <Area type="monotone" dataKey="Published" stroke={CHART_COLORS.green} strokeWidth={2}   fill="url(#gradGreen2)"  dot={false} />
                  <Area type="monotone" dataKey="Clips"     stroke={CHART_COLORS.blue}  strokeWidth={1.5} fill="url(#gradBlue2)"   dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Right — DQ card + key movers ───────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">

            {/* Clickable DQ card → /quality */}
            <div
              className="frammer-card p-4 cursor-pointer hover:border-[#3a3a3a] transition-colors"
              onClick={() => navigate('/quality')}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A]">Data Quality</p>
                <RiskBadge level={dqRisk} />
              </div>
              <p className={cn(
                'font-metric text-4xl font-semibold mb-1',
                dqRisk === 'ok'      ? 'text-green-400' :
                dqRisk === 'warning' ? 'text-amber-400' : 'text-red-400',
              )}>
                {dqScore != null ? dqScore.toFixed(0) : '—'}
                <span className="text-base font-normal text-[#52525B]">/100</span>
              </p>
              {qualityData && (
                <div className="space-y-1 mt-2">
                  {qualityData.duplicate_video_ids > 0 && (
                    <p className="text-[11px] text-amber-400">⚠ {qualityData.duplicate_video_ids} duplicate video IDs</p>
                  )}
                  {qualityData.unknown_team_names > 0 && (
                    <p className="text-[11px] text-amber-400">⚠ {qualityData.unknown_team_names} unassigned team records</p>
                  )}
                </div>
              )}
              <p className="text-[10px] text-[#52525B] mt-3 flex items-center gap-1">
                View full DQ report <ArrowRight size={10} />
              </p>
            </div>

            {/* Key movers panel */}
            <div className="frammer-card p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#71717A] mb-3">Key Movers</p>
              <div className="space-y-0">
                {[
                  {
                    label: 'MoM Volume Growth',
                    value: `${momGrowth >= 0 ? '+' : ''}${momGrowth.toFixed(1)}%`,
                    sub:   'Uploaded count vs prior month',
                    positive: momGrowth >= 0,
                  },
                  {
                    label: 'E2E Publish Rate',
                    value: `${displayE2ERate.toFixed(1)}%`,
                    sub:   'Published out of uploaded total',
                    positive: displayE2ERate >= 50,
                  },
                  {
                    label: 'Top Channel',
                    value: kpis.topChannel ?? '—',
                    sub:   `${channelData[0]?.videosProcessed ?? 0} videos`,
                    positive: true,
                  },
                  {
                    label: 'Top Language',
                    value: kpis.topLanguage ?? '—',
                    sub:   languageData[0] ? `${languageData[0].percentage}% of output` : '',
                    positive: true,
                  },
                  {
                    label: 'Publish Backlog',
                    value: backlog > 0 ? backlog.toLocaleString() : 'Clear',
                    sub:   'Processed but not published',
                    positive: backlog === 0,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 py-2 border-b border-[#1C1C1C] last:border-0"
                  >
                    <div>
                      <p className="text-[10px] text-[#71717A] uppercase tracking-wide">{item.label}</p>
                      <p className="text-[10px] text-[#3A3A3A] mt-0.5">{item.sub}</p>
                    </div>
                    <span className={cn(
                      'font-metric text-sm font-semibold mt-0.5 flex-shrink-0',
                      item.positive ? 'text-white' : 'text-red-400',
                    )}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom breakdowns ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Channel volume */}
          <ChartCard
            title="Volume by Channel"
            subtitle="Uploaded videos and clips by distribution channel"
            height={240}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBar} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="channel" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="Uploaded" fill={CHART_COLORS.red}  radius={[3, 3, 0, 0]} maxBarSize={24} />
                <Bar dataKey="Clips"    fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Output type mix */}
          <ChartCard
            title="Output Type Mix"
            subtitle="Distribution of generated clips by output type"
            height={240}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outputTypes}
                  dataKey="count"
                  nameKey="type"
                  cx="45%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {outputTypes.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  iconSize={8}
                  iconType="circle"
                  formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Language distribution */}
        <ChartCard
          title="Language Distribution"
          subtitle="Content output across languages (top 8)"
          height={220}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={languageData}
              layout="vertical"
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
              <XAxis type="number"   tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="language"
                type="category"
                tick={{ fill: '#A1A1AA', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Clips" radius={[0, 3, 3, 0]} maxBarSize={14}>
                {languageData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === 0 ? CHART_COLORS.red : i === 1 ? CHART_COLORS.blue : CHART_COLORS.amber}
                    fillOpacity={i === 0 ? 1 : Math.max(0.35, 0.75 - i * 0.08)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </DashboardLayout>
  );
};

export default Overview;

