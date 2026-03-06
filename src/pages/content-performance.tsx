import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import { InteractiveMetricCard } from '@/components/InteractiveMetricCard';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Scissors, Video, Clock, TrendingUp, Play } from 'lucide-react';
import {
  monthlyMetrics, durationBuckets, inputTypeData,
} from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { formatNumber } from '@/lib/utils';

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

const ContentPerformance: React.FC = () => {
  const [activeInputType, setActiveInputType] = useState<string | null>(null);

  // Avg clips per video per month
  const efficiency = monthlyMetrics.map((m) => ({
    month: m.month,
    ratio: +(m.clipsGenerated / m.videosProcessed).toFixed(2),
    videos: m.videosProcessed,
    clips: m.clipsGenerated,
  }));

  return (
    <DashboardLayout
      title="Content Performance"
      subtitle="Clip yield, processing efficiency and input type analysis"
    >
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Content Performance"
          subtitle="How source videos convert into short-form output"
          badge={{ label: 'LIVE', variant: 'red' }}
          onDownload={() => {}}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Total Source Videos" value="1,996" trend={{ value: 10.5, label: 'MoM' }} icon={<Video size={16} />} accentColor="red" />
          <StatsCard title="Total Clips Out" value="12,974" trend={{ value: 10.5, label: 'MoM' }} icon={<Scissors size={16} />} accentColor="blue" />
          <StatsCard title="Avg Clips / Video" value="6.5×" trend={{ value: 3.2, label: 'MoM' }} icon={<TrendingUp size={16} />} accentColor="amber" />
          <StatsCard title="Avg Processing" value="27.4 min" trend={{ value: -4.1, label: 'MoM' }} icon={<Clock size={16} />} accentColor="green" />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Clip yield trend */}
          <ChartCard
            title="Clip Yield Trend"
            subtitle="Average clips generated per source video — monthly"
            height={240}
            tooltip="Higher ratio = more content extracted per video."
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[4, 8]} />
                <Tooltip content={<DarkTooltip />} />
                <Line
                  type="monotone"
                  dataKey="ratio"
                  name="Clips/Video"
                  stroke={CHART_COLORS.red}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: CHART_COLORS.red, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Processing duration histogram */}
          <ChartCard
            title="Input Duration Distribution"
            subtitle="Source video length buckets"
            height={240}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={durationBuckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Videos" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {durationBuckets.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 2 ? CHART_COLORS.red : CHART_COLORS.blue}
                      fillOpacity={i === 2 ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Input Type breakdown */}
        <ChartCard
          title="Input Type Breakdown"
          subtitle="Volume and hours by source format"
          height={220}
        >
          <div className="grid grid-cols-5 gap-3 h-full py-2">
            {inputTypeData.map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveInputType(activeInputType === item.type ? null : item.type)}
                className={`rounded-xl p-4 text-left transition-all border flex flex-col gap-2 ${
                  activeInputType === item.type
                    ? 'border-current'
                    : 'border-[#1C1C1C] hover:border-[#3F3F46]'
                }`}
                style={{
                  background: `${item.color}10`,
                  borderColor: activeInputType === item.type ? item.color : undefined,
                }}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: item.color }}>
                  {item.type}
                </p>
                <p className="font-metric text-2xl font-medium text-white">{formatNumber(item.count)}</p>
                <p className="text-xs text-[#71717A]">{formatNumber(item.hours)} hrs</p>
              </motion.button>
            ))}
          </div>
        </ChartCard>

        {/* Expandable metric cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {monthlyMetrics.slice(-6).map((m, i) => (
            <InteractiveMetricCard
              key={i}
              title={m.month}
              value={formatNumber(m.clipsGenerated)}
              subtitle="clips"
              trend={{ value: i > 0 ? +((m.clipsGenerated / monthlyMetrics[monthlyMetrics.length - 7 + i - 1].clipsGenerated - 1) * 100).toFixed(1) : 0, label: 'vs prev' }}
              details={[
                { label: 'Videos', value: m.videosProcessed },
                { label: 'Hours', value: `${m.hoursProcessed}h` },
                { label: 'Clips/Video', value: (m.clipsGenerated / m.videosProcessed).toFixed(1) },
              ]}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContentPerformance;
