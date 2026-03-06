import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Video, Scissors } from 'lucide-react';
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

// Mock client data
const clients = [
  {
    id: 'client_1',
    name: 'Client 1',
    industry: 'EdTech',
    videos: 389,
    clips: 2529,
    channels: ['YouTube', 'Instagram'],
    languages: ['English', 'Hindi'],
    joinDate: 'Mar 2025',
    status: 'active',
    growth: 14.2,
  },
  {
    id: 'client_2',
    name: 'Client 2',
    industry: 'FinTech',
    videos: 287,
    clips: 1866,
    channels: ['LinkedIn', 'YouTube'],
    languages: ['English'],
    joinDate: 'Apr 2025',
    status: 'active',
    growth: 11.8,
  },
  {
    id: 'client_3',
    name: 'Client 3',
    industry: 'Healthcare',
    videos: 241,
    clips: 1567,
    channels: ['Instagram', 'Twitter/X'],
    languages: ['English', 'Spanish'],
    joinDate: 'May 2025',
    status: 'active',
    growth: 9.4,
  },
  {
    id: 'client_4',
    name: 'Client 4',
    industry: 'D2C / FMCG',
    videos: 218,
    clips: 1417,
    channels: ['Instagram', 'YouTube'],
    languages: ['Hindi', 'English'],
    joinDate: 'Jun 2025',
    status: 'active',
    growth: 8.1,
  },
  {
    id: 'client_5',
    name: 'Client 5',
    industry: 'Media & Entertainment',
    videos: 196,
    clips: 1274,
    channels: ['YouTube', 'Podcast'],
    languages: ['English', 'French'],
    joinDate: 'Jul 2025',
    status: 'active',
    growth: 7.6,
  },
];

const clientBarData = clients.map((c) => ({
  name: c.name,
  Videos: c.videos,
  Clips: c.clips,
}));

const CLIENT_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple,
];

const ClientPortal: React.FC = () => {
  return (
    <DashboardLayout title="Client Portal" subtitle="Per-client usage, volume and performance metrics">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Client Portal"
          subtitle="Monitor usage, volume and health for each client account"
          badge={{ label: 'NEW', variant: 'blue' }}
          onDownload={() => {}}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Active Clients" value={clients.length} trend={{ value: 25, label: 'YoY' }} icon={<Users size={16} />} accentColor="red" />
          <StatsCard title="Avg Videos / Client" value={Math.round(clients.reduce((s, c) => s + c.videos, 0) / clients.length)} icon={<Video size={16} />} accentColor="blue" />
          <StatsCard title="Avg Clips / Client" value={formatNumber(Math.round(clients.reduce((s, c) => s + c.clips, 0) / clients.length))} icon={<Scissors size={16} />} accentColor="amber" />
          <StatsCard title="Avg MoM Growth" value="10.2%" trend={{ value: 10.2, label: 'MoM' }} icon={<TrendingUp size={16} />} accentColor="green" />
        </div>

        {/* Client summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {clients.map((client, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="frammer-card p-4 flex flex-col gap-3 cursor-pointer"
              style={{ borderColor: `${CLIENT_COLORS[i]}30` }}
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: CLIENT_COLORS[i] }}>
                  {client.name.split(' ').slice(-1)[0]}
                </div>
                <span className="badge-green text-xs">+{client.growth.toFixed(1)}%</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{client.name}</p>
                <p className="text-xs text-[#71717A]">{client.industry}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#52525B]">Videos</span>
                  <span className="font-metric text-[#A1A1AA]">{client.videos}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52525B]">Clips</span>
                  <span className="font-metric text-[#A1A1AA]">{client.clips.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#52525B]">Since</span>
                  <span className="text-[#A1A1AA]">{client.joinDate}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {client.channels.map((ch) => (
                  <span key={ch} className="badge-blue text-[10px] px-1.5 py-0.5">{ch}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Comparison charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Client Volume Comparison" subtitle="Videos processed and clips generated per client" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Videos" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Clips" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Client Growth Rate" subtitle="Month-over-month growth % estimates" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clients} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="growth" name="MoM Growth %" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {clients.map((_, i) => <Cell key={i} fill={CLIENT_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Client detail table */}
        <div className="frammer-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C]">
            <h3 className="text-sm font-semibold text-white">Client Account Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['Client', 'Industry', 'Videos', 'Clips', 'Top Channel', 'Languages', 'Since', 'MoM'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c.id} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: CLIENT_COLORS[i] }}>
                          {c.name.split(' ').slice(-1)[0]}
                        </div>
                        <span className="text-sm font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#71717A] text-xs">{c.industry}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.videos}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.clips.toLocaleString()}</td>
                    <td className="px-5 py-3 text-[#A1A1AA] text-xs">{c.channels[0]}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.languages.map((l) => (
                          <span key={l} className="badge-blue text-[10px]">{l}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[#71717A] text-xs">{c.joinDate}</td>
                    <td className="px-5 py-3">
                      <span className="badge-green text-xs">+{c.growth.toFixed(1)}%</span>
                    </td>
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

export default ClientPortal;
