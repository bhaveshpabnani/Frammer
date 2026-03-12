import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { ShieldCheck, AlertTriangle, TrendingUp } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { useScoresOverview, useScoresByDimension } from '@/hooks/useApi';

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

const GRADE_COLORS: Record<string, string> = {
  A: CHART_COLORS.green,
  B: CHART_COLORS.blue,
  C: CHART_COLORS.amber,
  D: '#f97316',
  F: CHART_COLORS.red,
};

const RISK_COLORS: Record<string, string> = {
  healthy: CHART_COLORS.green,
  warning: CHART_COLORS.amber,
  critical: CHART_COLORS.red,
};

const DIMENSIONS = ['channel', 'user', 'language', 'client', 'input_type', 'output_type'] as const;

const ScorecardsPage: React.FC = () => {
  const [selectedDim, setSelectedDim] = useState<string>('channel');
  const { data: overview } = useScoresOverview();
  const { data: scores } = useScoresByDimension(selectedDim);

  const totalCritical = overview?.overview?.reduce((s, o) => s + o.critical_count, 0) ?? 0;
  const totalWarning = overview?.overview?.reduce((s, o) => s + o.warning_count, 0) ?? 0;
  const totalHealthy = overview?.overview?.reduce((s, o) => s + o.healthy_count, 0) ?? 0;
  const avgScore = overview?.overview?.length
    ? Math.round(overview.overview.reduce((s, o) => s + o.portfolio_avg_score, 0) / overview.overview.length)
    : 0;

  const chartData = scores?.segments?.map(s => ({
    segment: s.segment,
    score: s.health_score,
    grade: s.grade,
    risk: s.risk_level,
  })) ?? [];

  return (
    <DashboardLayout title="Scorecards" subtitle="Health scores and grades across all dimensions">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Health Scorecards"
          subtitle="Systematic benchmarking and health grades across all operational dimensions"
          badge={{ label: 'SCORES', variant: 'green' }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            title="Portfolio Health"
            value={avgScore}
            unit="/ 100"
            icon={<ShieldCheck size={16} />}
            accentColor="blue"
          />
          <StatsCard
            title="Critical"
            value={totalCritical}
            unit="segments"
            icon={<AlertTriangle size={16} />}
            accentColor="red"
          />
          <StatsCard
            title="Warning"
            value={totalWarning}
            unit="segments"
            accentColor="amber"
          />
          <StatsCard
            title="Healthy"
            value={totalHealthy}
            unit="segments"
            icon={<TrendingUp size={16} />}
            accentColor="green"
          />
        </div>

        {/* Overview grid */}
        {overview?.overview && overview.overview.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {overview.overview.map((o, i) => (
              <motion.div
                key={o.dimension}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`frammer-card p-4 cursor-pointer hover:scale-[1.02] transition-transform ${
                  selectedDim === o.dimension ? 'border-frammer-red/40' : ''
                }`}
                onClick={() => setSelectedDim(o.dimension)}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#52525B] mb-1">
                  {o.dimension.replace('_', ' ')}
                </p>
                <p className="font-metric text-2xl font-medium text-white">{Math.round(o.portfolio_avg_score)}</p>
                <div className="flex gap-2 mt-2 text-[10px]">
                  <span className="text-red-400">{o.critical_count}C</span>
                  <span className="text-amber-400">{o.warning_count}W</span>
                  <span className="text-green-400">{o.healthy_count}H</span>
                </div>
                {o.worst_segment && (
                  <p className="text-[10px] text-[#52525B] mt-1 truncate" title={o.worst_segment}>
                    Worst: {o.worst_segment} ({Math.round(o.worst_score)})
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Score bar chart */}
        {chartData.length > 0 && (
          <ChartCard
            title={`Health Scores: ${selectedDim.replace('_', ' ')}`}
            subtitle="Composite score from volume, conversion, lag, and SLA metrics"
            height={320}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="segment" type="category" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="score" name="Health Score" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={RISK_COLORS[e.risk] || CHART_COLORS.blue} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Segment detail table */}
        {scores?.segments && scores.segments.length > 0 && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white">
                {selectedDim.replace('_', ' ')} Scorecard Detail
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    {['Segment', 'Score', 'Grade', 'Risk', 'Volume Rank', 'Conv. Rate', 'Lag Score', 'SLA Score', 'Trend'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scores.segments.map((s, i) => (
                    <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04]">
                      <td className="px-5 py-3 text-white font-medium">{s.segment}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${s.health_score}%`,
                                background: RISK_COLORS[s.risk_level] || CHART_COLORS.blue,
                              }}
                            />
                          </div>
                          <span className="font-metric text-xs text-[#A1A1AA]">{s.health_score}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="font-semibold text-xs px-1.5 py-0.5 rounded"
                          style={{
                            color: GRADE_COLORS[s.grade] || '#71717A',
                            background: `${GRADE_COLORS[s.grade] || '#71717A'}20`,
                          }}
                        >
                          {s.grade}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            color: RISK_COLORS[s.risk_level] || '#71717A',
                            background: `${RISK_COLORS[s.risk_level] || '#71717A'}20`,
                          }}
                        >
                          {s.risk_level}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{s.volume_rank.toFixed(1)}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{s.conversion_rate.toFixed(1)}%</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{s.lag_score.toFixed(1)}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{s.sla_score.toFixed(1)}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold ${
                          s.trend_direction === 'up' ? 'text-green-400' :
                          s.trend_direction === 'down' ? 'text-red-400' : 'text-[#52525B]'
                        }`}>
                          {s.trend_direction === 'up' ? '▲' : s.trend_direction === 'down' ? '▼' : '—'}
                          {s.trend_delta !== 0 && ` ${Math.abs(s.trend_delta).toFixed(1)}`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dimension tab buttons */}
        <div className="flex gap-2 flex-wrap">
          {DIMENSIONS.map(d => (
            <button
              key={d}
              onClick={() => setSelectedDim(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedDim === d
                  ? 'bg-frammer-red/20 text-white border border-frammer-red/30'
                  : 'bg-[#0F0F0F] text-[#71717A] border border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {d.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScorecardsPage;
