import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  Cell, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Users, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { formatNumber, cn, downloadCsv } from '@/lib/utils';
import {
  useUserProductivity, useBenchmarks, useMultiDimensional, useMonthly,
  useQualityIssues, useTeams,
} from '@/hooks/useApi';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonPage } from '@/components/SkeletonPage';
import { ExportButton } from '@/components/ExportButton';
import { CrossFilterBar } from '@/components/CrossFilterChip';
import { InsightStrip, buildInsights } from '@/components/InsightStrip';
import { useFilters } from '@/contexts/FilterContext';

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

const fadeIn  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const TeamProductivity: React.FC = () => {
  const navigate = useNavigate();
  const { updateFilters } = useFilters();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const { data: productivityData, isLoading: prodLoading }       = useUserProductivity();
  const { data: benchmarkData,    isLoading: benchLoading }      = useBenchmarks('user', 'uploaded');
  const { data: specMatrix,       isLoading: specLoading }       = useMultiDimensional('user', 'output_type', 'uploaded', 10);
  const { data: monthlyData }                                    = useMonthly();
  const { data: missingTeamIssues }                              = useQualityIssues('missing_team', 50);
  const { data: teamsData }                                      = useTeams();

  const isLoading = prodLoading;

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalUsers      = productivityData?.length ?? 0;
  const avgProductivity = productivityData?.length
    ? productivityData.reduce((s, r) => s + (r.productivity_index ?? 0), 0) / productivityData.length
    : null;
  const avgConversion   = productivityData?.length
    ? productivityData.reduce((s, r) => s + (r.publish_conversion_pct ?? 0), 0) / productivityData.length
    : null;
  const missingTeamCount = missingTeamIssues?.length ?? 0;

  // ── Productivity index bar ───────────────────────────────────────────────────
  const prodBarData = useMemo(() => {
    if (!productivityData) return [];
    return productivityData
      .sort((a, b) => (b.productivity_index ?? 0) - (a.productivity_index ?? 0))
      .slice(0, 15)
      .map(r => ({
        user:              r.user,
        productivity:      parseFloat((r.productivity_index ?? 0).toFixed(2)),
        publish_rate:      parseFloat((r.publish_conversion_pct ?? 0).toFixed(1)),
      }));
  }, [productivityData]);

  // ── Consistency timeline (monthly filtered to selectedUser) ─────────────────
  const timelineData = useMemo(() => {
    if (!monthlyData) return [];
    return monthlyData.slice(-12).map(m => ({
      month:    m.month,
      Uploaded: m.videosProcessed,
    }));
  }, [monthlyData]);

  // ── Peer benchmarks ──────────────────────────────────────────────────────────
  const peerBenchmarkRows = useMemo(() => {
    if (!benchmarkData?.segments) return [];
    return benchmarkData.segments.slice(0, 15).map(s => ({
      user:          s.segment,
      value:         s.value,
      portfolio_avg: s.portfolio_avg,
      peer_avg:      s.peer_avg,
      percentile:    s.percentile,
    }));
  }, [benchmarkData]);

  // ── Specialization matrix ────────────────────────────────────────────────────
  const specRows  = specMatrix?.dim1_values?.slice(0, 8) ?? [];
  const specCols  = specMatrix?.dim2_values?.slice(0, 6) ?? [];
  const specMaxVal = specMatrix?.cells?.reduce((max, c) => Math.max(max, c.uploaded), 1) ?? 1;
  const specLookup: Record<string, Record<string, number>> = {};
  for (const cell of specMatrix?.cells ?? []) {
    if (!specLookup[cell.dim1]) specLookup[cell.dim1] = {};
    specLookup[cell.dim1][cell.dim2] = cell.uploaded;
  }

  // ── Insights ─────────────────────────────────────────────────────────────────
  const insights = buildInsights({
    caveats: missingTeamCount > 0
      ? [`${missingTeamCount} records have no team mapping — productivity metrics may be incomplete`]
      : [],
  });

  if (isLoading) return (
    <DashboardLayout title="Team Productivity" subtitle="Loading…">
      <SkeletonPage statsCount={4} chartsCount={2} showTable />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Team Productivity" subtitle="Individual and team performance diagnostics">
      <div className="space-y-6 animate-fade-in">

        <PageHeader
          title="Team & User Productivity"
          subtitle="Productivity index, peer benchmarks, specialization matrix, and consistency"
          badge={{ label: 'LIVE', variant: 'red' }}
          onDownload={() => downloadCsv('frammer-team-productivity', (productivityData ?? []).map(r => ({ user: r.user, total_uploaded: r.total_uploaded, total_published: r.total_published, publish_conversion_pct: r.publish_conversion_pct, productivity_index: r.productivity_index })))}
        />

        <CrossFilterBar />

        {/* Missing team warning */}
        {missingTeamCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-300 text-xs">
            <AlertTriangle size={13} className="flex-shrink-0" />
            <span>{missingTeamCount} records have no team mapping — assign teams to improve accuracy.</span>
            <button
              onClick={() => navigate('/quality')}
              className="ml-auto font-semibold opacity-80 hover:opacity-100"
            >
              Fix in Quality →
            </button>
          </div>
        )}

        {insights.length > 0 && <InsightStrip insights={insights} />}

        {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { title: 'Active Users',       value: formatNumber(totalUsers),   icon: <Users size={15} />,     accentColor: 'red'   as const },
              { title: 'Avg Productivity',   value: avgProductivity != null ? avgProductivity.toFixed(2) : '—', icon: <TrendingUp size={15} />, accentColor: 'blue' as const },
              { title: 'Avg Publish Rate',   value: avgConversion != null ? `${avgConversion.toFixed(1)}%` : '—', icon: <TrendingUp size={15} />, accentColor: (avgConversion ?? 0) >= 60 ? 'green' as const : 'amber' as const },
              { title: 'Missing Team Flags', value: String(missingTeamCount),   icon: <AlertTriangle size={15} />, accentColor: missingTeamCount > 0 ? 'amber' as const : 'green' as const },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeIn}>
                <StatsCard {...card} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Productivity index + Peer benchmark ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Productivity index bar */}
          <ChartCard
            title="Productivity Index by User"
            subtitle="Top 15 users sorted by productivity score"
            height={340}
            tooltip="Productivity index = (published videos × publish rate) relative to portfolio average."
          >
            {prodBarData.length === 0 ? (
              <EmptyState hasFilters title="No productivity data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={prodBarData}
                  layout="vertical"
                  margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: '#71717A', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="user"
                    type="category"
                    tick={{ fill: '#A1A1AA', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                  />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar
                    dataKey="productivity"
                    name="Productivity Index"
                    radius={[0, 3, 3, 0]}
                    maxBarSize={14}
                    onClick={d => setSelectedUser(d.user)}
                    cursor="pointer"
                  >
                    {prodBarData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.productivity >= 1 ? CHART_COLORS.green : CHART_COLORS.amber}
                        fillOpacity={selectedUser === entry.user ? 1 : 0.75}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Consistency timeline */}
          <ChartCard
            title="Monthly Volume Trend"
            subtitle={selectedUser ? `Showing team trend (user filter: ${selectedUser})` : 'Overall monthly uploads — click a user bar to focus'}
            height={340}
          >
            {timelineData.length === 0 ? (
              <EmptyState hasFilters title="No monthly data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="Uploaded"
                    stroke={CHART_COLORS.blue}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLORS.blue, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Specialization Matrix ─────────────────────────────────────────────── */}
        <ChartCard
          title="User Specialization Matrix"
          subtitle="Upload volume per user (rows) × output type (columns)"
          height={300}
          tooltip="Shows which output types each user specializes in based on upload volume."
        >
          {specLoading ? (
            <div className="flex items-center justify-center h-48 text-[#52525B] text-sm">Loading…</div>
          ) : specRows.length === 0 ? (
            <EmptyState hasFilters title="No specialization data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    <th className="text-left py-1.5 pr-3 text-[#52525B] font-medium min-w-[100px]">User</th>
                    {specCols.map(col => (
                      <th key={col} className="py-1.5 px-1 text-[#71717A] font-medium text-center max-w-[80px]" title={col}>
                        {col.length > 8 ? col.slice(0, 8) + '…' : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {specRows.map(row => (
                    <tr
                      key={row}
                      className={cn(
                        'hover:bg-[#0d0d0d] cursor-pointer transition-colors',
                        selectedUser === row && 'bg-[#111]',
                      )}
                      onClick={() => {
                        setSelectedUser(row === selectedUser ? null : row);
                        updateFilters({ teamMember: row === selectedUser ? 'all' : row });
                      }}
                    >
                      <td className="py-1.5 pr-3 text-[#A1A1AA] font-medium truncate max-w-[100px]" title={row}>
                        {row.length > 14 ? row.slice(0, 14) + '…' : row}
                      </td>
                      {specCols.map(col => {
                        const val = specLookup[row]?.[col] ?? 0;
                        const intensity = Math.max(0.05, val / specMaxVal);
                        return (
                          <td key={col} className="py-1 px-1 text-center">
                            <div
                              className="rounded text-[10px] font-mono py-0.5 px-1 min-w-[36px] text-center"
                              style={{
                                background: `rgba(59, 130, 246, ${intensity.toFixed(2)})`,
                                color: val > specMaxVal * 0.5 ? '#fff' : '#71717A',
                              }}
                            >
                              {val > 0 ? val.toLocaleString() : ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        {/* ── Peer Benchmark Table ──────────────────────────────────────────────── */}
        <ChartCard
          title="Peer Benchmark"
          subtitle="User performance relative to portfolio and peer average"
          height={320}
        >
          {benchLoading ? (
            <div className="flex items-center justify-center h-48 text-[#52525B] text-sm">Loading…</div>
          ) : peerBenchmarkRows.length === 0 ? (
            <EmptyState hasFilters title="No benchmark data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    {['User', 'Value', 'Portfolio Avg', 'Peer Avg', 'Percentile', ''].map((h, i) => (
                      <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : 'text-right px-2')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {peerBenchmarkRows.map((row, i) => (
                    <tr key={i} className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors">
                      <td className="py-2 pr-4 text-[#E4E4E7] truncate max-w-[120px]">{row.user}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#A1A1AA]">{row.value.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#71717A]">{row.portfolio_avg.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#71717A]">{row.peer_avg.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={cn(
                          'font-mono font-semibold',
                          row.percentile >= 75 ? 'text-green-400' :
                          row.percentile >= 25 ? 'text-amber-400' : 'text-red-400',
                        )}>
                          {row.percentile.toFixed(0)}th
                        </span>
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          onClick={() => navigate(`/videos?teamMember=${encodeURIComponent(row.user)}`)}
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
          )}
          {peerBenchmarkRows.length > 0 && (
            <div className="mt-3 flex justify-end">
              <ExportButton
                data={peerBenchmarkRows as Record<string, unknown>[]}
                filename="user-benchmarks"
              />
            </div>
          )}
        </ChartCard>

        {/* ── Detailed user table ────────────────────────────────────────────────── */}
        <ChartCard
          title="User Detail Table"
          subtitle="Full productivity metrics per user"
          height={320}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['User', 'Team', 'Uploaded', 'Published', 'Conversion', 'Hrs', 'Productivity', ''].map((h, i) => (
                    <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : 'text-right px-2')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(productivityData ?? []).slice(0, 20).map((row, i) => (
                  <tr key={i} className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors">
                    <td className="py-2 pr-4 text-[#E4E4E7] truncate max-w-[110px]">{row.user}</td>
                    <td className="py-2 px-2 text-right text-[#71717A]">{row.team_name ?? '—'}</td>
                    <td className="py-2 px-2 text-right font-mono text-[#A1A1AA]">{row.total_uploaded.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-mono text-[#A1A1AA]">{row.total_published.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-mono">
                      <span className={cn(
                        row.publish_conversion_pct >= 70 ? 'text-green-400' :
                        row.publish_conversion_pct >= 40 ? 'text-amber-400' : 'text-red-400',
                      )}>
                        {row.publish_conversion_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[#71717A]">
                      {row.uploaded_duration_hrs?.toFixed(1) ?? '—'}h
                    </td>
                    <td className="py-2 px-2 text-right font-mono">
                      <span className={cn(
                        (row.productivity_index ?? 0) >= 1 ? 'text-green-400' :
                        (row.productivity_index ?? 0) >= 0.5 ? 'text-amber-400' : 'text-red-400',
                      )}>
                        {(row.productivity_index ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 pl-2">
                      <button
                        onClick={() => navigate(`/videos?teamMember=${encodeURIComponent(row.user)}`)}
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
          {productivityData && (
            <div className="mt-3 flex justify-end">
              <ExportButton
                data={productivityData as unknown as Record<string, unknown>[]}
                filename="user-productivity"
              />
            </div>
          )}
        </ChartCard>

      </div>
    </DashboardLayout>
  );
};

export default TeamProductivity;
