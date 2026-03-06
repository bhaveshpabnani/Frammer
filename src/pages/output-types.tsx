import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { outputTypeData } from '@/data/mockData';
import { CHART_COLORS, OUTPUT_TYPE_LABELS } from '@/types';
import { Layers, Scissors, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

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

// Monthly output type trend (simulated)
const monthlyOutputTrend = [
  { month: 'Sep 25', Reel: 180, Short: 138, 'Viral Clip': 127, Chapter: 104, Summary: 71 },
  { month: 'Oct 25', Reel: 207, Short: 159, 'Viral Clip': 146, Chapter: 119, Summary: 81 },
  { month: 'Nov 25', Reel: 228, Short: 176, 'Viral Clip': 161, Chapter: 131, Summary: 89 },
  { month: 'Dec 25', Reel: 197, Short: 151, 'Viral Clip': 139, Chapter: 113, Summary: 77 },
  { month: 'Jan 26', Reel: 254, Short: 195, 'Viral Clip': 179, Chapter: 146, Summary: 99 },
  { month: 'Feb 26', Reel: 282, Short: 217, 'Viral Clip': 199, Chapter: 162, Summary: 110 },
];

const OutputTypes: React.FC = () => {
  const total = outputTypeData.reduce((s, d) => s + d.count, 0);

  return (
    <DashboardLayout title="Output Types" subtitle="Breakdown of all short-form content formats produced">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Output Type Analytics"
          subtitle="Reels, Shorts, Chapters, Summaries, Viral Clips — deep-dive"
          onDownload={() => {}}
        />

        {/* Output type cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {outputTypeData.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="frammer-card p-4 flex flex-col gap-2 hover:border-current transition-all"
              style={{ borderColor: `${item.color}40` }}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: item.color }}>
                {item.type}
              </p>
              <p className="font-metric text-2xl font-medium text-white">{item.count.toLocaleString()}</p>
              <div className="flex items-center gap-1">
                <div className="flex-1 h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(item.count / total * 100).toFixed(1)}%`, background: item.color }}
                  />
                </div>
                <span className="text-[10px] text-[#71717A]">{(item.count / total * 100).toFixed(1)}%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Output Mix — Donut" subtitle="Share of total clips by output type" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={outputTypeData} dataKey="count" nameKey="type"
                  cx="45%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} strokeWidth={0}>
                  {outputTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} iconType="circle"
                  formatter={(v) => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Output Type Trend" subtitle="Monthly volume per format (last 6 months)" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyOutputTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={1} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Reel" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="Short" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="Viral Clip" fill={CHART_COLORS.amber} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="Chapter" fill={CHART_COLORS.purple} radius={[3, 3, 0, 0]} maxBarSize={14} />
                <Bar dataKey="Summary" fill={CHART_COLORS.green} radius={[3, 3, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Table */}
        <div className="frammer-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C]">
            <h3 className="text-sm font-semibold text-white">Output Type Summary</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1C1C1C]">
                {['Output Type', 'Count', 'Share', 'MoM Growth'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outputTypeData.map((item, i) => (
                <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm font-medium text-white">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-metric text-[#A1A1AA]">{item.count.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.count / total * 100).toFixed(1)}%`, background: item.color }} />
                      </div>
                      <span className="font-metric text-xs text-[#A1A1AA]">{(item.count / total * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="badge-green text-xs">+{(8 + i * 1.2).toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OutputTypes;
