import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Layers, ArrowUpRight, Clock, TrendingUp } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import {
  usePlatformMix, usePlatformConversion, usePlatformDuration, usePlatformTrend,
} from '@/hooks/useApi';

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

const PIE_COLORS = [CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan];

export const PlatformAnalyticsContent: React.FC = () => {
  const { data: mix } = usePlatformMix();
  const { data: conversion } = usePlatformConversion();
  const { data: duration } = usePlatformDuration();
  const { data: trend } = usePlatformTrend();

  const totalPlatforms = conversion?.length ?? 0;
  const avgConv = conversion?.length
    ? (conversion.reduce((s, c) => s + c.conversion_pct, 0) / conversion.length).toFixed(1)
    : '—';
  const totalDuration = duration?.reduce((s, d) => s + d.duration_hrs, 0)?.toFixed(0) ?? 0;
  const topPlatform = conversion?.length
    ? conversion.reduce((best, c) => c.conversion_pct > best.conversion_pct ? c : best, conversion[0]).platform
    : '—';

  // Duration as pie chart data
  const durationPie = duration?.map(d => ({
    name: d.platform,
    value: parseFloat(d.duration_hrs.toFixed(1)),
  })) ?? [];

  // Trend line data: pivot [{ month_label, platform, count }] → [{ month, [platform]: count }]
  const trendMap = new Map<string, Record<string, any>>();
  const platformSet = new Set<string>();
  trend?.forEach(t => {
    const key = t.month_label;
    platformSet.add(t.platform);
    if (!trendMap.has(key)) trendMap.set(key, { month: key });
    trendMap.get(key)![t.platform] = t.count;
  });
  const trendData = [...trendMap.values()].sort((a, b) => (a.month as string).localeCompare(b.month as string));
  const platforms = [...platformSet];

  return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Platform Analytics"
          subtitle="Deep analysis of platform (output type) mix, conversion, duration, and trends"
          badge={{ label: 'PLATFORMS', variant: 'blue' }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Platforms Tracked" value={totalPlatforms} icon={<Layers size={16} />} accentColor="blue" />
          <StatsCard title="Avg Conversion" value={avgConv} unit="%" icon={<ArrowUpRight size={16} />} accentColor="green" />
          <StatsCard title="Total Duration" value={totalDuration} unit="hrs" icon={<Clock size={16} />} accentColor="amber" />
          <StatsCard title="Top Platform" value={topPlatform} icon={<TrendingUp size={16} />} accentColor="purple" />
        </div>

        {/* Platform × OutputType matrix */}
        {mix?.cells && mix.cells.length > 0 && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white">Platform × Output Type Matrix</h3>
              <p className="text-xs text-[#52525B] mt-0.5">Video counts by platform and output type combination</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">Platform</th>
                    <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">Output Type</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">Published</th>
                    <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">Duration (hrs)</th>
                  </tr>
                </thead>
                <tbody>
                  {mix.cells.map((m, i) => (
                    <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04]">
                      <td className="px-5 py-2.5 text-white font-medium">{m.platform}</td>
                      <td className="px-5 py-2.5 text-[#A1A1AA]">{m.output_type}</td>
                      <td className="px-5 py-2.5 text-right font-metric text-[#A1A1AA]">{m.published_count.toLocaleString()}</td>
                      <td className="px-5 py-2.5 text-right font-metric text-[#71717A]">{m.duration_hrs.toFixed(1)}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Conversion bar chart + Duration pie */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {conversion && conversion.length > 0 && (
            <ChartCard title="Conversion by Platform" subtitle="Upload-to-publish rate by platform" height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversion} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                  <XAxis dataKey="platform" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="conversion_pct" name="Conversion %" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {durationPie.length > 0 && (
            <ChartCard title="Duration Share" subtitle="Total hours distribution by platform" height={260}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={durationPie}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    label={(e) => `${e.name}: ${e.value}h`}
                  >
                    {durationPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Monthly trend */}
        {trendData.length > 0 && (
          <ChartCard title="Monthly Trend by Platform" subtitle="Video count over time per platform" height={320}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#71717A' }} />
                {platforms.map((p, i) => (
                  <Line
                    key={p}
                    type="monotone"
                    dataKey={p}
                    name={p}
                    stroke={PIE_COLORS[i % PIE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
  );
};

const PlatformAnalyticsPage: React.FC = () => (
  <DashboardLayout title="Platform Analytics" subtitle="Deep platform and output-type analysis">
    <PlatformAnalyticsContent />
  </DashboardLayout>
);

export default PlatformAnalyticsPage;
