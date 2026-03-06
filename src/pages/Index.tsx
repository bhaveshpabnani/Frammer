import React from 'react';
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
  Video, Scissors, Clock, Users, Play, Globe2, TrendingUp, Layers,
} from 'lucide-react';
import {
  kpis, monthlyMetrics, channelMetrics, outputTypeData, languageData,
} from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { formatNumber } from '@/lib/utils';
import { FunnelChart } from '@/components/FunnelChart';

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

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const Overview: React.FC = () => {
  // Build channel bar data
  const channelBar = channelMetrics.map((c) => ({
    channel: c.channel,
    Videos: c.videosProcessed,
    Clips: c.clipsGenerated,
  }));

  return (
    <DashboardLayout title="Overview" subtitle="Product usage analytics · Mar 2025 – Feb 2026">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Product Overview"
          subtitle="All-time performance across clients, channels and content types"
          badge={{ label: 'LIVE', variant: 'red' }}
          onDownload={() => {}}
        />

        {/* KPI Row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          {[
            { title: 'Videos Processed', value: formatNumber(kpis.totalVideos), trend: { value: kpis.momGrowth, label: 'MoM' }, icon: <Video size={16} />, accentColor: 'red' as const },
            { title: 'Clips Generated', value: formatNumber(kpis.totalClips), trend: { value: kpis.clipsGrowthMom, label: 'MoM' }, icon: <Scissors size={16} />, accentColor: 'red' as const },
            { title: 'Hours Processed', value: formatNumber(kpis.totalHoursProcessed), unit: 'hrs', icon: <Clock size={16} />, accentColor: 'blue' as const },
            { title: 'Avg Clips / Video', value: kpis.avgClipsPerVideo.toFixed(1), icon: <Layers size={16} />, accentColor: 'amber' as const },
            { title: 'Active Clients', value: kpis.activeClients, icon: <Users size={16} />, accentColor: 'green' as const },
            { title: 'Team Members', value: kpis.totalTeamMembers, icon: <Play size={16} />, accentColor: 'blue' as const },
          ].map((card, i) => (
            <motion.div key={i} variants={fadeIn}>
              <StatsCard {...card} />
            </motion.div>
          ))}
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Monthly Trend — spans 2 cols */}
          <div className="lg:col-span-2">
            <ChartCard
              title="Monthly Video & Clip Volume"
              subtitle="Videos processed and clips generated per month"
              height={260}
              tooltip="Count of source videos ingested and short-form clips produced each month."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyMetrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.red} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={CHART_COLORS.red} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Area type="monotone" dataKey="clipsGenerated" name="Clips" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#gradBlue)" dot={false} />
                  <Area type="monotone" dataKey="videosProcessed" name="Videos" stroke={CHART_COLORS.red} strokeWidth={2} fill="url(#gradRed)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Output Type Donut */}
          <ChartCard
            title="Output Type Mix"
            subtitle="Distribution of generated clips by type"
            height={260}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={outputTypeData}
                  dataKey="count"
                  nameKey="type"
                  cx="45%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {outputTypeData.map((entry, i) => (
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
                  formatter={(v) => (
                    <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Channel Volume */}
          <ChartCard
            title="Volume by Channel"
            subtitle="Videos processed and clips by distribution channel"
            height={240}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelBar} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="channel" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Videos" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Clips" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Language Distribution */}
          <ChartCard
            title="Language Distribution"
            subtitle="Content output across languages (top 8)"
            height={240}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={languageData}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="language"
                  type="category"
                  tick={{ fill: '#A1A1AA', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Clips" radius={[0, 3, 3, 0]} maxBarSize={16}>
                  {languageData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? CHART_COLORS.red : i === 1 ? CHART_COLORS.blue : CHART_COLORS.amber}
                      fillOpacity={i === 0 ? 1 : 0.7 - i * 0.05}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Content Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Content Processing Funnel"
            subtitle="Upload → Process → Publish conversion pipeline"
            height={200}
          >
            <FunnelChart
              stages={[
                { label: 'Uploaded', value: kpis.totalVideos, color: CHART_COLORS.red },
                { label: 'Processed', value: Math.round(kpis.totalVideos * 0.95), color: CHART_COLORS.amber },
                { label: 'Published', value: Math.round(kpis.totalVideos * 0.73), color: CHART_COLORS.green },
              ]}
              showConversionRate
            />
          </ChartCard>

          {/* Bottom summary cards — moved here as 4-col grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Top Channel', value: kpis.topChannel, sub: `${channelMetrics[0].videosProcessed} videos processed`, color: 'red' },
              { label: 'Top Language', value: kpis.topLanguage, sub: `${languageData[0].percentage}% of all output`, color: 'blue' },
              { label: 'Avg Processing Time', value: `${kpis.avgProcessingTimeMin} min`, sub: 'Per source video', color: 'amber' },
              { label: 'Clips : Video Ratio', value: `${kpis.avgClipsPerVideo}×`, sub: 'Content multiplication rate', color: 'green' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeIn}
                className="frammer-card p-4 flex flex-col gap-1"
              >
                <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71717A]">{item.label}</p>
                <p className={`font-metric text-2xl font-medium text-white`}>{item.value}</p>
                <p className="text-xs text-[#52525B] mt-0.5">{item.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Overview;
