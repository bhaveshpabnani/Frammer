import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Play, Clock, Layers } from 'lucide-react';
import { channelMetrics, monthlyMetrics } from '@/data/mockData';
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

const CHANNEL_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
];

const ChannelAnalytics: React.FC = () => {
  const [selected, setSelected] = useState<string | null>(null);

  const radarData = channelMetrics.map((c) => ({
    channel: c.channel,
    Videos: Math.round((c.videosProcessed / Math.max(...channelMetrics.map(x => x.videosProcessed))) * 100),
    Clips: Math.round((c.clipsGenerated / Math.max(...channelMetrics.map(x => x.clipsGenerated))) * 100),
    Hours: Math.round((c.totalDurationHours / Math.max(...channelMetrics.map(x => x.totalDurationHours))) * 100),
  }));

  return (
    <DashboardLayout title="Channel Analytics" subtitle="Performance breakdown by distribution channel">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Channel Analytics"
          subtitle="How content distributes across YouTube, Instagram, LinkedIn and more"
          onDownload={() => {}}
        />

        {/* KPI Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Top Channel" value="YouTube" unit="412 videos" icon={<Play size={16} />} accentColor="red" />
          <StatsCard title="Total Channels" value="6" trend={{ value: 20, label: 'YoY' }} icon={<Layers size={16} />} accentColor="blue" />
          <StatsCard title="Highest Yield" value="Twitter/X" unit="6.5 clips/video" icon={<TrendingUp size={16} />} accentColor="amber" />
          <StatsCard title="Fastest Processing" value="Twitter/X" unit="18 min avg" icon={<Clock size={16} />} accentColor="green" />
        </div>

        {/* Channel cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {channelMetrics.map((c, i) => (
            <motion.button
              key={c.channel}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelected(selected === c.channel ? null : c.channel)}
              className={`frammer-card p-4 text-left flex flex-col gap-2 transition-all ${
                selected === c.channel ? 'border-current' : ''
              }`}
              style={{
                borderColor: selected === c.channel ? CHANNEL_COLORS[i] : undefined,
                boxShadow: selected === c.channel ? `0 0 20px ${CHANNEL_COLORS[i]}22` : undefined,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_COLORS[i] }} />
              <p className="text-xs font-semibold text-white">{c.channel}</p>
              <p className="font-metric text-xl font-medium text-white">{c.videosProcessed}</p>
              <p className="text-[11px] text-[#71717A]">{formatNumber(c.clipsGenerated)} clips</p>
              <p className="text-[11px] text-[#52525B]">{c.avgProcessingTimeMin} min avg</p>
            </motion.button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Videos & Clips by Channel" subtitle="Side-by-side comparison" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelMetrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="channel" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="videosProcessed" name="Videos" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} maxBarSize={24} />
                <Bar dataKey="clipsGenerated" name="Clips" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Avg Processing Time" subtitle="Minutes per video by channel" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelMetrics}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="channel" type="category" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="avgProcessingTimeMin" name="Avg Time (min)" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {channelMetrics.map((_, i) => (
                    <Cell key={i} fill={CHANNEL_COLORS[i]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Channel share table */}
        <div className="frammer-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C]">
            <h3 className="text-sm font-semibold text-white">Channel Performance Summary</h3>
            <p className="text-xs text-[#71717A] mt-0.5">All-time metrics per channel</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['Channel', 'Videos', 'Clips', 'Hours', 'Clips/Video', 'Avg Time'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channelMetrics.map((c, i) => (
                  <tr key={c.channel} className="border-b border-[#0F0F0F] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[i] }} />
                        <span className="text-sm font-medium text-white">{c.channel}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.videosProcessed.toLocaleString()}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.clipsGenerated.toLocaleString()}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.totalDurationHours.toLocaleString()}h</td>
                    <td className="px-5 py-3 font-metric text-white font-medium">
                      {(c.clipsGenerated / c.videosProcessed).toFixed(1)}×
                    </td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.avgProcessingTimeMin} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChannelAnalytics;
