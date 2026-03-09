import React, { useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  PieChart, Pie, Cell, BarChart, Bar,
  ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { outputTypeData as mockOutputTypes } from '@/data/mockData';
import { CHART_COLORS, OUTPUT_TYPE_LABELS } from '@/types';
import { downloadCsv } from '@/lib/utils';
import { Layers, Scissors, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOutputTypes, useMonthly, useMultiDimensional } from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import { useNavigate } from 'react-router-dom';

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

const OutputTypes: React.FC = () => {
  const { data: liveOutputTypes } = useOutputTypes();
  const { data: liveMonthly } = useMonthly();
  const { data: outChannelData, isLoading: matrixLoading } = useMultiDimensional('output_type', 'channel', 'uploaded', 8);
  const { updateFilters } = useFilters();
  const navigate = useNavigate();
  const outputTypeData = liveOutputTypes ?? mockOutputTypes;
  const total = outputTypeData.reduce((s, d) => s + d.count, 0);

  useEffect(() => {
    if (!liveOutputTypes) console.warn('[OutputTypes] Output type data unavailable — showing mock fallback');
    if (!liveMonthly)     console.warn('[OutputTypes] Monthly data unavailable — showing mock fallback for trend chart');
  }, [liveOutputTypes, liveMonthly]);

  // Output × channel matrix
  const outChannelMatrix = useMemo(() => {
    if (!outChannelData) return { rows: [] as string[], cols: [] as string[], lookup: {} as Record<string, Record<string, number>>, maxVal: 1 };
    const { cells, dim1_values = [], dim2_values = [] } = outChannelData;
    const lookup: Record<string, Record<string, number>> = {};
    for (const c of cells) {
      if (!lookup[c.dim1]) lookup[c.dim1] = {};
      lookup[c.dim1][c.dim2] = c.uploaded;
    }
    const maxVal = Math.max(...cells.map(c => c.uploaded), 1);
    return { rows: dim1_values, cols: dim2_values, lookup, maxVal };
  }, [outChannelData]);

  // Derive monthly trend from real data (last 6 months × output-type proportions)
  const recentMonths = (liveMonthly ?? []).slice(-6);
  const monthlyOutputTrend: Record<string, string | number>[] = recentMonths.map((m) => {
    const row: Record<string, string | number> = { month: m.month };
    outputTypeData.forEach((o) => {
      row[o.type] = Math.round(m.videosProcessed * (o.count / Math.max(total, 1)));
    });
    return row;
  });

  return (
    <DashboardLayout title="Output Types" subtitle="Breakdown of all short-form content formats produced">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Output Type Analytics"
          subtitle="Reels, Shorts, Chapters, Summaries, Viral Clips — deep-dive"
          onDownload={() => downloadCsv('frammer-output-types', outputTypeData.map(o => ({ type: o.type, clips: o.count, published: o.published ?? 0, share_pct: (o.count / Math.max(total, 1) * 100).toFixed(1) })))}
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
              <p className="text-[10px] text-[#52525B]">clips</p>
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

          <ChartCard title="Output Type Trend" subtitle="Proportional monthly volume by output type (last 6 months)" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyOutputTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={1} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend formatter={(v) => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
                {outputTypeData.map((o) => (
                  <Bar key={o.type} dataKey={o.type} fill={o.color} radius={[3, 3, 0, 0]} maxBarSize={14} />
                ))}
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
                {['Output Type', 'Clips', 'Published', 'Conv. Rate', 'Share'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {outputTypeData.map((item, i) => (
                <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04] cursor-pointer"
                  onClick={() => { updateFilters({ outputType: item.type }); navigate('/videos'); }}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-sm font-medium text-white">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-metric text-[#A1A1AA]">{item.count.toLocaleString()}</td>
                  <td className="px-5 py-3 font-metric text-[#A1A1AA]">{(item.published ?? 0).toLocaleString()}</td>
                  <td className="px-5 py-3 font-metric">
                    {item.count > 0 ? (() => {
                      const rate = ((item.published ?? 0) / item.count * 100);
                      return (
                        <span className={rate >= 70 ? 'text-green-400' : rate >= 40 ? 'text-amber-400' : 'text-red-400'}>
                          {rate.toFixed(1)}%
                        </span>
                      );
                    })() : <span className="text-[#52525B]">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(item.count / total * 100).toFixed(1)}%`, background: item.color }} />
                      </div>
                      <span className="font-metric text-xs text-[#A1A1AA]">{(item.count / total * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Output type × channel matrix */}
        <ChartCard
          title="Output Type × Channel Matrix"
          subtitle="Upload volume per output type (rows) × channel (columns)"
          height={300}
          tooltip="Dark cells indicate high production volume for that output type on that channel."
        >
          {matrixLoading ? (
            <div className="flex items-center justify-center h-48 text-[#52525B] text-sm">Loading…</div>
          ) : outChannelMatrix.rows.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[#52525B] text-sm">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    <th className="text-left py-1.5 pr-3 text-[#52525B] font-medium min-w-[90px]">Output Type</th>
                    {outChannelMatrix.cols.map((col) => (
                      <th key={col} className="py-1.5 px-1 text-[#71717A] font-medium text-center max-w-[80px]" title={col}>
                        {col.length > 10 ? col.slice(0, 10) + '…' : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outChannelMatrix.rows.map((outType) => (
                    <tr
                      key={outType}
                      className="hover:bg-[#0d0d0d] cursor-pointer transition-colors"
                      onClick={() => { updateFilters({ outputType: outType }); navigate('/videos'); }}
                    >
                      <td className="py-1.5 pr-3 text-[#A1A1AA] font-medium">{outType}</td>
                      {outChannelMatrix.cols.map((col) => {
                        const val = outChannelMatrix.lookup[outType]?.[col] ?? 0;
                        const intensity = Math.max(0.05, val / outChannelMatrix.maxVal);
                        return (
                          <td key={col} className="py-1 px-1 text-center">
                            <div
                              className="rounded text-[10px] font-mono py-0.5 px-1 min-w-[36px] text-center"
                              style={{
                                background: `rgba(59, 130, 246, ${intensity.toFixed(2)})`,
                                color: val > outChannelMatrix.maxVal * 0.5 ? '#fff' : '#71717A',
                              }}
                            >
                              {val > 0 ? val.toLocaleString() : ''}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

      </div>
    </DashboardLayout>
  );
};

export default OutputTypes;
