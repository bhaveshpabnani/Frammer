import React, { useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { planAgentQuery, runAgentQuery } from '@/api/endpoints';
import { toApiParams } from '@/api/client';
import type { AgentPlanResponse, AgentQueryRequest, AgentQueryResponse, ApiResponse } from '@/api/types';
import { useFilters } from '@/contexts/FilterContext';
import type { FilterState } from '@/contexts/FilterContext';
import { useRegistryMetrics } from '@/hooks/useApi';
import { CHART_COLORS } from '@/types';
import { cn, downloadCsv } from '@/lib/utils';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  Bot, BrainCircuit, CheckCircle2, Copy, Database, Download, LayoutPanelTop, LoaderCircle,
  MessageSquareText, SearchCheck, Send, Sparkles, Wand2,
} from 'lucide-react';

type AgentSession = {
  id: string;
  question: string;
  createdAt: string;
  status: 'running' | 'done' | 'error';
  envelope?: ApiResponse<AgentQueryResponse>;
  error?: string;
};

const QUICK_PROMPTS = [
  'Show publish rate by client for last 30 days as a bar chart',
  'Compare total published by channel this month vs last month',
  'Trend of uploaded duration hours over the last 90 days',
  'Top 10 channels by total uploaded last 30 days',
  'Explain publish rate',
  'Show avg publishing lag by team this month',
];

const COLORS = [CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan];

function buildAgentContext(filters: FilterState): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (filters.dateRange !== 'all') f.date_range = filters.dateRange;
  if (filters.client !== 'all') f.client = filters.client;
  if (filters.channel !== 'all') f.channel = filters.channel;
  if (filters.language !== 'all') f.language = filters.language;
  if (filters.teamMember !== 'all') f.team_member = filters.teamMember;
  if (filters.inputType !== 'all') f.input_type = filters.inputType;
  if (filters.outputType !== 'all') f.output_type = filters.outputType;
  if (filters.publishedFlag !== 'all') f.published_flag = filters.publishedFlag === 'true';
  if (filters.publishedPlatform !== 'all') f.published_platform = filters.publishedPlatform;
  if (filters.billableFlag !== 'all') f.billable_flag = filters.billableFlag === 'true';
  if (filters.comparison.enabled) f.compare_mode = { month: 'previous_month', quarter: 'previous_period', year: 'previous_year' }[filters.comparison.type];
  return { filters: f };
}

const rowsToObjects = (columns: string[], rows: unknown[][]) =>
  rows.map((row) => columns.reduce<Record<string, unknown>>((acc, column, i) => ({ ...acc, [column]: row[i] }), {}));

function formatValue(value: unknown, unit?: string, key?: string) {
  if (value == null) return 'N/A';
  if (typeof value !== 'number') return String(value);
  if (unit === 'percent') return `${(key?.startsWith('delta_') ? value : Math.abs(value) <= 1.0001 ? value * 100 : value).toFixed(1)}%`;
  if (unit === 'hours') return `${value.toFixed(1)}h`;
  if (unit === 'minutes') return `${value.toFixed(1)}m`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const PlannerBadge = ({ source, model }: { source: string; model?: string | null }) => (
  <Badge variant="outline" className={cn('rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.24em]', source === 'openai' ? 'border-sky-500/30 bg-sky-500/10 text-sky-200' : 'border-zinc-700 bg-zinc-900 text-zinc-300')}>
    {source === 'openai' ? `OpenAI${model ? ` - ${model}` : ''}` : 'Deterministic'}
  </Badge>
);

function AgentTooltip({ active, payload, label, formatters }: { active?: boolean; payload?: Array<{ name?: string; value?: unknown; color?: string; dataKey?: string }>; label?: string; formatters: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#2E2E33] bg-[#111214]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      {label ? <p className="mb-2 text-[#8B8B96]">{label}</p> : null}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const dataKey = String(entry.dataKey ?? entry.name ?? i);
          return (
            <div key={dataKey} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? COLORS[i % COLORS.length] }} />
              <span className="text-[#A1A1AA]">{entry.name ?? dataKey}</span>
              <span className="font-metric text-white">{formatValue(entry.value, formatters[dataKey], dataKey)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentChart({ response, rows }: { response: AgentQueryResponse; rows: Record<string, unknown>[] }) {
  const chart = response.chart_spec;
  if (!chart || !rows.length || chart.chart_type === 'table') return null;
  const xKey = chart.x ?? response.columns[0];
  const series = chart.series.length ? chart.series : chart.y ? [chart.y] : response.columns.filter((c) => c !== xKey);
  if (chart.chart_type === 'stat') {
    const key = chart.y ?? series[0];
    return <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] border border-white/5 bg-[radial-gradient(circle_at_top,rgba(232,33,43,0.18),transparent_58%),linear-gradient(180deg,#131315_0%,#0E0E10_100%)]"><div className="text-center"><p className="mb-3 text-xs uppercase tracking-[0.35em] text-[#777782]">{chart.title ?? key}</p><div className="font-metric text-6xl text-white">{formatValue(rows[0]?.[key], chart.formatters[key], key)}</div></div></div>;
  }
  if (chart.chart_type === 'pie') {
    const valueKey = chart.y ?? series[0];
    return <ResponsiveContainer width="100%" height={320}><PieChart><Pie data={rows} dataKey={valueKey} nameKey={xKey} cx="45%" cy="50%" outerRadius={92} innerRadius={56} paddingAngle={3} stroke="rgba(255,255,255,0.08)">{rows.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip content={<AgentTooltip formatters={chart.formatters} />} /><Legend formatter={(value) => <span className="text-xs text-[#9A9AA4]">{value}</span>} /></PieChart></ResponsiveContainer>;
  }
  const shared = { data: rows, margin: { top: 18, right: 16, left: 0, bottom: 0 } };
  const chrome = (<><CartesianGrid strokeDasharray="3 3" stroke="#232327" vertical={false} /><XAxis dataKey={xKey} tick={{ fill: '#80808A', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#80808A', fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<AgentTooltip formatters={chart.formatters} />} /><Legend formatter={(value) => <span className="text-xs text-[#9A9AA4]">{value}</span>} /></>);
  if (chart.chart_type === 'line') {
    return <ResponsiveContainer width="100%" height={320}><LineChart {...shared}>{chrome}{series.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2.4} dot={{ r: 2, fill: COLORS[i % COLORS.length] }} activeDot={{ r: 5 }} />)}</LineChart></ResponsiveContainer>;
  }
  if (chart.chart_type === 'area') {
    return <ResponsiveContainer width="100%" height={320}><AreaChart {...shared}><defs>{series.map((key, i) => <linearGradient key={key} id={`agent-area-${i}`} x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.45} /><stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0} /></linearGradient>)}</defs>{chrome}{series.map((key, i) => <Area key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} fill={`url(#agent-area-${i})`} strokeWidth={2} />)}</AreaChart></ResponsiveContainer>;
  }
  return <ResponsiveContainer width="100%" height={320}><BarChart {...shared}>{chrome}{series.map((key, i) => <Bar key={key} dataKey={key} radius={[8, 8, 0, 0]} fill={COLORS[i % COLORS.length]} maxBarSize={36} />)}</BarChart></ResponsiveContainer>;
}

const ActiveFilters = ({ filters }: { filters: Record<string, unknown> }) => !Object.keys(filters).length ? <p className="text-sm text-[#72727B]">No additional filters resolved.</p> : <div className="flex flex-wrap gap-2">{Object.entries(filters).map(([key, value]) => <Badge key={key} variant="outline" className="border-white/10 bg-white/5 px-3 py-1 text-[11px] text-[#D6D6DD]"><span className="mr-1 text-[#8E8E99]">{key}</span>{String(value)}</Badge>)}</div>;

const AIAnalytics: React.FC = () => {
  const { filters, activeFilterCount } = useFilters();
  const { data: registryMetrics } = useRegistryMetrics();
  const { toast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const conversationIdRef = useRef(`agent-${Date.now()}`);
  const [question, setQuestion] = useState('');
  const [sessions, setSessions] = useState<AgentSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [planPreview, setPlanPreview] = useState<ApiResponse<AgentPlanResponse> | null>(null);
  const qs = useMemo(() => toApiParams(filters), [filters]);
  const context = useMemo(() => buildAgentContext(filters), [filters]);

  const planMutation = useMutation({
    mutationFn: (payload: AgentQueryRequest) => planAgentQuery(payload, qs),
    onSuccess: setPlanPreview,
    onError: (error) => toast({ title: 'Plan preview failed', description: error instanceof Error ? error.message : 'Unable to preview plan.', variant: 'destructive' }),
  });

  const queryMutation = useMutation({
    mutationFn: async (payload: { sessionId: string; request: AgentQueryRequest }) => ({ sessionId: payload.sessionId, response: await runAgentQuery(payload.request, qs) }),
    onSuccess: ({ sessionId, response }) => {
      setSessions((prev) => prev.map((session) => session.id === sessionId ? { ...session, status: 'done', envelope: response } : session));
      setActiveSessionId(sessionId);
      setPlanPreview(null);
    },
    onError: (error, vars) => {
      const message = error instanceof Error ? error.message : 'Query failed.';
      setSessions((prev) => prev.map((session) => session.id === vars.sessionId ? { ...session, status: 'error', error: message } : session));
      setActiveSessionId(vars.sessionId);
      toast({ title: 'Agent query failed', description: message, variant: 'destructive' });
    },
  });

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeSessionId) ?? sessions[0] ?? null, [activeSessionId, sessions]);
  const activeResponse = activeSession?.envelope?.data ?? null;
  const activeMeta = activeSession?.envelope?.meta ?? null;
  const activeRows = useMemo(() => activeResponse ? rowsToObjects(activeResponse.columns, activeResponse.rows) : [], [activeResponse]);
  const resolvedFilters = activeResponse?.resolved_filters ?? planPreview?.data.resolved_filters ?? activeMeta?.filters_applied ?? {};
  const activeFollowUps = activeResponse?.follow_ups ?? planPreview?.data.follow_ups ?? [];

  const submitQuestion = async (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const sessionId = `${Date.now()}`;
    setSessions((prev) => [{ id: sessionId, question: trimmed, createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: 'running' }, ...prev]);
    setActiveSessionId(sessionId);
    setQuestion('');
    await queryMutation.mutateAsync({ sessionId, request: { question: trimmed, conversation_id: conversationIdRef.current, context } });
  };

  const previewPlan = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    await planMutation.mutateAsync({ question: trimmed, conversation_id: conversationIdRef.current, context });
  };

  const rerunActive = async () => { if (activeSession) await submitQuestion(activeSession.question); };
  const exportActive = () => { if (activeRows.length) downloadCsv(`agent-query-${Date.now()}.csv`, activeRows); };
  const copyToClipboard = async (label: string, value: string) => {
    try { await navigator.clipboard.writeText(value); toast({ title: `${label} copied`, description: 'Copied to clipboard.' }); }
    catch { toast({ title: `Unable to copy ${label.toLowerCase()}`, variant: 'destructive' }); }
  };

  return (
    <DashboardLayout title="AI Analytics" subtitle="Conversational analytics workspace powered by the semantic agent">
      <div className="space-y-6">
        <PageHeader title="AI Analytics" subtitle="Ask in plain English. The backend agent plans, validates, executes, and returns a governed visualization." badge={{ label: 'AGENT', variant: 'blue' }} onRefresh={activeSession ? rerunActive : undefined} onDownload={activeRows.length ? exportActive : undefined} actions={activeResponse ? <PlannerBadge source={activeResponse.planner_source} model={activeResponse.planner_model} /> : null} />

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(145deg,#121214_0%,#0B0B0D_42%,#0A0A0A_100%)] p-6 shadow-[0_18px_80px_rgba(0,0,0,0.35)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-[#E8212B]/18 blur-3xl" />
            <div className="absolute right-0 top-8 h-40 w-40 rounded-full bg-sky-500/14 blur-3xl" />
          </div>
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#B8B8C2]">
                    <Sparkles className="h-3.5 w-3.5 text-[#E8212B]" />
                    Semantic Analytics Agent
                  </div>
                  <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white">Natural-language analysis with production-safe planning, SQL compilation, and chart rendering.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9999A6]">The frontend now renders the backend agent end to end: plan, governed SQL, summary, dataset, and transparency panel from a single response contract.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 backdrop-blur">
                  <div className="min-w-[120px] rounded-2xl border border-white/6 bg-white/5 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Filters</p><div className="mt-2 font-metric text-2xl text-white">{activeFilterCount}</div></div>
                  <div className="min-w-[120px] rounded-2xl border border-white/6 bg-white/5 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Sessions</p><div className="mt-2 font-metric text-2xl text-white">{sessions.length}</div></div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <Textarea ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask anything about publish rate, client trends, turnaround time, top channels, compare windows, or metric definitions." className="min-h-[132px] resize-none border-0 bg-transparent px-0 text-base text-white shadow-none placeholder:text-[#666671] focus-visible:ring-0" />
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {QUICK_PROMPTS.slice(0, 4).map((prompt) => (
                      <button key={prompt} type="button" onClick={() => submitQuestion(prompt)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#C8C8D0] transition hover:border-white/20 hover:bg-white/8 hover:text-white">
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" disabled={!question.trim() || planMutation.isPending} onClick={previewPlan} className="border-white/10 bg-white/5 text-[#D1D1D8] hover:bg-white/10 hover:text-white">
                      {planMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SearchCheck className="h-4 w-4" />}
                      Preview Plan
                    </Button>
                    <Button type="button" disabled={!question.trim() || queryMutation.isPending} onClick={() => submitQuestion(question)} className="bg-primary text-primary-foreground shadow-[0_10px_30px_rgba(232,33,43,0.28)] hover:bg-primary/90">
                      {queryMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Run Agent Query
                    </Button>
                  </div>
                </div>
              </div>

              {planPreview ? (
                <div className="rounded-[1.5rem] border border-sky-500/20 bg-sky-500/5 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-sky-300" /><p className="text-sm font-medium text-white">Plan preview</p></div>
                    <PlannerBadge source={planPreview.data.planner_source} model={planPreview.data.planner_model} />
                  </div>
                  <p className="text-sm text-[#DDEBFF]">{planPreview.data.interpreted_question}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {planPreview.data.plan.metrics.map((metric) => <Badge key={metric} variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-100">metric - {metric}</Badge>)}
                    {planPreview.data.plan.dimensions.map((dimension) => <Badge key={dimension} variant="outline" className="border-white/10 bg-white/5 text-[#ECECF2]">dim - {dimension}</Badge>)}
                  </div>
                </div>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="mb-4 flex items-center gap-2"><LayoutPanelTop className="h-4 w-4 text-[#E8212B]" /><h3 className="text-sm font-medium text-white">Execution envelope</h3></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-white/6 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Date range</p><p className="mt-2 text-sm text-white">{filters.dateRange}</p></div>
                  <div className="rounded-2xl border border-white/6 bg-black/20 p-4"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Comparison</p><p className="mt-2 text-sm text-white">{filters.comparison.enabled ? filters.comparison.type : 'off'}</p></div>
                </div>
                <div className="mt-4"><p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#787883]">Resolved filters</p><ActiveFilters filters={resolvedFilters} /></div>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-2"><Wand2 className="h-4 w-4 text-sky-300" /><h3 className="text-sm font-medium text-white">Prompt starters</h3></div>
                <div className="space-y-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => submitQuestion(prompt)} className="w-full rounded-2xl border border-white/8 bg-black/20 px-3 py-3 text-left text-sm text-[#C9C9D2] transition hover:border-white/15 hover:bg-white/5 hover:text-white">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="mb-4 flex items-center gap-2"><Database className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-medium text-white">Metric glossary</h3></div>
                <div className="space-y-3">
                  {(registryMetrics ?? []).slice(0, 10).map((metric) => (
                    <div key={metric.name} className="rounded-2xl border border-white/6 bg-black/20 p-3">
                      <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-white">{metric.label}</p><Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] text-[#BDBDC7]">{metric.name}</Badge></div>
                      {metric.caveats[0] ? <p className="mt-2 text-xs leading-5 text-[#8E8E99]">{metric.caveats[0]}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </motion.section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
          <section className="space-y-6">
            {!activeSession ? <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8"><div className="mx-auto max-w-lg text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5"><Bot className="h-6 w-6 text-[#E8212B]" /></div><h3 className="text-xl font-medium text-white">Start a governed analytics session</h3><p className="mt-3 text-sm leading-6 text-[#8D8D97]">The workspace will show the interpreted question, validated plan, chart, table, SQL, and audit metadata from the backend agent response.</p></div></div> : null}
            {activeSession?.status === 'running' ? <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-8"><div className="flex items-center gap-3 text-white"><LoaderCircle className="h-5 w-5 animate-spin text-[#E8212B]" /><div><p className="font-medium">Running analytics agent</p><p className="text-sm text-[#8D8D97]">{activeSession.question}</p></div></div></div> : null}
            {activeSession?.status === 'error' ? <div className="rounded-[1.75rem] border border-red-500/20 bg-red-500/5 p-8"><p className="text-lg font-medium text-white">Agent execution failed</p><p className="mt-2 text-sm text-red-100/85">{activeSession.error}</p></div> : null}

            {activeResponse ? (
              <>
                <div className="rounded-[1.75rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlannerBadge source={activeResponse.planner_source} model={activeResponse.planner_model} />
                        <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-100"><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Executed</Badge>
                      </div>
                      <h3 className="text-2xl font-semibold tracking-tight text-white">{activeResponse.summary}</h3>
                      <p className="max-w-3xl text-sm leading-6 text-[#91919B]">{activeResponse.interpreted_question}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Rows</p><div className="mt-2 font-metric text-2xl text-white">{activeResponse.row_count}</div></div>
                      <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Latency</p><div className="mt-2 font-metric text-2xl text-white">{activeResponse.execution_time_ms.toFixed(1)}ms</div></div>
                      <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Metrics</p><div className="mt-2 font-metric text-2xl text-white">{activeResponse.plan.metrics.length}</div></div>
                      <div className="rounded-2xl border border-white/6 bg-black/20 px-4 py-3"><p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Columns</p><div className="mt-2 font-metric text-2xl text-white">{activeResponse.columns.length}</div></div>
                    </div>
                  </div>
                  <div className="mt-5 rounded-2xl border border-white/6 bg-black/20 p-4"><p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#787883]">Execution scope</p><ActiveFilters filters={resolvedFilters} /></div>
                </div>

                <Tabs defaultValue="visualization" className="space-y-4">
                  <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
                    <TabsTrigger value="visualization" className="rounded-xl data-[state=active]:bg-white/10">Visualization</TabsTrigger>
                    <TabsTrigger value="table" className="rounded-xl data-[state=active]:bg-white/10">Table</TabsTrigger>
                    <TabsTrigger value="transparency" className="rounded-xl data-[state=active]:bg-white/10">Transparency</TabsTrigger>
                  </TabsList>
                  <TabsContent value="visualization" className="space-y-4">
                    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-white">{activeResponse.chart_spec?.title ?? 'Result visualization'}</p>
                          <p className="mt-1 text-xs text-[#8B8B96]">{activeResponse.chart_spec?.chart_type ?? 'table'} chart generated from the agent response contract.</p>
                        </div>
                        <Button type="button" variant="outline" onClick={exportActive} className="border-white/10 bg-white/5 text-[#D1D1D8] hover:bg-white/10 hover:text-white">
                          <Download className="h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                      {activeResponse.chart_spec ? <AgentChart response={activeResponse} rows={activeRows} /> : <div className="flex h-[320px] items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 text-sm text-[#8B8B96]">The agent returned a table-first result for this query.</div>}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                        <div className="mb-3 flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-sky-300" /><p className="text-sm font-medium text-white">Follow-up prompts</p></div>
                        <div className="flex flex-wrap gap-2">
                          {activeFollowUps.length ? activeFollowUps.map((followUp) => <button key={followUp} type="button" onClick={() => submitQuestion(followUp)} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#D3D3DA] transition hover:border-white/20 hover:bg-white/10 hover:text-white">{followUp}</button>) : <p className="text-sm text-[#7D7D87]">No follow-up prompts were returned for this result.</p>}
                        </div>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                        <div className="mb-3 flex items-center gap-2"><BrainCircuit className="h-4 w-4 text-amber-300" /><p className="text-sm font-medium text-white">Caveats</p></div>
                        <div className="space-y-2 text-sm text-[#CFCFD7]">
                          {activeResponse.caveats.length ? activeResponse.caveats.map((caveat) => <div key={caveat} className="rounded-2xl border border-white/6 bg-black/20 px-3 py-2">{caveat}</div>) : <p className="text-[#7D7D87]">No caveats were emitted for this query.</p>}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="table">
                    <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/[0.03]">
                      <div className="border-b border-white/8 px-5 py-4">
                        <p className="text-sm font-medium text-white">Result dataset</p>
                        <p className="mt-1 text-xs text-[#8B8B96]">Rendered directly from columns and rows returned by the backend agent.</p>
                      </div>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-white/8 hover:bg-transparent">
                              {activeResponse.columns.map((column) => <TableHead key={column} className="text-[#9F9FAA]">{column}</TableHead>)}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {activeRows.length ? activeRows.map((row, index) => (
                              <TableRow key={`${index}-${activeResponse.columns.join('-')}`} className="border-white/6 hover:bg-white/[0.03]">
                                {activeResponse.columns.map((column) => <TableCell key={column} className="text-[#ECECF2]">{formatValue(row[column], activeResponse.chart_spec?.formatters[column], column)}</TableCell>)}
                              </TableRow>
                            )) : (
                              <TableRow className="border-white/6">
                                <TableCell colSpan={Math.max(activeResponse.columns.length, 1)} className="py-10 text-center text-[#7D7D87]">No rows returned for this execution scope.</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="transparency">
                    <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
                      <Accordion type="single" collapsible defaultValue="plan" className="space-y-3">
                        <AccordionItem value="plan" className="rounded-2xl border border-white/8 bg-black/20 px-4">
                          <AccordionTrigger className="text-white hover:no-underline">Plan and interpretation</AccordionTrigger>
                          <AccordionContent className="space-y-4 text-sm text-[#D7D7DE]">
                            <div><p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#787883]">Interpreted question</p><p>{activeResponse.interpreted_question}</p></div>
                            <div><p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#787883]">Resolved plan</p><pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0B0B0D] p-4 text-xs text-[#CFCFD7]">{JSON.stringify(activeResponse.plan, null, 2)}</pre></div>
                          </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="execution" className="rounded-2xl border border-white/8 bg-black/20 px-4">
                          <AccordionTrigger className="text-white hover:no-underline">Execution and metadata</AccordionTrigger>
                          <AccordionContent className="space-y-4 text-sm text-[#D7D7DE]">
                            <div><p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#787883]">Metadata</p><pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0B0B0D] p-4 text-xs text-[#CFCFD7]">{JSON.stringify(activeMeta, null, 2)}</pre></div>
                            <div><p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-[#787883]">SQL params</p><pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0B0B0D] p-4 text-xs text-[#CFCFD7]">{JSON.stringify(activeResponse.sql_params, null, 2)}</pre></div>
                            {activeResponse.sql ? (
                              <div>
                                <div className="mb-2 flex items-center justify-between gap-3">
                                  <p className="text-[10px] uppercase tracking-[0.28em] text-[#787883]">Compiled SQL</p>
                                  <Button type="button" variant="outline" onClick={() => copyToClipboard('SQL', activeResponse.sql ?? '')} className="border-white/10 bg-white/5 text-[#D1D1D8] hover:bg-white/10 hover:text-white">
                                    <Copy className="h-4 w-4" />
                                    Copy SQL
                                  </Button>
                                </div>
                                <pre className="overflow-x-auto rounded-2xl border border-white/8 bg-[#0B0B0D] p-4 text-xs text-[#CFCFD7]">{activeResponse.sql}</pre>
                              </div>
                            ) : null}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            ) : null}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5">
              <div className="mb-4 flex items-center gap-2"><Database className="h-4 w-4 text-[#E8212B]" /><h3 className="text-sm font-medium text-white">Session history</h3></div>
              <div className="space-y-3">
                {sessions.length ? sessions.map((session) => {
                  const isActive = session.id === activeSession?.id;
                  return (
                    <button key={session.id} type="button" onClick={() => setActiveSessionId(session.id)} className={cn('w-full rounded-[1.25rem] border px-4 py-3 text-left transition', isActive ? 'border-white/20 bg-white/10' : 'border-white/8 bg-black/20 hover:border-white/15 hover:bg-white/5')}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="line-clamp-2 text-sm font-medium text-white">{session.question}</p><p className="mt-1 text-xs text-[#868690]">{session.createdAt}</p></div>
                        <Badge variant="outline" className={cn('shrink-0 border text-[10px] uppercase', session.status === 'done' && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100', session.status === 'running' && 'border-sky-500/20 bg-sky-500/10 text-sky-100', session.status === 'error' && 'border-red-500/20 bg-red-500/10 text-red-100')}>{session.status}</Badge>
                      </div>
                    </button>
                  );
                }) : <p className="text-sm text-[#7D7D87]">No sessions yet. Run a question to build query history.</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAnalytics;
