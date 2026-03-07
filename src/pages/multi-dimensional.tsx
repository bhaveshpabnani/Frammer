import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { ChartCard } from '@/components/chart-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useMultiDimensional } from '@/hooks/useApi';

const DIMENSION_OPTIONS = [
  { value: 'channel', label: 'Channel' },
  { value: 'language', label: 'Language' },
  { value: 'input_type', label: 'Input Type' },
  { value: 'output_type', label: 'Output Type' },
  { value: 'user', label: 'User' },
  { value: 'client', label: 'Client' },
];

const METRIC_OPTIONS = [
  { value: 'uploaded', label: 'Videos Uploaded' },
  { value: 'published', label: 'Videos Published' },
  { value: 'created', label: 'Clips Generated' },
  { value: 'duration', label: 'Duration (hrs)' },
];

/** Generate a color on a blue→red heat scale from 0..1 */
function heatColor(ratio: number): string {
  // dark blue → mid purple → vivid red
  const r = Math.round(20 + ratio * 215);
  const g = Math.round(20 + (1 - ratio) * 60);
  const b = Math.round(200 - ratio * 160);
  return `rgb(${r},${g},${b})`;
}

const MultiDimensional: React.FC = () => {
  const [dim1, setDim1] = useState('channel');
  const [dim2, setDim2] = useState('language');
  const [metric, setMetric] = useState('uploaded');
  const [topN, setTopN] = useState(10);

  const { data, isLoading, error } = useMultiDimensional(dim1, dim2, metric, topN);

  /** Build a lookup map: dim1Value → dim2Value → cellValue */
  const cellMap = useMemo(() => {
    if (!data) return new Map<string, Map<string, number>>();
    const m = new Map<string, Map<string, number>>();
    for (const cell of data.cells) {
      if (!m.has(cell.dim1_value)) m.set(cell.dim1_value, new Map());
      m.get(cell.dim1_value)!.set(cell.dim2_value, cell.value);
    }
    return m;
  }, [data]);

  const maxVal = useMemo(() => {
    if (!data?.cells.length) return 1;
    return Math.max(...data.cells.map((c) => c.value), 1);
  }, [data]);

  const dim1Labels = data?.dim1_labels ?? [];
  const dim2Labels = data?.dim2_labels ?? [];

  const dim1Label = DIMENSION_OPTIONS.find((d) => d.value === dim1)?.label ?? dim1;
  const dim2Label = DIMENSION_OPTIONS.find((d) => d.value === dim2)?.label ?? dim2;

  return (
    <DashboardLayout>
      <PageHeader
        title="Multi-Dimensional Analysis"
        subtitle="Explore any two dimensions as a heatmap matrix to spot cross-dimensional patterns"
      />

      {/* Dimension + metric selectors */}
      <motion.div
        className="flex flex-wrap items-center gap-3 mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span>Row:</span>
          <Select value={dim1} onValueChange={(v) => { if (v !== dim2) setDim1(v); }}>
            <SelectTrigger className="w-36 bg-[#141414] border-[#27272A] text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#27272A]">
              {DIMENSION_OPTIONS.filter((d) => d.value !== dim2).map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs text-white">
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span>Column:</span>
          <Select value={dim2} onValueChange={(v) => { if (v !== dim1) setDim2(v); }}>
            <SelectTrigger className="w-36 bg-[#141414] border-[#27272A] text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#27272A]">
              {DIMENSION_OPTIONS.filter((d) => d.value !== dim1).map((d) => (
                <SelectItem key={d.value} value={d.value} className="text-xs text-white">
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span>Metric:</span>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="w-40 bg-[#141414] border-[#27272A] text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#27272A]">
              {METRIC_OPTIONS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs text-white">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
          <span>Top N:</span>
          <Select value={String(topN)} onValueChange={(v) => setTopN(Number(v))}>
            <SelectTrigger className="w-20 bg-[#141414] border-[#27272A] text-white text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#141414] border-[#27272A]">
              {[5, 10, 15, 20].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs text-white">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Heatmap matrix */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ChartCard
          title={`${dim1Label} × ${dim2Label}`}
          subtitle={`${METRIC_OPTIONS.find((m2) => m2.value === metric)?.label ?? metric} — darker = higher`}
        >
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center text-[#52525B] text-sm">
              Loading…
            </div>
          ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-red-400 text-sm">
              Failed to load data — {String(error)}
            </div>
          ) : dim1Labels.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-[#52525B] text-sm">
              No data available for the selected combination.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="text-[11px] border-collapse w-full">
                <thead>
                  <tr>
                    {/* top-left corner */}
                    <th className="px-2 py-1.5 text-left text-[#52525B] min-w-[100px] sticky left-0 bg-[#0D0D0D] z-10">
                      {dim1Label} ↓ / {dim2Label} →
                    </th>
                    {dim2Labels.map((col) => (
                      <th
                        key={col}
                        className="px-2 py-1.5 text-center text-[#A1A1AA] whitespace-nowrap font-normal max-w-[80px] truncate"
                        title={col}
                      >
                        {col.length > 10 ? col.slice(0, 10) + '…' : col}
                      </th>
                    ))}
                    <th className="px-2 py-1.5 text-center text-[#52525B] font-normal">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dim1Labels.map((row) => {
                    const rowMap = cellMap.get(row);
                    const rowTotal = dim2Labels.reduce((s, col) => s + (rowMap?.get(col) ?? 0), 0);
                    return (
                      <tr key={row} className="hover:bg-white/5 transition-colors">
                        <td
                          className="px-2 py-1.5 text-[#A1A1AA] font-medium truncate max-w-[120px] sticky left-0 bg-[#0D0D0D] z-10"
                          title={row}
                        >
                          {row.length > 14 ? row.slice(0, 14) + '…' : row}
                        </td>
                        {dim2Labels.map((col) => {
                          const val = rowMap?.get(col) ?? 0;
                          const ratio = val / maxVal;
                          const bg = val > 0 ? heatColor(ratio) : 'transparent';
                          return (
                            <td
                              key={col}
                              className="px-2 py-1.5 text-center text-white font-mono tabular-nums"
                              style={{
                                background: bg,
                                opacity: val > 0 ? 0.85 + ratio * 0.15 : 1,
                              }}
                              title={`${row} × ${col}: ${val.toLocaleString()}`}
                            >
                              {val > 0 ? val.toLocaleString() : ''}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1.5 text-center text-[#71717A] font-mono tabular-nums">
                          {rowTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Column totals */}
                  <tr className="border-t border-[#27272A]">
                    <td className="px-2 py-1.5 text-[#52525B] font-semibold sticky left-0 bg-[#0D0D0D] z-10">
                      Total
                    </td>
                    {dim2Labels.map((col) => {
                      const colTotal = dim1Labels.reduce(
                        (s, row) => s + (cellMap.get(row)?.get(col) ?? 0),
                        0,
                      );
                      return (
                        <td
                          key={col}
                          className="px-2 py-1.5 text-center text-[#71717A] font-mono tabular-nums"
                        >
                          {colTotal.toLocaleString()}
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center text-[#A1A1AA] font-semibold font-mono tabular-nums">
                      {dim1Labels
                        .reduce(
                          (s, row) =>
                            s +
                            dim2Labels.reduce(
                              (ss, col) => ss + (cellMap.get(row)?.get(col) ?? 0),
                              0,
                            ),
                          0,
                        )
                        .toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Color legend */}
      <motion.div
        className="mt-4 flex items-center gap-3 text-xs text-[#71717A]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span>Low</span>
        <div
          className="h-3 w-48 rounded"
          style={{
            background: `linear-gradient(to right, ${heatColor(0)}, ${heatColor(0.5)}, ${heatColor(1)})`,
          }}
        />
        <span>High</span>
      </motion.div>
    </DashboardLayout>
  );
};

export default MultiDimensional;
