import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Layers, FileInput, FileOutput, ArrowRight } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { formatNumber, cn, downloadCsv } from '@/lib/utils';
import {
  useFunnel, useInputTypes, useOutputTypes, useMultiDimensional,
} from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import { FunnelChart } from '@/components/FunnelChart';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonPage } from '@/components/SkeletonPage';
import { ExportButton } from '@/components/ExportButton';
import { CrossFilterBar } from '@/components/CrossFilterChip';

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

const INPUT_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.cyan,
];
const OUTPUT_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.cyan, CHART_COLORS.rose,
];

const fadeIn  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export const ContentPerformanceContent: React.FC = () => {
  const navigate = useNavigate();
  const { filters, updateFilters } = useFilters();
  const [billableOnly, setBillableOnly] = useState(false);

  const { data: funnelData,   isLoading: funnelLoading }   = useFunnel();
  const { data: inputTypes,   isLoading: inputLoading }    = useInputTypes();
  const { data: outputTypes,  isLoading: outputLoading }   = useOutputTypes();
  const { data: heatmapData,  isLoading: heatmapLoading }  = useMultiDimensional(
    'input_type', 'output_type', 'uploaded', 10,
  );

  const isLoading = funnelLoading && inputLoading && outputLoading;

  // Derived funnel stages
  const findStage = (label: string) =>
    funnelData?.stages?.find(s => s.stage.toLowerCase() === label);
  const uploaded  = findStage('uploaded')?.count  ?? 0;
  const processed = findStage('processed')?.count ?? 0;
  const published = findStage('published')?.count ?? 0;

  // Total input type efficiency
  const totalInputUploaded  = inputTypes?.reduce((s, r) => s + r.count, 0) ?? 0;
  // Use per-type published sum when available, fall back to funnel published stage
  const totalInputPublished = (inputTypes?.some(r => (r.published ?? 0) > 0))
    ? (inputTypes?.reduce((s, r) => s + (r.published ?? 0), 0) ?? published)
    : published;
  const inputConvRate = totalInputUploaded > 0
    ? ((totalInputPublished / totalInputUploaded) * 100).toFixed(1)
    : null;

  // Input type bar data (efficiency = publish rate per type)
  const inputBarData = useMemo(() => {
    if (!inputTypes) return [];
    return inputTypes
      .slice(0, 8)
      .map(r => ({
        type:      r.type,
        Uploaded:  r.count,
        Published: r.published ?? 0,
        Hours:     Math.round(r.hours),
      }));
  }, [inputTypes]);

  // Output type pie
  const outputPieData = useMemo(() => {
    if (!outputTypes) return [];
    return outputTypes.slice(0, 8).map((r, i) => ({
      type:  r.type,
      count: r.count,
      color: OUTPUT_COLORS[i % OUTPUT_COLORS.length],
    }));
  }, [outputTypes]);

  // Input × Output heatmap data
  const heatmapMatrix = useMemo(() => {
    if (!heatmapData) return { rows: [], cols: [] };
    const { cells, dim1_values = [], dim2_values = [] } = heatmapData;
    const matrix: Record<string, Record<string, number>> = {};
    for (const cell of cells) {
      if (!matrix[cell.dim1]) matrix[cell.dim1] = {};
      matrix[cell.dim1][cell.dim2] = cell.uploaded;
    }
    return { rows: dim1_values, cols: dim2_values, matrix };
  }, [heatmapData]);

  // Max value for heatmap colour scale
  const heatmapMax = useMemo(() => {
    if (!heatmapData?.cells) return 1;
    return Math.max(...heatmapData.cells.map(c => c.uploaded), 1);
  }, [heatmapData]);

  const heatmapColor = (val: number) => {
    const alpha = Math.max(0.05, val / heatmapMax);
    return `rgba(239, 68, 68, ${alpha.toFixed(2)})`; // red tint
  };

  if (isLoading) return (
      <SkeletonPage statsCount={3} chartsCount={2} showTable />
  );

  return (
      <div className="space-y-6 animate-fade-in">

        <PageHeader
          title="Content & Funnel"
          subtitle="Upload → Process → Publish pipeline with content type breakdown"
          badge={{ label: 'LIVE', variant: 'red' }}
          onDownload={() => downloadCsv('frammer-content-performance', (inputTypes ?? []).map(r => ({ type: r.type, uploaded: r.count, hours: r.hours })))}
        />

        <CrossFilterBar />

        {/* ── Billable toggle ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const next = !billableOnly;
              setBillableOnly(next);
              updateFilters({ billableFlag: next ? 'true' : 'all' });
            }}
            className={cn(
              'text-xs px-3 py-1 rounded border transition-colors',
              billableOnly
                ? 'border-green-500/50 text-green-400 bg-green-500/10'
                : 'border-[#2a2a2a] text-[#71717A] hover:border-[#3a3a3a]',
            )}
          >
            {billableOnly ? '✓ ' : ''}Billable Only
          </button>
          <button
            onClick={() => {
              setBillableOnly(false);
              updateFilters({ billableFlag: 'all' });
            }}
            className="text-xs text-[#52525B] hover:text-[#A1A1AA]"
          >
            Show all
          </button>
        </div>

        {/* ── KPI Strip ────────────────────────────────────────────────────────── */}
        <motion.div variants={stagger} initial="hidden" animate="show">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { title: 'Total Uploaded',  value: formatNumber(uploaded),  icon: <Layers size={15} />,     accentColor: 'red' as const },
              { title: 'Total Processed', value: formatNumber(processed), icon: <FileInput size={15} />,  accentColor: 'blue' as const },
              { title: 'Total Published', value: formatNumber(published), unit: inputConvRate ? `${inputConvRate}% conversion rate` : undefined, icon: <FileOutput size={15} />, accentColor: 'green' as const },
              {
                title: 'Input Types',
                value: String(inputTypes?.length ?? '—'),
                icon: <FileInput size={15} />,
                accentColor: 'amber' as const,
              },
              {
                title: 'Output Types',
                value: String(outputTypes?.length ?? '—'),
                icon: <FileOutput size={15} />,
                accentColor: 'purple' as const,
              },
            ].map((card, i) => (
              <motion.div key={i} variants={fadeIn}>
                <StatsCard {...card} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Funnel + Output type pie ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Funnel */}
          <ChartCard
            title="Content Pipeline Funnel"
            subtitle="Upload → Process → Publish conversion"
            height={260}
            tooltip="Drop-off at each stage of the content pipeline."
          >
            <FunnelChart
              stages={[
                { label: 'Uploaded',  value: uploaded,  color: CHART_COLORS.red   },
                { label: 'Processed', value: processed, color: CHART_COLORS.blue  },
                { label: 'Published', value: published, color: CHART_COLORS.green },
              ]}
              showConversionRate
            />
          </ChartCard>

          {/* Output type mix */}
          <ChartCard
            title="Output Type Mix"
            subtitle="Clips generated by output type"
            height={260}
          >
            {outputPieData.length === 0 ? (
              <EmptyState hasFilters title="No output type data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outputPieData}
                    dataKey="count"
                    nameKey="type"
                    cx="45%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {outputPieData.map((entry, i) => (
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
                    formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* ── Input type funnel bar ─────────────────────────────────────────────── */}
        <ChartCard
          title="Input Type Breakdown"
          subtitle="Uploaded vs published by content input type"
          height={260}
          tooltip="Input types with highest upload volume — click a bar to filter."
        >
          {inputBarData.length === 0 ? (
            <EmptyState hasFilters title="No input type data" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inputBarData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis
                  dataKey="type"
                  tick={{ fill: '#71717A', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Legend formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
                <Bar
                  dataKey="Uploaded"
                  fill={CHART_COLORS.red}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={28}
                  onClick={(d) => updateFilters({ inputType: d.type })}
                  cursor="pointer"
                >
                  {inputBarData.map((_, i) => (
                    <Cell key={i} fill={INPUT_COLORS[i % INPUT_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
                <Bar dataKey="Published" fill={CHART_COLORS.green} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* ── Input × Output heatmap ────────────────────────────────────────────── */}
        <ChartCard
          title="Input × Output Type Heatmap"
          subtitle="Upload volume by input type (rows) × output type (columns)"
          height={320}
          tooltip="Dark cells = high volume combinations. Use this to spot dominant content production patterns."
        >
          {heatmapLoading ? (
            <div className="flex items-center justify-center h-48 text-[#52525B] text-sm">Loading…</div>
          ) : !heatmapData || heatmapData.cells.length === 0 ? (
            <EmptyState hasFilters title="No multi-dimensional data" />
          ) : (
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    <th className="text-left py-1.5 pr-3 text-[#52525B] font-medium min-w-[100px]">
                      Input ↓ / Output →
                    </th>
                    {(heatmapMatrix as any).cols?.map((col: string) => (
                      <th
                        key={col}
                        className="py-1.5 px-1 text-[#71717A] font-medium max-w-[80px] truncate text-center"
                        title={col}
                      >
                        {col.length > 8 ? col.slice(0, 8) + '…' : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(heatmapMatrix as any).rows?.map((row: string) => (
                    <tr key={row}>
                      <td className="py-1.5 pr-3 text-[#A1A1AA] font-medium truncate max-w-[100px]" title={row}>
                        {row.length > 12 ? row.slice(0, 12) + '…' : row}
                      </td>
                      {(heatmapMatrix as any).cols?.map((col: string) => {
                        const val = (heatmapMatrix as any).matrix?.[row]?.[col] ?? 0;
                        return (
                          <td key={col} className="py-1 px-1 text-center">
                            <div
                              className="rounded text-[10px] font-mono py-0.5 px-1 min-w-[36px] text-center"
                              style={{ background: heatmapColor(val), color: val > heatmapMax * 0.5 ? '#fff' : '#71717A' }}
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

        {/* ── Type efficiency table ─────────────────────────────────────────────── */}
        <ChartCard
          title="Input Type Efficiency"
          subtitle="Upload, publish, conversion rate and hours by input type — click to drill to Explorer"
          height={320}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['Input Type', 'Uploaded', 'Published', 'Conv. Rate', 'Hours', ''].map((h, i) => (
                    <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : 'text-right px-2')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(inputTypes ?? []).slice(0, 15).map((row, i) => {
                  const pub = row.published ?? 0;
                  const convRate = row.count > 0 ? ((pub / row.count) * 100).toFixed(1) : '—';
                  return (
                    <tr
                      key={i}
                      className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors cursor-pointer"
                      onClick={() => { updateFilters({ inputType: row.type }); navigate('/videos'); }}
                    >
                      <td className="py-2 pr-4 text-[#E4E4E7]">{row.type}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#A1A1AA]">{row.count.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-mono text-[#A1A1AA]">{pub.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-mono">
                        <span className={cn(
                          convRate === '—' ? 'text-[#52525B]' :
                          parseFloat(convRate) >= 70 ? 'text-green-400' :
                          parseFloat(convRate) >= 40 ? 'text-amber-400' : 'text-red-400',
                        )}>
                          {convRate === '—' ? '—' : `${convRate}%`}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[#71717A]">{row.hours.toFixed(1)}h</td>
                      <td className="py-2 pl-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/videos?inputType=${encodeURIComponent(row.type)}`); }}
                          className="text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                          title="View in Explorer"
                        >
                          <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {inputTypes && (
            <div className="mt-3 flex justify-end">
              <ExportButton
                data={inputTypes.map(r => ({ input_type: r.type, uploaded: r.count, published: r.published ?? 0, conversion_pct: r.count > 0 ? ((r.published ?? 0) / r.count * 100).toFixed(1) : '0', hours: r.hours }))}
                filename="input-types"
              />
            </div>
          )}
        </ChartCard>

      </div>
  );
};

const ContentPerformance: React.FC = () => (
  <DashboardLayout title="Content & Funnel" subtitle="Input types, output mix, funnel stages and content efficiency">
    <ContentPerformanceContent />
  </DashboardLayout>
);

export default ContentPerformance;
