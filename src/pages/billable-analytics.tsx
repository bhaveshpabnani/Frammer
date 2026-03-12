import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar,
  AreaChart, Area,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { DollarSign, AlertTriangle, ArrowUpRight, Filter } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import {
  useBillableMix, useBillableBySegment, useBillableFunnel, useBillableWaste,
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

const SEGMENT_DIMS = ['channel', 'user', 'language', 'client', 'input_type'] as const;

export const BillableAnalyticsContent: React.FC = () => {
  const [segDim, setSegDim] = useState<string>('channel');
  const { data: mix } = useBillableMix();
  const { data: segments } = useBillableBySegment(segDim);
  const { data: funnel } = useBillableFunnel();
  const { data: waste } = useBillableWaste();

  const totalBillable = mix?.reduce((s, m) => s + m.billable_count, 0) ?? 0;
  const totalNonBillable = mix?.reduce((s, m) => s + m.non_billable_count, 0) ?? 0;
  const avgBillableRate = mix?.length
    ? (mix.reduce((s, m) => s + m.billable_pct, 0) / mix.length).toFixed(1)
    : '—';
  const totalWaste = waste?.length ?? 0;

  // Monthly billable vs non-billable area chart
  const mixChart = mix?.map(m => ({
    month: m.month,
    Billable: m.billable_count,
    'Non-Billable': m.non_billable_count,
    'Billable %': m.billable_pct,
  })) ?? [];

  // Funnel chart
  const funnelStages = funnel ? [
    { stage: 'Uploaded', value: funnel.uploaded },
    { stage: 'Published', value: funnel.published },
    { stage: 'Billable', value: funnel.billable },
  ] : [];

  return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Billable Analytics"
          subtitle="Deep analysis of billable classification, segment breakdown, funnel, and waste identification"
          badge={{ label: 'BILLABLE', variant: 'amber' }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard title="Total Billable" value={totalBillable.toLocaleString()} icon={<DollarSign size={16} />} accentColor="green" />
          <StatsCard title="Total Non-Billable" value={totalNonBillable.toLocaleString()} icon={<Filter size={16} />} accentColor="amber" />
          <StatsCard title="Avg Billable Rate" value={avgBillableRate} unit="%" icon={<ArrowUpRight size={16} />} accentColor="blue" />
          <StatsCard title="Waste Segments" value={totalWaste} icon={<AlertTriangle size={16} />} accentColor="red" />
        </div>

        {/* Monthly trend */}
        {mixChart.length > 0 && (
          <ChartCard title="Monthly Billable vs Non-Billable" subtitle="Stacked area trend over time" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mixChart} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="Billable" stackId="1" fill={CHART_COLORS.green} stroke={CHART_COLORS.green} fillOpacity={0.4} />
                <Area type="monotone" dataKey="Non-Billable" stackId="1" fill={CHART_COLORS.amber} stroke={CHART_COLORS.amber} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Funnel chart */}
        {funnelStages.length > 0 && (
          <ChartCard title="Billable Funnel" subtitle="Videos flowing from upload → publish → billable" height={220}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelStages} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                <XAxis dataKey="stage" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]} maxBarSize={60} fill={CHART_COLORS.blue} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Segment breakdown */}
        <div className="flex gap-2 flex-wrap">
          {SEGMENT_DIMS.map(d => (
            <button
              key={d}
              onClick={() => setSegDim(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                segDim === d
                  ? 'bg-frammer-red/20 text-white border border-frammer-red/30'
                  : 'bg-[#0F0F0F] text-[#71717A] border border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {d.replace('_', ' ')}
            </button>
          ))}
        </div>

        {segments && segments.length > 0 && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white">
                Billable Breakdown by {segDim.replace('_', ' ')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    {['Segment', 'Billable', 'Non-Billable', 'Total', 'Billable %'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {segments.map((s, i) => (
                    <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04]">
                      <td className="px-5 py-2.5 text-white font-medium">{s.segment}</td>
                      <td className="px-5 py-2.5 font-metric text-green-400">{s.billable.toLocaleString()}</td>
                      <td className="px-5 py-2.5 font-metric text-amber-400">{s.non_billable.toLocaleString()}</td>
                      <td className="px-5 py-2.5 font-metric text-[#A1A1AA]">{s.total.toLocaleString()}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${s.billable_pct}%` }}
                            />
                          </div>
                          <span className="font-metric text-xs text-[#A1A1AA]">{s.billable_pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Waste table */}
        {waste && waste.length > 0 && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white">Waste Identification</h3>
              <p className="text-xs text-[#52525B] mt-0.5">Segments with high non-billable ratios or low utilization</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    {['Segment', 'Non-Billable Count', 'Total', 'Waste %', 'Duration (hrs)', 'Reason'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {waste.map((w, i) => (
                    <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04]">
                      <td className="px-5 py-2.5 text-white font-medium">{w.channel}</td>
                      <td className="px-5 py-2.5 font-metric text-red-400">{w.waste_count.toLocaleString()}</td>
                      <td className="px-5 py-2.5 font-metric text-[#A1A1AA]">—</td>
                      <td className="px-5 py-2.5 font-metric text-red-400">—</td>
                      <td className="px-5 py-2.5 font-metric text-[#A1A1AA]">{w.waste_hrs.toFixed(1)}</td>
                      <td className="px-5 py-2.5 text-xs text-[#71717A]">High non-billable volume</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
};

const BillableAnalyticsPage: React.FC = () => (
  <DashboardLayout title="Billable Analytics" subtitle="Deep billable vs non-billable analysis">
    <BillableAnalyticsContent />
  </DashboardLayout>
);

export default BillableAnalyticsPage;
