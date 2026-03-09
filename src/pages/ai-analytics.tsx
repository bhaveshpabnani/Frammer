import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { runAgentQuery } from '@/api/endpoints';
import { toApiParams } from '@/api/client';
import type { AgentQueryRequest, AgentQueryResponse } from '@/api/types';
import { useFilters } from '@/contexts/FilterContext';
import type { FilterState } from '@/contexts/FilterContext';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Bot, LoaderCircle, Plus, Send, Sparkles } from 'lucide-react';

//  Types 

type UserMessage     = { role: 'user';      content: string;              timestamp: string };
type AssistantMessage = { role: 'assistant'; response?: AgentQueryResponse; error?: string; timestamp: string };
type ChatMessage     = UserMessage | AssistantMessage;

interface ChatSession {
  id:        string;
  title:     string;
  createdAt: string;
  messages:  ChatMessage[];
}

//  Constants 

const STORAGE_KEY = 'frammer-ai-sessions';

const SERIES_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
];

const STARTER_PROMPTS = [
  { label: 'Publish rate by client',  prompt: 'Show publish rate by client for the last 30 days as a bar chart' },
  { label: 'Channel comparison',      prompt: 'Compare total published by channel this month vs last month' },
  { label: 'Duration trend',          prompt: 'Trend of uploaded duration hours over the last 90 days' },
  { label: 'Top 10 channels',         prompt: 'Top 10 channels by total uploaded last 30 days' },
  { label: 'Publishing lag by team',  prompt: 'Show avg publishing lag by team this month' },
  { label: 'Language breakdown',      prompt: 'Breakdown of videos by language in the last quarter' },
];

//  Helpers 

function buildContext(filters: FilterState): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if (filters.dateRange !== 'all') f.date_range = filters.dateRange;
  if (filters.client     !== 'all') f.client    = filters.client;
  if (filters.channel    !== 'all') f.channel   = filters.channel;
  if (filters.language   !== 'all') f.language  = filters.language;
  if (filters.teamMember !== 'all') f.team_member = filters.teamMember;
  if (filters.inputType  !== 'all') f.input_type = filters.inputType;
  if (filters.outputType !== 'all') f.output_type = filters.outputType;
  return { filters: f };
}

function rowsToObjects(columns: string[], rows: unknown[][]) {
  return rows.map((row) =>
    columns.reduce<Record<string, unknown>>((acc, col, i) => ({ ...acc, [col]: row[i] }), {})
  );
}

function fmtValue(value: unknown, unit?: string): string {
  if (value == null) return 'N/A';
  if (typeof value !== 'number') return String(value);
  if (unit === 'percent') return `${(Math.abs(value) <= 1.0001 ? value * 100 : value).toFixed(1)}%`;
  if (unit === 'hours')   return `${value.toFixed(1)}h`;
  if (unit === 'minutes') return `${value.toFixed(1)}m`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function loadSessions(): ChatSession[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

//  Inline chart 

function ChartTooltip({ active, payload, label, formatters }: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: unknown; color?: string; dataKey?: string }>;
  label?: string;
  formatters: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[#2E2E33] bg-[#111214]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur">
      {label ? <p className="mb-1.5 text-[#8B8B96]">{label}</p> : null}
      {payload.map((entry, i) => {
        const dk = String(entry.dataKey ?? entry.name ?? i);
        return (
          <div key={dk} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color ?? SERIES_COLORS[i % SERIES_COLORS.length] }} />
            <span className="text-[#A1A1AA]">{entry.name ?? dk}</span>
            <span className="font-medium text-white">{fmtValue(entry.value, formatters[dk])}</span>
          </div>
        );
      })}
    </div>
  );
}

function InlineChart({ response, rows }: { response: AgentQueryResponse; rows: Record<string, unknown>[] }) {
  const chart = response.chart_spec;
  if (!chart || !rows.length || chart.chart_type === 'table') return null;

  const xKey   = chart.x ?? response.columns[0];
  const series = chart.series.length ? chart.series : (chart.y ? [chart.y] : response.columns.filter((c) => c !== xKey));

  if (chart.chart_type === 'stat') {
    const key = chart.y ?? series[0];
    return (
      <div className="flex h-[120px] items-center justify-center rounded-xl border border-white/8 bg-white/[0.03]">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#8B8B96]">{chart.title ?? key}</p>
          <p className="mt-2 text-4xl font-semibold text-white">{fmtValue(rows[0]?.[key], chart.formatters[key])}</p>
        </div>
      </div>
    );
  }

  const shared = { data: rows, margin: { top: 8, right: 8, left: 0, bottom: 0 } };
  const chrome = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#232327" vertical={false} />
      <XAxis dataKey={xKey} tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
      <YAxis tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} width={38} />
      <Tooltip content={<ChartTooltip formatters={chart.formatters} />} />
      <Legend formatter={(v) => <span className="text-[10px] text-[#9A9AA4]">{v}</span>} />
    </>
  );

  if (chart.chart_type === 'pie') {
    const vk = chart.y ?? series[0];
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={rows} dataKey={vk} nameKey={xKey} cx="45%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3} stroke="rgba(255,255,255,0.08)">
            {rows.map((_, i) => <Cell key={i} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip formatters={chart.formatters} />} />
          <Legend formatter={(v) => <span className="text-[10px] text-[#9A9AA4]">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chart_type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart {...shared}>
          {chrome}
          {series.map((key, i) => <Line key={key} type="monotone" dataKey={key} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />)}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chart_type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart {...shared}>
          <defs>
            {series.map((key, i) => (
              <linearGradient key={key} id={`ai-area-${i}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={SERIES_COLORS[i % SERIES_COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          {chrome}
          {series.map((key, i) => <Area key={key} type="monotone" dataKey={key} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} fill={`url(#ai-area-${i})`} strokeWidth={2} />)}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart {...shared}>
        {chrome}
        {series.map((key, i) => <Bar key={key} dataKey={key} radius={[6, 6, 0, 0]} fill={SERIES_COLORS[i % SERIES_COLORS.length]} maxBarSize={32} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}

//  Message bubbles 

function UserBubble({ msg }: { msg: UserMessage }) {
  return (
    <div className="flex justify-end px-4">
      <div className="max-w-[72%]">
        <div className="rounded-2xl rounded-tr-sm bg-[#1C1C1F] px-4 py-3 text-sm text-white">{msg.content}</div>
        <p className="mt-1 text-right text-[10px] text-[#52525B]">{msg.timestamp}</p>
      </div>
    </div>
  );
}

function AssistantBubble({ msg, onFollowUp }: { msg: AssistantMessage; onFollowUp: (p: string) => void }) {
  const rows = useMemo(
    () => (msg.response ? rowsToObjects(msg.response.columns, msg.response.rows) : []),
    [msg.response]
  );

  if (msg.error) {
    return (
      <div className="flex gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 mt-0.5">
          <Bot className="h-4 w-4 text-red-300" />
        </div>
        <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-100/90">{msg.error}</p>
        </div>
      </div>
    );
  }

  if (!msg.response) {
    return (
      <div className="flex gap-3 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 mt-0.5">
          <LoaderCircle className="h-4 w-4 animate-spin text-[#E8212B]" />
        </div>
        <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-[#111113] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E8212B]" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E8212B]" style={{ animationDelay: '120ms' }} />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E8212B]" style={{ animationDelay: '240ms' }} />
          </div>
        </div>
      </div>
    );
  }

  const { response } = msg;
  const filterChips = Object.entries(response.resolved_filters ?? {}).filter(([, v]) => v != null);

  return (
    <div className="flex gap-3 px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#E8212B]/10 mt-0.5">
        <Sparkles className="h-4 w-4 text-[#E8212B]" />
      </div>
      <div className="max-w-[80%] space-y-3 min-w-0">
        {/* Summary text */}
        <div className="rounded-2xl rounded-tl-sm border border-white/8 bg-[#111113] px-4 py-3">
          <p className="text-sm leading-6 text-[#ECECF2]">{response.summary}</p>
          {response.caveats.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-white/6 pt-2">
              {response.caveats.map((c, i) => <p key={i} className="text-xs text-[#71717A]"> {c}</p>)}
            </div>
          )}
        </div>

        {/* Inline chart */}
        {response.chart_spec && rows.length > 0 && response.chart_spec.chart_type !== 'table' && (
          <div className="rounded-2xl border border-white/8 bg-[#0F0F11] p-4">
            {response.chart_spec.title && (
              <p className="mb-3 text-xs font-medium text-[#9A9AA4]">{response.chart_spec.title}</p>
            )}
            <InlineChart response={response} rows={rows} />
          </div>
        )}

        {/* Resolved filter chips */}
        {filterChips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filterChips.map(([k, v]) => (
              <Badge key={k} variant="outline" className="border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-[#9A9AA4]">
                <span className="mr-1 text-[#52525B]">{k}</span>{String(v)}
              </Badge>
            ))}
          </div>
        )}

        {/* Follow-up prompts */}
        {response.follow_ups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {response.follow_ups.map((fp) => (
              <button
                key={fp}
                type="button"
                onClick={() => onFollowUp(fp)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-[#C8C8D0] transition hover:border-white/25 hover:bg-white/10 hover:text-white"
              >
                {fp}
              </button>
            ))}
          </div>
        )}

        <p className="text-[10px] text-[#52525B]">{msg.timestamp}  {response.row_count} rows  {response.execution_time_ms.toFixed(0)}ms</p>
      </div>
    </div>
  );
}

//  Empty state 

function EmptyState({ onPrompt }: { onPrompt: (p: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-16">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8212B]/10">
        <Sparkles className="h-7 w-7 text-[#E8212B]" />
      </div>
      <h2 className="text-xl font-semibold text-white">Frammer AI</h2>
      <p className="mt-2 text-sm text-[#71717A]">Ask anything about your content analytics</p>
      <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
        {STARTER_PROMPTS.map(({ label, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-left transition hover:border-white/15 hover:bg-white/[0.06]"
          >
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#71717A]">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

//  Main component 

const AIAnalytics: React.FC = () => {
  const { filters }  = useFilters();
  const { toast }    = useToast();
  const [sessions, setSessions]             = useState<ChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => loadSessions()[0]?.id ?? null);
  const [input, setInput]                   = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const qs      = useMemo(() => toApiParams(filters).toString(), [filters]);
  const context = useMemo(() => buildContext(filters), [filters]);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages.length]);

  useEffect(() => { saveSessions(sessions); }, [sessions]);

  const queryMutation = useMutation({
    mutationFn: async (vars: { sessionId: string; msgIndex: number; req: AgentQueryRequest }) => {
      const result = await runAgentQuery(vars.req, qs);
      return { ...vars, result };
    },
    onSuccess: ({ sessionId, msgIndex, result }) => {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== sessionId) return s;
          const messages = [...s.messages];
          messages[msgIndex] = {
            role: 'assistant',
            response: result.data,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return { ...s, messages };
        })
      );
    },
    onError: (error, vars) => {
      const message = error instanceof Error ? error.message : 'Query failed.';
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== vars.sessionId) return s;
          const messages = [...s.messages];
          messages[vars.msgIndex] = { role: 'assistant', error: message, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
          return { ...s, messages };
        })
      );
      toast({ title: 'Agent query failed', description: message, variant: 'destructive' });
    },
  });

  const submitQuestion = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const now        = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: UserMessage     = { role: 'user',      content: trimmed, timestamp: now };
    const pendingMsg: AssistantMessage = { role: 'assistant', timestamp: now };

    // Determine target session synchronously from current state
    const existingSession = sessions.find((s) => s.id === activeSessionId);
    const isNew           = !existingSession;
    const sessionId       = isNew ? `conv-${Date.now()}` : existingSession!.id;
    const pendingIndex    = isNew ? 1 : existingSession!.messages.length + 1;

    setSessions((prev) => {
      if (isNew) {
        return [{ id: sessionId, title: trimmed.slice(0, 50), createdAt: now, messages: [userMsg, pendingMsg] }, ...prev];
      }
      return prev.map((s) => s.id === sessionId ? { ...s, messages: [...s.messages, userMsg, pendingMsg] } : s);
    });

    setActiveSessionId(sessionId);
    setInput('');

    queryMutation.mutate({ sessionId, msgIndex: pendingIndex, req: { question: trimmed, conversation_id: sessionId, context } });
  }, [sessions, activeSessionId, context, qs, queryMutation]);

  const startNewChat = () => { setActiveSessionId(null); setInput(''); textareaRef.current?.focus(); };

  const handleFollowUp = useCallback((fp: string) => {
    setInput(fp);
    textareaRef.current?.focus();
  }, []);

  return (
    <DashboardLayout title="AI Chat">
      {/* Stretch to fill main area by negating its p-6 padding */}
      <div className="-m-6 flex overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/*  Session sidebar  */}
        <div className="flex w-56 shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0A0A0C]">
          <div className="border-b border-white/[0.06] p-3">
            <button
              type="button"
              onClick={startNewChat}
              className="flex w-full items-center gap-2 rounded-xl bg-[#E8212B]/10 px-3 py-2.5 text-sm font-medium text-[#E8212B] transition hover:bg-[#E8212B]/20"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>
          <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
            {sessions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSessionId(s.id)}
                className={cn(
                  'w-full rounded-xl px-3 py-2.5 text-left transition',
                  s.id === activeSessionId ? 'bg-white/10 text-white' : 'text-[#A1A1AA] hover:bg-white/5 hover:text-white'
                )}
              >
                <p className="line-clamp-1 text-[13px]">{s.title}</p>
                <p className="mt-0.5 text-[10px] text-[#52525B]">{s.createdAt}</p>
              </button>
            ))}
            {!sessions.length && (
              <p className="px-3 pt-4 text-xs text-[#3F3F46]">No conversations yet</p>
            )}
          </div>
        </div>

        {/*  Chat area  */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0C0C0E]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {!activeSession ? (
              <EmptyState onPrompt={submitQuestion} />
            ) : (
              <div className="mx-auto max-w-3xl space-y-6 py-8">
                {activeSession.messages.map((msg, i) =>
                  msg.role === 'user' ? (
                    <UserBubble key={i} msg={msg} />
                  ) : (
                    <AssistantBubble key={i} msg={msg as AssistantMessage} onFollowUp={handleFollowUp} />
                  )
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input bar */}
          <div className="border-t border-white/[0.06] bg-[#0A0A0C] p-4">
            <div className="mx-auto max-w-3xl">
              <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-[#111113] px-4 py-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuestion(input); } }}
                  placeholder="Ask about publish rates, trends, channels, languages"
                  className="min-h-[20px] max-h-32 flex-1 resize-none border-0 bg-transparent p-0 text-sm text-white shadow-none placeholder:text-[#3F3F46] focus-visible:ring-0"
                  rows={1}
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={!input.trim() || queryMutation.isPending}
                  onClick={() => submitQuestion(input)}
                  className="h-8 w-8 shrink-0 rounded-xl bg-[#E8212B] shadow-[0_4px_16px_rgba(232,33,43,0.3)] hover:bg-[#cc1c25] disabled:opacity-40"
                >
                  {queryMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAnalytics;
