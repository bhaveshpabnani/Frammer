import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  ScatterChart, Scatter, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, Legend, ZAxis, ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  TrendingUp, Layers, Activity, Users, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { formatNumber, cn, downloadCsv } from '@/lib/utils';
import {
  useChannelHealth, useLag, usePublishingByChannel, useConcentration, useChannels,
} from '@/hooks/useApi';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonPage } from '@/components/SkeletonPage';
import { ExportButton } from '@/components/ExportButton';
import { CrossFilterBar } from '@/components/CrossFilterChip';
import { useFilters } from '@/contexts/FilterContext';

const QUADRANT_COLORS: Record<string, string> = {
  star:             CHART_COLORS.green,
  high_volume:      CHART_COLORS.blue,
  high_efficiency:  CHART_COLORS.amber,
  underperforming:  CHART_COLORS.red,
};
const QUADRANT_LABELS: Record<string, string> = {
  star:            'Star',
  high_volume:     'High Volume',
  high_efficiency: 'High Efficiency',
  underperforming: 'Underperforming',
};

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ScatterTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2.5 text-xs shadow-xl max-w-[180px]">
      <p className="text-white font-semibold mb-1 truncate">{d.channel}</p>
      <p className="text-[#A1A1AA]">Volume: <span className="text-white">{d.total_uploaded?.toLocaleString()}</span></p>
      <p className="text-[#A1A1AA]">Publish Rate: <span className="text-white">{d.publish_conversion_pct?.toFixed(1)}%</span></p>
      <p className="text-[#A1A1AA]">Health Score: <span className="text-white">{d.health_score?.toFixed(0)}</span></p>
      <p className="text-[#A1A1AA]">Quadrant: <span style={{ color: QUADRANT_COLORS[d.health_quadrant] ?? '#fff' }}>
        {QUADRANT_LABELS[d.health_quadrant] ?? d.health_quadrant}
      </span></p>
    </div>
  );
};

const fadeIn  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const ChannelAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { updateFilters } = useFilters();
  const [selectedQuadrant, setSelectedQuadrant] = useState<string | null>(null);

  const { data: healthData,      isLoading: healthLoading }       = useChannelHealth();
  const { data: lagData,         isLoading: lagLoading }          = useLag();
  const { data: publishingData,  isLoading: publishingLoading }   = usePublishingByChannel();
  const { data: concentrationData }                               = useConcentration();
  const { data: channelsData }                                    = useChannels();

  const isLoading = healthLoading || lagLoading;

  // ── KPI derivation ──────────────────────────────────────────────────────────
  const totalChannels   = healthData?.length ?? channelsData?.length ?? 0;
  const avgHealthScore  = healthData?.length
    ? healthData.reduce((s, r) => s + (r.health_score ?? 0), 0) / healthData.length
    : null;
  const publishGapCount = healthData?.reduce((s, r) => s + (r.processed_not_published ?? 0), 0) ?? 0;
  const top5Share       = concentrationData?.top5_channel_share ?? null;

  // ── Scatter data ─────────────────────────────────────────────────────────────
  const scatterData = useMemo(() => {
    if (!healthData) return [];
    return healthData.filter(r =>
      !selectedQuadrant || r.health_quadrant === selectedQuadrant
    );
  }, [healthData, selectedQuadrant]);

  // ── Lag by channel bar ───────────────────────────────────────────────────────
  const lagBarData = useMemo(() => {
    if (!lagData?.by_channel) return [];
    return lagData.by_channel
      .filter(r => r.group_value)
      .sort((a, b) => (b.avg_processing_lag_hrs ?? 0) - (a.avg_processing_lag_hrs ?? 0))
      .slice(0, 10)
      .map(r => ({
        channel:   r.group_value ?? '',
        Processing: parseFloat((r.avg_processing_lag_hrs ?? 0).toFixed(2)),
        Publishing: parseFloat((r.avg_publishing_lag_hrs ?? 0).toFixed(2)),
      }));
  }, [lagData]);

  // ── Publishing platform matrix ───────────────────────────────────────────────
  const platforms = ['youtube', 'instagram', 'facebook', 'linkedin', 'reels', 'shorts', 'x', 'threads'];

  if (isLoading) return (
    <DashboardLayout title="Channel Analytics" subtitle="Loading…">
      <SkeletonPage statsCount={4} chartsCount={2} showTable />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Channel Analytics" subtitle="Channel health, lag, publishing distribution">
      <div className="space-y-6 animate-fade-in">

        <PageHeader
          title="Channel Analytics"
          subtitle="Health scores, publish conversion, lag diagnostics, and platform matrix"
          badge={{ label: 'LIVE', variant: 'red' }}
          onDownload={() => downloadCsv('frammer-channel-analytics', (healthData ?? []).map(h => ({ channel: h.channel, total_uploaded: h.total_uploaded, publish_conversion_pct: h.publish_conversion_pct, health_score: h.health_score, quadrant: h.health_quadrant })))}
        />

        <CrossFilterBar />

        {/* ── KPI Strip ────────────────────────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                title: 'Total Channels',
                value: formatNumber(totalChannels),
                icon: <Layers size={15} />,
                accentColor: 'red' as const,
              },
              {
                title: 'Avg Health Score',
                value: avgHealthScore != null ? avgHealthScore.toFixed(0) : '—',
                unit: avgHealthScore != null ? '/100' : undefined,
                icon: <Activity size={15} />,
                accentColor: (avgHealthScore ?? 0) >= 70 ? 'green' as const : 'amber' as const,
              },
              {
                title: 'Publish Gap',
                value: formatNumber(publishGapCount),
                icon: <AlertTriangle size={15} />,
                accentColor: publishGapCount > 50 ? 'red' as const : 'amber' as const,
              },
              {
                title: 'Top 5 Concentration',
                value: top5Share != null ? `${top5Share.toFixed(0)}%` : '—',
                icon: <Users size={15} />,
                accentColor: (top5Share ?? 0) > 80 ? 'red' as const : 'blue' as const,
              },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeIn}>
                <StatsCard {...card} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Quadrant filter chips ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'star', 'high_volume', 'high_efficiency', 'underperforming'] as const).map(q => (
            <button
              key={q}
              onClick={() => setSelectedQuadrant(q === 'all' ? null : q)}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded border transition-colors',
                (selectedQuadrant === q || (q === 'all' && !selectedQuadrant))
                  ? 'border-white/40 text-white bg-white/10'
                  : 'border-[#2a2a2a] text-[#71717A] hover:border-[#3a3a3a]',
              )}
              style={q !== 'all' ? {
                borderColor: (selectedQuadrant === q) ? QUADRANT_COLORS[q] : undefined,
                color: (selectedQuadrant === q) ? QUADRANT_COLORS[q] : undefined,
              } : undefined}
            >
              {q === 'all' ? 'All Channels' : QUADRANT_LABELS[q]}
            </button>
          ))}
        </div>

        {/* ── Scatter + Lag bar side by side ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Health quadrant scatter */}
          <ChartCard
            title="Volume vs Publish Conversion (Quadrant)"
            subtitle="Each dot = one channel; size = avg duration. Click to drill."
            height={340}
            tooltip="Star quadrant = high volume + high conversion. Underperforming = low on both."
          >
            {scatterData.length === 0 ? (
              <EmptyState hasFilters title="No channel health data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, left: -10, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                  <XAxis
                    dataKey="total_uploaded"
                    name="Volume"
                    type="number"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Uploaded', position: 'insideBottom', offset: -4, fill: '#52525B', fontSize: 10 }}
                  />
                  <YAxis
                    dataKey="publish_conversion_pct"
                    name="Publish Rate"
                    type="number"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={v => `${v}%`}
                  />
                  <ZAxis dataKey="health_score" range={[40, 220]} name="Health Score" />
                  <Tooltip content={<ScatterTooltip />} />
                  <ReferenceLine y={50} stroke="#2a2a2a" strokeDasharray="4 2" />
                  <Scatter
                    data={scatterData}
                    onClick={(d) => {
                      updateFilters({ channel: d.channel });
                    }}
                  >
                    {scatterData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={QUADRANT_COLORS[entry.health_quadrant] ?? CHART_COLORS.blue}
                        fillOpacity={0.7}
                        cursor="pointer"
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Lag by channel bar */}
          <ChartCard
            title="Avg Lag by Channel (hrs)"
            subtitle="Processing and publishing lag — top 10 by lag"
            height={340}
            tooltip="Processing lag = time from upload to processing complete. Publishing lag = processed to published."
          >
            {lagBarData.length === 0 ? (
              <EmptyState hasFilters title="No lag data available" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={lagBarData}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${v}h`}
                  />
                  <YAxis
                    dataKey="channel"
                    type="category"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
                  <Bar dataKey="Processing" fill={CHART_COLORS.blue}  radius={[0, 3, 3, 0]} maxBarSize={14} stackId="a" />
                  <Bar dataKey="Publishing" fill={CHART_COLORS.amber} radius={[0, 3, 3, 0]} maxBarSize={14} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Publishing Platform Matrix ────────────────────────────────────────── */}
        <ChartCard
          title="Publishing Platform Matrix"
          subtitle="Videos published per channel per platform"
          height={300}
          tooltip="Total publish events by channel and destination platform."
        >
          {!publishingData || publishingData.length === 0 ? (
            <EmptyState hasFilters title="No publishing data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    <th className="text-left py-2 pr-4 text-[#71717A] font-medium">Channel</th>
                    {platforms.map(p => (
                      <th key={p} className="py-2 px-2 text-[#71717A] font-medium capitalize min-w-[60px] text-right">
                        {p}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-[#A1A1AA] font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {publishingData.slice(0, 12).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[#111] hover:bg-[#0d0d0d] cursor-pointer transition-colors"
                      onClick={() => updateFilters({ channel: row.channel })}
                    >
                      <td className="py-2 pr-4 text-[#E4E4E7] font-medium truncate max-w-[120px]">
                        {row.channel}
                      </td>
                      {platforms.map(p => {
                        const val = (row as any)[p] ?? 0;
                        return (
                          <td key={p} className="py-2 px-2 text-right">
                            <span className={cn(
                              'font-mono',
                              val > 0 ? 'text-[#E4E4E7]' : 'text-[#3a3a3a]',
                            )}>
                              {val > 0 ? val.toLocaleString() : '—'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="py-2 px-2 text-right font-semibold text-[#E4E4E7] font-mono">
                        {(row.total ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* ── Channel drill table ───────────────────────────────────────────────── */}
        <ChartCard
          title="Channel Detail Table"
          subtitle="All channels with health score and conversion stats"
          height={360}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['Channel', 'Uploaded', 'Published', 'Conversion', 'Not Published', 'Health Score', 'Quadrant', ''].map((h, i) => (
                    <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : 'text-right px-2')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(healthData ?? []).slice(0, 20).map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors"
                  >
                    <td className="py-2 pr-4 text-[#E4E4E7] font-medium truncate max-w-[130px]">
                      {row.channel}
                    </td>
                    <td className="py-2 px-2 text-right text-[#A1A1AA] font-mono">{row.total_uploaded.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-[#A1A1AA] font-mono">{row.total_published.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-mono">
                      <span className={cn(
                        row.publish_conversion_pct >= 70 ? 'text-green-400' :
                        row.publish_conversion_pct >= 40 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {row.publish_conversion_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[#A1A1AA]">
                      {(row.processed_not_published ?? 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      <span className={cn(
                        (row.health_score ?? 0) >= 70 ? 'text-green-400' :
                        (row.health_score ?? 0) >= 40 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {(row.health_score ?? 0).toFixed(0)}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded border capitalize"
                        style={{
                          color: QUADRANT_COLORS[row.health_quadrant] ?? '#aaa',
                          borderColor: QUADRANT_COLORS[row.health_quadrant] ?? '#333',
                          background: `${QUADRANT_COLORS[row.health_quadrant]}15`,
                        }}
                      >
                        {QUADRANT_LABELS[row.health_quadrant] ?? row.health_quadrant}
                      </span>
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => navigate(`/videos?channel=${encodeURIComponent(row.channel)}`)}
                        className="text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                        title="View in Explorer"
                      >
                        <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {healthData && (
            <div className="mt-3 flex justify-end">
              <ExportButton
                data={healthData as unknown as Record<string, unknown>[]}
                filename="channel-health"
              />
            </div>
          )}
        </ChartCard>

      </div>
    </DashboardLayout>
  );
};

export default ChannelAnalytics;
