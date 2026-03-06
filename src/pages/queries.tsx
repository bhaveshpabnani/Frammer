import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Play,
  Save,
  Copy,
  Plus,
  Trash2,
  Database,
  BarChart3,
  Code2,
  Table2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { channelMetrics, teamMetrics, languageData, outputTypeData } from '@/data/mockData';
import { CHART_COLORS } from '@/types';

type MetricKey = 'videosProcessed' | 'clipsGenerated' | 'hours' | 'avgProcessingTime';
type DimensionKey = 'channel' | 'teamMember' | 'language' | 'outputType';
type AggType = 'SUM' | 'AVG' | 'COUNT' | 'MAX' | 'MIN';
type ChartType = 'bar' | 'line' | 'pie' | 'table';
type FilterOp = '=' | '!=' | '>' | '<' | '>=' | '<=';

interface QueryFilter {
  id: string;
  column: string;
  operator: FilterOp;
  value: string;
}

interface SavedQuery {
  id: string;
  name: string;
  metric: MetricKey;
  dimension: DimensionKey;
  aggregation: AggType;
  savedAt: string;
}

const METRICS: { value: MetricKey; label: string; unit: string }[] = [
  { value: 'videosProcessed', label: 'Videos Processed', unit: '' },
  { value: 'clipsGenerated', label: 'Clips Generated', unit: '' },
  { value: 'hours', label: 'Hours Processed', unit: 'hrs' },
  { value: 'avgProcessingTime', label: 'Avg Processing Time', unit: 'min' },
];

const DIMENSIONS: { value: DimensionKey; label: string }[] = [
  { value: 'channel', label: 'Channel' },
  { value: 'teamMember', label: 'Team Member' },
  { value: 'language', label: 'Language' },
  { value: 'outputType', label: 'Output Type' },
];

const AGGREGATIONS: AggType[] = ['SUM', 'AVG', 'COUNT', 'MAX', 'MIN'];
const FILTER_OPS: FilterOp[] = ['=', '!=', '>', '<', '>=', '<='];

const SAVED_QUERIES: SavedQuery[] = [
  { id: 'sq-1', name: 'Clips by Channel', metric: 'clipsGenerated', dimension: 'channel', aggregation: 'SUM', savedAt: '2026-01-15' },
  { id: 'sq-2', name: 'Processing Time by Member', metric: 'avgProcessingTime', dimension: 'teamMember', aggregation: 'AVG', savedAt: '2026-02-01' },
  { id: 'sq-3', name: 'Videos by Language', metric: 'videosProcessed', dimension: 'language', aggregation: 'SUM', savedAt: '2026-02-20' },
];

const DarkTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-[#A1A1AA] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-white font-metric">{p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

function buildQueryResults(metric: MetricKey, dimension: DimensionKey): { name: string; value: number }[] {
  switch (dimension) {
    case 'channel':
      return channelMetrics.map((c) => ({
        name: c.channel,
        value:
          metric === 'videosProcessed' ? c.videosProcessed
          : metric === 'clipsGenerated' ? c.clipsGenerated
          : metric === 'hours' ? c.totalDurationHours
          : c.avgProcessingTimeMin,
      }));
    case 'teamMember':
      return teamMetrics.map((m) => ({
        name: m.name.split(' ')[0],
        value:
          metric === 'videosProcessed' ? m.videosProcessed
          : metric === 'clipsGenerated' ? m.clipsGenerated
          : metric === 'avgProcessingTime' ? m.avgProcessingTimeMin
          : m.videosProcessed,
      }));
    case 'language':
      return languageData.map((l) => ({ name: l.language, value: l.count }));
    case 'outputType':
      return outputTypeData.map((o) => ({ name: o.type, value: o.count }));
    default:
      return [];
  }
}

function buildSQL(metric: MetricKey, dimension: DimensionKey, aggregation: AggType, filters: QueryFilter[]): string {
  const metricCol =
    metric === 'videosProcessed' ? 'COUNT(*) AS videos_processed'
    : metric === 'clipsGenerated' ? `${aggregation}(clips_generated) AS clips_generated`
    : metric === 'hours' ? `${aggregation}(duration_min) / 60.0 AS hours_processed`
    : `${aggregation}(processing_time_min) AS avg_processing_time`;

  const dimCol =
    dimension === 'channel' ? 'channel'
    : dimension === 'teamMember' ? 'user'
    : dimension === 'language' ? 'language'
    : 'output_type';

  const whereClause = filters.length > 0
    ? '\nWHERE ' + filters.map((f) => `${f.column} ${f.operator} '${f.value}'`).join('\n  AND ')
    : '';

  return `SELECT
  ${dimCol},
  ${metricCol}
FROM fact_video_usage${whereClause}
GROUP BY ${dimCol}
ORDER BY 2 DESC
LIMIT 50;`;
}

export default function QueriesPage() {
  const [metric, setMetric] = useState<MetricKey>('clipsGenerated');
  const [dimension, setDimension] = useState<DimensionKey>('channel');
  const [aggregation, setAggregation] = useState<AggType>('SUM');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [filters, setFilters] = useState<QueryFilter[]>([]);
  const [ran, setRan] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(SAVED_QUERIES);
  const [showSaved, setShowSaved] = useState(true);
  const { toast } = useToast();

  const results = useMemo(() => ran ? buildQueryResults(metric, dimension) : [], [ran, metric, dimension]);
  const sql = useMemo(() => buildSQL(metric, dimension, aggregation, filters), [metric, dimension, aggregation, filters]);

  const metricInfo = METRICS.find((m) => m.value === metric)!;
  const colors = Object.values(CHART_COLORS);

  const addFilter = () =>
    setFilters((p) => [...p, { id: String(Date.now()), column: 'channel', operator: '=', value: '' }]);

  const saveQuery = () => {
    const saved: SavedQuery = {
      id: `sq-${Date.now()}`,
      name: `${metricInfo.label} by ${DIMENSIONS.find((d) => d.value === dimension)?.label}`,
      metric,
      dimension,
      aggregation,
      savedAt: new Date().toISOString().slice(0, 10),
    };
    setSavedQueries((p) => [saved, ...p]);
    toast({ title: 'Query saved', description: `"${saved.name}" added to saved queries.` });
  };

  const loadQuery = (sq: SavedQuery) => {
    setMetric(sq.metric);
    setDimension(sq.dimension);
    setAggregation(sq.aggregation);
    setRan(true);
  };

  return (
    <DashboardLayout title="Query Builder" subtitle="Visual SQL query composer">
      <div className="space-y-5">
        <PageHeader
          title="Query Builder"
          subtitle="Build queries visually — see generated SQL and results instantly"
        />

        <div className="grid grid-cols-12 gap-5">
          {/* Left: Saved queries */}
          <div className="col-span-12 lg:col-span-3 space-y-3">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="w-full flex items-center justify-between text-xs uppercase tracking-wider text-[#52525B] font-semibold hover:text-white transition-colors"
            >
              Saved Queries ({savedQueries.length})
              {showSaved ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </button>
            {showSaved && (
              <div className="space-y-1.5">
                {savedQueries.map((sq) => (
                  <button
                    key={sq.id}
                    onClick={() => loadQuery(sq)}
                    className="w-full frammer-card p-3 text-left hover:border-[#3F3F46] transition-all group"
                  >
                    <p className="text-xs text-white font-medium truncate">{sq.name}</p>
                    <p className="text-[10px] text-[#52525B] mt-0.5">{sq.savedAt}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Builder */}
          <div className="col-span-12 lg:col-span-9 space-y-4">
            {/* Controls */}
            <div className="frammer-card p-4 space-y-4">
              <p className="text-xs uppercase tracking-wider text-[#52525B] font-semibold">Query Configuration</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#A1A1AA]">Metric</label>
                  <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
                    <SelectTrigger className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#27272A]">
                      {METRICS.map((m) => (
                        <SelectItem key={m.value} value={m.value} className="text-sm text-[#A1A1AA]">{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#A1A1AA]">Dimension (Group By)</label>
                  <Select value={dimension} onValueChange={(v) => setDimension(v as DimensionKey)}>
                    <SelectTrigger className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#27272A]">
                      {DIMENSIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value} className="text-sm text-[#A1A1AA]">{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#A1A1AA]">Aggregation</label>
                  <Select value={aggregation} onValueChange={(v) => setAggregation(v as AggType)}>
                    <SelectTrigger className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#27272A]">
                      {AGGREGATIONS.map((a) => (
                        <SelectItem key={a} value={a} className="text-sm text-[#A1A1AA] font-mono">{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#71717A]">Filters</p>
                  <button onClick={addFilter} className="text-[11px] text-frammer-red hover:text-frammer-red/80 flex items-center gap-1">
                    <Plus size={11} /> Add Filter
                  </button>
                </div>
                {filters.map((f) => (
                  <div key={f.id} className="flex gap-2 items-center">
                    <Select value={f.column} onValueChange={(v) => setFilters((p) => p.map((x) => x.id === f.id ? { ...x, column: v } : x))}>
                      <SelectTrigger className="h-8 flex-1 bg-[#1C1C1C] border-[#3F3F46] text-white text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161616] border-[#27272A]">
                        {['channel', 'language', 'user', 'client', 'input_type', 'output_type'].map((c) => (
                          <SelectItem key={c} value={c} className="text-xs text-[#A1A1AA]">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={f.operator} onValueChange={(v) => setFilters((p) => p.map((x) => x.id === f.id ? { ...x, operator: v as FilterOp } : x))}>
                      <SelectTrigger className="h-8 w-16 bg-[#1C1C1C] border-[#3F3F46] text-white text-xs font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#161616] border-[#27272A]">
                        {FILTER_OPS.map((op) => (
                          <SelectItem key={op} value={op} className="text-xs text-[#A1A1AA] font-mono">{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input
                      value={f.value}
                      onChange={(e) => setFilters((p) => p.map((x) => x.id === f.id ? { ...x, value: e.target.value } : x))}
                      placeholder="value"
                      className="h-8 flex-1 bg-[#1C1C1C] border border-[#3F3F46] rounded-md px-2 text-xs text-white outline-none focus:border-frammer-red/50"
                    />
                    <button onClick={() => setFilters((p) => p.filter((x) => x.id !== f.id))} className="text-[#52525B] hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Run button */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setRan(true)}
                  size="sm"
                  className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs"
                >
                  <Play size={12} className="mr-1.5" /> Run Query
                </Button>
                <Button onClick={saveQuery} variant="outline" size="sm" className="text-xs border-[#27272A] text-[#A1A1AA] hover:text-white">
                  <Save size={12} className="mr-1.5" /> Save
                </Button>
                <Button
                  onClick={() => { navigator.clipboard.writeText(sql); toast({ title: 'SQL copied' }); }}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#52525B] hover:text-white"
                >
                  <Copy size={12} className="mr-1.5" /> Copy SQL
                </Button>
              </div>
            </div>

            {/* SQL preview */}
            <div className="frammer-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1C1C1C] bg-[#0D0D0D]">
                <Code2 size={13} className="text-[#52525B]" />
                <span className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Generated SQL</span>
              </div>
              <pre className="p-4 text-xs text-[#A1A1AA] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                <code>{sql}</code>
              </pre>
            </div>

            {/* Results */}
            {ran && results.length > 0 && (
              <div className="frammer-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1C1C1C] bg-[#0D0D0D]">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={13} className="text-frammer-red" />
                    <span className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">
                      Results — {results.length} rows
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {(['bar', 'line', 'pie', 'table'] as ChartType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartType(t)}
                        className={cn(
                          'px-2.5 py-1 rounded text-[11px] transition-all',
                          chartType === t
                            ? 'bg-frammer-red/15 text-white border border-frammer-red/30'
                            : 'text-[#52525B] hover:text-white'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-4">
                  {chartType !== 'table' ? (
                    <ResponsiveContainer width="100%" height={220}>
                      {chartType === 'bar' ? (
                        <BarChart data={results} margin={{ left: 0 }}>
                          <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip content={<DarkTooltip />} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {results.map((_, i) => (
                              <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.85} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : chartType === 'line' ? (
                        <LineChart data={results} margin={{ left: 0 }}>
                          <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip content={<DarkTooltip />} />
                          <Line dataKey="value" stroke={CHART_COLORS.red} strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.red }} />
                        </LineChart>
                      ) : (
                        <PieChart>
                          <Pie data={results} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                            {results.map((_, i) => (
                              <Cell key={i} fill={colors[i % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<DarkTooltip />} />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#27272A] hover:bg-transparent">
                          <TableHead className="text-[11px] uppercase text-[#52525B]">{DIMENSIONS.find((d) => d.value === dimension)?.label}</TableHead>
                          <TableHead className="text-[11px] uppercase text-[#52525B] text-right">{metricInfo.label}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.map((row) => (
                          <TableRow key={row.name} className="border-[#27272A] hover:bg-white/2">
                            <TableCell className="text-sm text-white py-2">{row.name}</TableCell>
                            <TableCell className="text-sm text-white font-metric text-right py-2">{row.value.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
