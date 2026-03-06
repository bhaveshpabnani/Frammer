import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import { DrillDownModal } from '@/components/DrillDownModal';
import {
  BarChart, Bar, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Clock, Award } from 'lucide-react';
import { teamMetrics } from '@/data/mockData';
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

const MEMBER_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
];

const TeamProductivity: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<typeof teamMetrics[0] | null>(null);

  const radarData = [
    { metric: 'Videos', ...Object.fromEntries(teamMetrics.map((m) => [m.name.split(' ')[0], Math.round(m.videosProcessed / 2.18)])) },
    { metric: 'Clips', ...Object.fromEntries(teamMetrics.map((m) => [m.name.split(' ')[0], Math.round(m.clipsGenerated / 14.17)])) },
    { metric: 'Speed', ...Object.fromEntries(teamMetrics.map((m) => [m.name.split(' ')[0], Math.round((40 - m.avgProcessingTimeMin) / 0.17)])) },
  ];

  return (
    <DashboardLayout title="Team Productivity" subtitle="Individual performance, workload and output breakdown">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Team Productivity"
          subtitle="How each team member contributes to Frammer AI's output"
          onDownload={() => {}}
        />

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Team Size" value={teamMetrics.length} trend={{ value: 20, label: 'YoY' }} icon={<Users size={16} />} accentColor="blue" />
          <StatsCard title="Top Contributor" value="Priya S." unit="218 videos" icon={<Award size={16} />} accentColor="red" />
          <StatsCard title="Avg Videos/Member" value={Math.round(teamMetrics.reduce((s, m) => s + m.videosProcessed, 0) / teamMetrics.length)} icon={<TrendingUp size={16} />} accentColor="amber" />
          <StatsCard title="Avg Processing" value="28.3 min" trend={{ value: -3.8, label: 'MoM' }} icon={<Clock size={16} />} accentColor="green" />
        </div>

        {/* Member cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {teamMetrics.map((member, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedMember(member)}
              className="frammer-card p-4 text-left flex flex-col gap-2 cursor-pointer"
              style={{ borderColor: `${MEMBER_COLORS[i]}30` }}
            >
              {/* Avatar circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: MEMBER_COLORS[i] }}
              >
                {member.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <p className="text-sm font-semibold text-white leading-tight">{member.name}</p>
              <p className="font-metric text-xl font-medium text-white">{member.videosProcessed}</p>
              <p className="text-[11px] text-[#71717A]">videos · {member.clipsGenerated} clips</p>
              <div className="w-full h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(member.videosProcessed / teamMetrics[0].videosProcessed) * 100}%`,
                    background: MEMBER_COLORS[i],
                  }}
                />
              </div>
            </motion.button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Clips Generated per Member" subtitle="Total output breakdown" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamMetrics}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 16, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={72} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="clipsGenerated" name="Clips" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {teamMetrics.map((_, i) => <Cell key={i} fill={MEMBER_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Avg Processing Time by Member" subtitle="Minutes per source video" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamMetrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => v.split(' ')[0]} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[20, 36]} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="avgProcessingTimeMin" name="Avg Time (min)" radius={[4, 4, 0, 0]} maxBarSize={36}>
                  {teamMetrics.map((_, i) => <Cell key={i} fill={MEMBER_COLORS[i]} fillOpacity={0.8} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Full table */}
        <div className="frammer-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C]">
            <h3 className="text-sm font-semibold text-white">Team Performance Table</h3>
            <p className="text-xs text-[#71717A] mt-0.5">Click a row for output type breakdown</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1C1C1C]">
                {['Member', 'Videos', 'Clips', 'Clips/Video', 'Avg Time', 'Top Format'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamMetrics.map((m, i) => {
                const topFormat = Object.entries(m.outputTypes)
                  .sort(([, a], [, b]) => b - a)[0]?.[0] ?? '—';
                return (
                  <tr
                    key={i}
                    className="border-b border-[#0F0F0F] hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => setSelectedMember(m)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: MEMBER_COLORS[i] }}>
                          {m.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium text-white">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{m.videosProcessed}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{m.clipsGenerated.toLocaleString()}</td>
                    <td className="px-5 py-3 font-metric text-white font-medium">
                      {(m.clipsGenerated / m.videosProcessed).toFixed(1)}×
                    </td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{m.avgProcessingTimeMin} min</td>
                    <td className="px-5 py-3">
                      <span className="badge-red text-xs capitalize">{topFormat}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Drill-down modal */}
        {selectedMember && (
          <DrillDownModal
            open={!!selectedMember}
            onClose={() => setSelectedMember(null)}
            title={selectedMember.name}
            subtitle={`${selectedMember.videosProcessed} videos · ${selectedMember.clipsGenerated} clips · ${selectedMember.avgProcessingTimeMin} min avg`}
            tabs={[
              {
                id: 'output',
                label: 'Output Breakdown',
                content: (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(selectedMember.outputTypes).map(([type, count], i) => (
                      <div key={i} className="frammer-card p-4">
                        <p className="text-xs text-[#71717A] uppercase tracking-wide mb-1">{type}</p>
                        <p className="font-metric text-2xl font-medium text-white">{count?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                id: 'stats',
                label: 'Stats',
                content: (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Videos Processed', value: selectedMember.videosProcessed },
                      { label: 'Clips Generated', value: selectedMember.clipsGenerated.toLocaleString() },
                      { label: 'Avg Time (min)', value: selectedMember.avgProcessingTimeMin },
                    ].map((s, i) => (
                      <div key={i} className="frammer-card p-4">
                        <p className="text-xs text-[#71717A] uppercase tracking-wide mb-1">{s.label}</p>
                        <p className="font-metric text-2xl font-medium text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default TeamProductivity;
