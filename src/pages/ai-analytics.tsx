import React, { useState, useRef, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  Send, Bot, Sparkles, Code2, BarChart3, Copy, RefreshCw, BookOpen,
  Lightbulb, AlertCircle, CheckCircle2, HelpCircle,
} from 'lucide-react';
import { cn, downloadCsv } from '@/lib/utils';
import { CHART_COLORS } from '@/types';
import { useRegistryMetrics } from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import { toApiParams, apiFetch } from '@/api/client';
import {
  parseQuestion, EXAMPLE_PROMPTS, CHART_RULES,
  type ParseResult,
} from '@/lib/semanticParser';

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

interface QuerySession {
  id: string;
  question: string;
  parseResult: ParseResult;
  data: unknown[] | null;
  error: string | null;
  loading: boolean;
  timestamp: string;
}

const CHART_COLORS_LIST = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
];

function ResultChart({ parseResult, data }: { parseResult: ParseResult; data: unknown[] }) {
  if (!data || data.length === 0) return null;

  const { chartType, metric, dimension } = parseResult;
  const dimensionKey = dimension ?? 'label';
  const metricKey   = metric ?? 'value';

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data as any[]} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
          <XAxis dataKey="month_label" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<DarkTooltip />} />
          <Line type="monotone" dataKey={metricKey} stroke={CHART_COLORS.red} strokeWidth={2} dot={{ fill: CHART_COLORS.red, r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data as any[]} dataKey={metricKey} nameKey={dimensionKey} cx="45%" cy="50%" outerRadius={80} paddingAngle={2} strokeWidth={0}>
            {(data as any[]).map((_, i) => (
              <Cell key={i} fill={CHART_COLORS_LIST[i % CHART_COLORS_LIST.length]} />
            ))}
          </Pie>
          <Tooltip content={<DarkTooltip />} />
          <Legend formatter={v => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data as any[]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
        <XAxis dataKey={dimensionKey} tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<DarkTooltip />} />
        <Bar dataKey={metricKey} radius={[3, 3, 0, 0]} maxBarSize={36}>
          {(data as any[]).map((_, i) => (
            <Cell key={i} fill={CHART_COLORS_LIST[i % CHART_COLORS_LIST.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function ConfidencePill({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-500/15 text-green-400 border-green-500/30'
    : score >= 40 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30';
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded border', color)}>
      {score}% confidence
    </span>
  );
}

const AIAnalytics: React.FC = () => {
  const { filters } = useFilters();
  const { data: registryMetrics } = useRegistryMetrics();

  const [question, setQuestion]     = useState('');
  const [sessions, setSessions]     = useState<QuerySession[]>([]);
  const [showSQL, setShowSQL]       = useState<Record<string, boolean>>({});
  const inputRef                    = useRef<HTMLInputElement>(null);
  const bottomRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions]);

  const executeQuery = async (q: string) => {
    if (!q.trim()) return;
    const id          = Date.now().toString();
    const parseResult = parseQuestion(q, registryMetrics ?? undefined);
    const qs          = toApiParams(filters);

    const newSession: QuerySession = {
      id,
      question: q,
      parseResult,
      data: null,
      error: null,
      loading: true,
      timestamp: new Date().toLocaleTimeString(),
    };
    setSessions(prev => [...prev, newSession]);
    setQuestion('');

    try {
      // Route to correct backend endpoint based on parsed intent
      let endpoint = '/api/v1/core/kpis';
      const { metric, dimension, dateRange, filters: extraFilters } = parseResult;

      const params = new URLSearchParams(qs);
      if (dateRange && dateRange !== 'all') params.set('dateRange', dateRange);
      for (const [k, v] of Object.entries(extraFilters)) params.set(k, v);

      if (dimension === 'month') {
        endpoint = `/api/v1/trends/monthly?${params.toString()}`;
      } else if (dimension === 'channel') {
        endpoint = metric?.includes('lag') || metric?.includes('processing')
          ? `/api/v1/funnel-efficiency/lag?${params.toString()}`
          : `/api/v1/performance/channels?${params.toString()}`;
      } else if (dimension === 'user' || dimension === 'team_name') {
        endpoint = `/api/v1/performance/analytics/user-productivity?${params.toString()}`;
      } else if (dimension === 'client') {
        endpoint = `/api/v1/performance/clients/summary`;
      } else if (dimension === 'language') {
        endpoint = `/api/v1/content/languages?${params.toString()}`;
      } else if (dimension === 'input_type') {
        endpoint = `/api/v1/content/input-types?${params.toString()}`;
      } else if (dimension === 'output_type') {
        endpoint = `/api/v1/content/output-types?${params.toString()}`;
      } else if (metric?.includes('dq') || metric?.includes('quality')) {
        endpoint = `/api/v1/diagnostics/quality/summary`;
      } else {
        endpoint = `/api/v1/core/kpis?${params.toString()}`;
      }

      const raw = await apiFetch<unknown>(endpoint);
      const data = Array.isArray(raw) ? raw : [raw];

      setSessions(prev => prev.map(s => s.id === id ? { ...s, data, loading: false } : s));
    } catch (err) {
      setSessions(prev => prev.map(s => s.id === id ? {
        ...s,
        error: err instanceof Error ? err.message : 'Unknown error',
        loading: false,
      } : s));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(question);
  };

  return (
    <DashboardLayout title="AI Analytics" subtitle="Ask questions in plain English — powered by semantic query layer">
      <div className="space-y-4 h-full flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>

        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="AI Analytics"
            subtitle="Semantic query engine — ask anything about your content pipeline"
            badge={{ label: 'BETA', variant: 'blue' as any }}
            onDownload={() => {
              const last = sessions.filter(s => s.data && s.data.length > 0).at(-1);
              if (!last?.data) return;
              downloadCsv(`ai-result-${new Date().toISOString().slice(0,10)}.csv`, last.data as Record<string, unknown>[]);
            }}
          />

          {/* Knowledge base drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0 bg-[#111] border-[#1C1C1C]">
                <BookOpen className="h-3.5 w-3.5" />
                Knowledge Base
              </Button>
            </SheetTrigger>
            <SheetContent className="w-80 overflow-y-auto">
              <SheetHeader className="mb-4">
                <SheetTitle>Knowledge Base</SheetTitle>
              </SheetHeader>

              <div className="space-y-6 text-xs">
                <div>
                  <p className="font-semibold text-[#E4E4E7] mb-2">Example Prompts</p>
                  <div className="space-y-1.5">
                    {EXAMPLE_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-2.5 py-1.5 rounded border border-[#1C1C1C] text-[#A1A1AA] hover:border-[#3a3a3a] hover:text-[#E4E4E7] transition-colors"
                        onClick={() => { setQuestion(p); inputRef.current?.focus(); }}
                      >
                        "{p}"
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-semibold text-[#E4E4E7] mb-2">Chart Rules</p>
                  <div className="space-y-1.5">
                    {CHART_RULES.map((r, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <BarChart3 className="h-3.5 w-3.5 text-[#52525B] mt-0.5 flex-shrink-0" />
                        <span className="text-[#71717A]">{r.rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {registryMetrics && registryMetrics.length > 0 && (
                  <div>
                    <p className="font-semibold text-[#E4E4E7] mb-2">Available Metrics</p>
                    <div className="space-y-1">
                      {registryMetrics.slice(0, 20).map((m, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Badge variant="outline" className="text-[9px] font-mono shrink-0">{m.name}</Badge>
                          <span className="text-[#71717A]">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* ── Quick prompt chips ──────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.slice(0, 4).map((p, i) => (
            <button
              key={i}
              className="text-[11px] px-2.5 py-1 rounded border border-[#2a2a2a] text-[#71717A] hover:border-[#3a3a3a] hover:text-[#A1A1AA] transition-colors"
              onClick={() => executeQuery(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Session results ──────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          {sessions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 rounded-full bg-[#111] p-4">
                <Sparkles className="h-8 w-8 text-[#52525B]" />
              </div>
              <h3 className="text-sm font-semibold text-[#E4E4E7]">Ask your first question</h3>
              <p className="mt-1 max-w-sm text-xs text-[#52525B]">
                Type a question in plain English below. The semantic engine will parse it, call the correct backend endpoint, and render the result with an explanation.
              </p>
            </div>
          )}

          {sessions.map(session => (
            <div key={session.id} className="space-y-3">
              {/* User question */}
              <div className="flex items-start gap-2.5 justify-end">
                <div className="max-w-lg bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 text-sm text-[#E4E4E7]">
                  {session.question}
                </div>
              </div>

              {/* AI response */}
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#111] border border-[#1C1C1C] flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 max-w-3xl space-y-3">

                  {/* Interpretation panel */}
                  <div className="frammer-card p-4 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Lightbulb className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <p className="text-xs text-[#E4E4E7] leading-relaxed flex-1">
                        {session.parseResult.interpreted}
                      </p>
                      <ConfidencePill score={session.parseResult.confidence} />
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {session.parseResult.metric && (
                        <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1C1C1C] text-[#A1A1AA]">
                          Metric: <span className="text-white font-mono">{session.parseResult.metricLabel}</span>
                        </span>
                      )}
                      {session.parseResult.dimension && (
                        <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1C1C1C] text-[#A1A1AA]">
                          Dimension: <span className="text-white font-mono">{session.parseResult.dimensionLabel}</span>
                        </span>
                      )}
                      {session.parseResult.dateRange !== 'all' && (
                        <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1C1C1C] text-[#A1A1AA]">
                          Range: <span className="text-white">{session.parseResult.dateRange}</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-[#111] border border-[#1C1C1C] text-[#A1A1AA]">
                        Chart: <span className="text-white">{session.parseResult.chartType}</span>
                      </span>
                    </div>

                    {session.parseResult.ambiguities.length > 0 && (
                      <div className="space-y-1">
                        {session.parseResult.ambiguities.map((a, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-amber-400">
                            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            {a}
                          </div>
                        ))}
                      </div>
                    )}
                    {session.parseResult.suggestions.length > 0 && (
                      <div className="space-y-1">
                        {session.parseResult.suggestions.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 text-[11px] text-blue-400">
                            <HelpCircle className="h-3.5 w-3.5 flex-shrink-0" />
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Result / loading */}
                  {session.loading && (
                    <div className="frammer-card p-4 flex items-center gap-2 text-xs text-[#52525B]">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Querying backend…
                    </div>
                  )}

                  {session.error && (
                    <div className="frammer-card p-4 text-xs text-red-400 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>{session.error}</span>
                    </div>
                  )}

                  {!session.loading && !session.error && session.data && (
                    <div className="frammer-card p-4 space-y-3">
                      {/* Chart */}
                      {Array.isArray(session.data) && session.data.length > 0 && (
                        <ResultChart parseResult={session.parseResult} data={session.data} />
                      )}

                      {/* Result summary */}
                      {Array.isArray(session.data) && (
                        <p className="text-[11px] text-[#52525B]">
                          <CheckCircle2 className="inline h-3 w-3 text-green-400 mr-1" />
                          {session.data.length} record{session.data.length !== 1 ? 's' : ''} returned
                        </p>
                      )}

                      {/* SQL toggle */}
                      <div className="border-t border-[#1C1C1C] pt-2">
                        <button
                          onClick={() => setShowSQL(prev => ({ ...prev, [session.id]: !prev[session.id] }))}
                          className="text-[11px] text-[#52525B] hover:text-[#A1A1AA] flex items-center gap-1 transition-colors"
                        >
                          <Code2 className="h-3.5 w-3.5" />
                          {showSQL[session.id] ? 'Hide' : 'Show'} logical plan
                        </button>
                        {showSQL[session.id] && (
                          <pre className="mt-2 p-3 rounded bg-[#0a0a0a] border border-[#1C1C1C] text-[10px] text-[#A1A1AA] font-mono overflow-x-auto whitespace-pre-wrap">
                            {session.parseResult.sql}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* ── Input bar ────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-[#1C1C1C] pt-4">
          <Input
            ref={inputRef}
            className="flex-1 bg-[#111] border-[#1C1C1C] text-sm"
            placeholder="Ask anything… e.g. 'Show uploaded videos by channel last 30 days'"
            value={question}
            onChange={e => setQuestion(e.target.value)}
          />
          <Button
            type="submit"
            disabled={!question.trim()}
            className="gap-1.5 bg-primary text-primary-foreground"
          >
            <Send className="h-4 w-4" />
            Ask
          </Button>
        </form>

      </div>
    </DashboardLayout>
  );
};

export default AIAnalytics;
