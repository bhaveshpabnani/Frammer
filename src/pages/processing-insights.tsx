import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  AreaChart, Area, BarChart, Bar,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { Cpu, Clock, TrendingDown, Activity } from 'lucide-react';
import { monthlyMetrics, durationBuckets } from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">{Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

// Simulated avg processing time per month (improving over time)
const processingTrend = monthlyMetrics.map((m, i) => ({
  month: m.month,
  avgMinutes: +(34 - i * 0.6).toFixed(1),
  hoursProcessed: m.hoursProcessed,
}));

// Simulated queue health (0-100 score)
const queueHealth = [
  { date: '01 Feb', queue: 4, throughput: 5.2 },
  { date: '05 Feb', queue: 7, throughput: 4.8 },
  { date: '10 Feb', queue: 3, throughput: 5.6 },
  { date: '15 Feb', queue: 9, throughput: 4.4 },
  { date: '20 Feb', queue: 5, throughput: 5.1 },
  { date: '25 Feb', queue: 2, throughput: 5.8 },
  { date: '28 Feb', queue: 3, throughput: 5.5 },
];

// Generate 365-day heatmap data from monthly totals (deterministic)
const dailyHeatmapData = Array.from({ length: 365 }, (_, i) => {
  const date = new Date('2025-03-01');
  date.setDate(date.getDate() + i);
  const seed = Math.sin(i * 127.1) * 0.5 + 0.5;
  const monthIdx = Math.min(Math.floor(i / 30), monthlyMetrics.length - 1);
  const baseValue = monthlyMetrics[monthIdx].videosProcessed;
  return {
    date: date.toISOString().slice(0, 10),
    value: Math.round((baseValue / 30) * (0.3 + seed * 1.4)),
  };
});

const ProcessingInsights: React.FC = () => {
  return (
    <DashboardLayout title="Processing Insights" subtitle="AI pipeline performance, throughput and efficiency">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Processing Insights"
          subtitle="Understand your AI pipeline — speed, queue, throughput and cost efficiency"
          onDownload={() => {}}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Avg Processing Time" value="27.4 min" trend={{ value: -18.2, label: 'vs Mar 25' }} icon={<Clock size={16} />} accentColor="green" />
          <StatsCard title="Hours Processed" value="3,992 hrs" trend={{ value: 10.5, label: 'MoM' }} icon={<Cpu size={16} />} accentColor="red" />
          <StatsCard title="Pipeline Efficiency" value="94.2%" trend={{ value: 3.1, label: 'MoM' }} icon={<Activity size={16} />} accentColor="blue" />
          <StatsCard title="Longest Job" value="4h 12m" icon={<TrendingDown size={16} />} accentColor="amber" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Processing Time Trend" subtitle="Average minutes per source video — monthly" height={240}
            tooltip="Decreasing trend reflects AI efficiency improvements and team optimization.">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processingTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} unit="m" domain={[20, 40]} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="avgMinutes" name="Avg Time (min)" stroke={CHART_COLORS.green} strokeWidth={2.5}
                  fill="url(#gradGreen)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Hours Processed" subtitle="Total AI processing hours per month" height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="hoursProcessed" name="Hours Processed" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {processingTrend.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS.red} fillOpacity={0.5 + (i / processingTrend.length) * 0.5} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Queue + throughput */}
        <ChartCard title="Pipeline Queue & Throughput" subtitle="Feb 2026 — daily queue depth (jobs) and throughput (jobs/hr)" height={220}
          tooltip="Queue depth indicates pending jobs; throughput is completed jobs per hour.">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={queueHealth} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.amber} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.amber} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradBlue2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="queue" name="Queue Depth" stroke={CHART_COLORS.amber} strokeWidth={2} fill="url(#gradAmber)" dot={false} />
              <Area type="monotone" dataKey="throughput" name="Throughput (jobs/hr)" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#gradBlue2)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Input duration histo */}
        <ChartCard title="Input Duration Distribution" subtitle="How long are source videos ingested?" height={220}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={durationBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
              <XAxis dataKey="range" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="count" name="Videos" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {durationBuckets.map((_, i) => (
                  <Cell key={i} fill={i === 2 ? CHART_COLORS.red : CHART_COLORS.blue} fillOpacity={0.6 + (i === 2 ? 0.4 : 0)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Daily Processing Heatmap */}
        <ChartCard
          title="Daily Processing Activity"
          subtitle="Videos processed per day — last 52 weeks"
          height={160}
          tooltip="Each cell represents one day. Darker red = more videos processed that day."
        >
          <CalendarHeatmap
            data={dailyHeatmapData}
            colorScheme="red"
            label="Videos processed"
          />
        </ChartCard>
      </div>
    </DashboardLayout>
  );
};

export default ProcessingInsights;
