import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FileText, Download, Printer, ChevronRight, TrendingUp, Clock, Video } from 'lucide-react';
import { channelMetrics, monthlyMetrics, teamMetrics, languageData } from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';

const TABS = ['Executive Summary', 'Trends', 'Channel', 'Language', 'Team', 'Presentation'] as const;
type Tab = typeof TABS[number];

const DarkTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-lg p-2 text-xs">
      <p className="text-[#71717A]">{label}</p>
      {payload.map((p: any) => <p key={p.dataKey} className="text-white font-metric">{p.value?.toLocaleString()}</p>)}
    </div>
  );
};

const COLORS = Object.values(CHART_COLORS);

const KPI_HIGHLIGHTS = [
  { label: 'Videos Processed', value: '1,284', delta: '+12%', positive: true },
  { label: 'Clips Generated', value: '4,621', delta: '+18%', positive: true },
  { label: 'Avg Processing Time', value: '19 min', delta: '-8%', positive: true },
  { label: 'Publish Rate', value: '73%', delta: '+3pp', positive: true },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Executive Summary');

  const handlePrint = () => window.print();

  const handleCSV = () => {
    const rows = [
      ['Month', 'Videos Processed', 'Clips Generated', 'Hours Processed'],
      ...monthlyMetrics.map((m) => [m.month, m.videosProcessed, m.clipsGenerated, m.hoursProcessed]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'frammer-report.csv';
    a.click();
  };

  return (
    <DashboardLayout title="Reports" subtitle="Generate and export analytics reports">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <PageHeader title="Reports" subtitle="Frammer Analytics — March 2025 to February 2026" />
          <div className="flex gap-2">
            <Button onClick={handleCSV} variant="outline" size="sm" className="text-xs border-[#27272A] text-[#A1A1AA] hover:text-white">
              <Download size={12} className="mr-1.5" /> Export CSV
            </Button>
            <Button onClick={handlePrint} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">
              <Printer size={12} className="mr-1.5" /> Print / PDF
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn('px-3 py-1.5 rounded-full text-xs transition-all', activeTab === t ? 'bg-frammer-red/15 text-white border border-frammer-red/30' : 'text-[#52525B] hover:text-white')}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 'Executive Summary' && (
          <div className="space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {KPI_HIGHLIGHTS.map((kpi) => (
                <div key={kpi.label} className="frammer-card p-4">
                  <p className="text-xs text-[#52525B] mb-2">{kpi.label}</p>
                  <p className="text-2xl font-metric text-white">{kpi.value}</p>
                  <Badge variant="outline" className={cn('mt-1 text-[10px] border px-1.5', kpi.positive ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30')}>
                    {kpi.delta}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Executive paragraph */}
            <div className="frammer-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-frammer-red" />
                <p className="text-sm font-semibold text-white">Executive Summary</p>
              </div>
              <p className="text-sm text-[#71717A] leading-relaxed">
                Frammer AI processed <strong className="text-white">1,284 videos</strong> from March 2025 to February 2026, generating{' '}
                <strong className="text-white">4,621 clips</strong> across 6 channels. Overall publishing throughput improved by{' '}
                <strong className="text-green-400">18%</strong> year-over-year, while average per-video processing time decreased by{' '}
                <strong className="text-green-400">8%</strong> to 19 minutes.
              </p>
              <p className="text-sm text-[#71717A] leading-relaxed">
                YouTube and LinkedIn remain the highest-volume channels. English-language content accounts for 42% of total volume. 
                The team maintained a <strong className="text-white">73% publish rate</strong>, with 3 percentage points of improvement vs. the prior period.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'Trends' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="frammer-card p-4 space-y-3">
              <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold flex items-center gap-2"><TrendingUp size={12} /> Monthly Videos Processed</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyMetrics}>
                  <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip content={<DarkTooltip />} />
                  <Line dataKey="videosProcessed" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="frammer-card p-4 space-y-3">
              <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold flex items-center gap-2"><Clock size={12} /> Avg Processing Time (min)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyMetrics}>
                  <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(0, 3)} />
                  <YAxis tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} width={35} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="avgProcessingTimeMin" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'Channel' && (
          <div className="frammer-card p-4 space-y-3">
            <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Clips Generated by Channel</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={channelMetrics} margin={{ left: 0 }}>
                <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="clipsGenerated" radius={[4, 4, 0, 0]}>
                  {channelMetrics.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'Language' && (
          <div className="frammer-card p-4 space-y-3">
            <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Content Volume by Language</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={languageData} dataKey="count" nameKey="language" innerRadius={50} outerRadius={90} paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {languageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'Team' && (
          <div className="frammer-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C] bg-[#0D0D0D]">
                  {['Team Member', 'Videos Processed', 'Clips Generated', 'Avg Time (min)'].map((h) => (
                    <th key={h} className="text-left text-[#52525B] uppercase tracking-wider py-2.5 px-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teamMetrics.map((m) => (
                  <tr key={m.name} className="border-b border-[#1C1C1C] hover:bg-white/2">
                    <td className="px-4 py-2.5 text-white">{m.name}</td>
                    <td className="px-4 py-2.5 text-[#A1A1AA] font-metric">{m.videosProcessed}</td>
                    <td className="px-4 py-2.5 text-[#A1A1AA] font-metric">{m.clipsGenerated}</td>
                    <td className="px-4 py-2.5 text-[#A1A1AA] font-metric">{m.avgProcessingTimeMin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'Presentation' && (
          <div className="space-y-3">
            <p className="text-xs text-[#52525B]">Presentation-ready slides — click <strong className="text-white">Print / PDF</strong> to export.</p>
            {['Executive Summary', 'Monthly Trends', 'Channel Performance', 'Team Highlights'].map((slide, i) => (
              <div key={slide} className="frammer-card p-4 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-frammer-red/15 border border-frammer-red/30 flex items-center justify-center text-xs font-metric text-frammer-red">{i + 1}</div>
                <p className="text-sm text-white">{slide}</p>
                <ChevronRight size={14} className="ml-auto text-[#52525B]" />
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
