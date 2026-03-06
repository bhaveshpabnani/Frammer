import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Code2,
  BarChart3,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';
import { channelMetrics, monthlyMetrics } from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  chart?: 'bar' | 'line';
  chartData?: { name: string; value: number }[];
  insight?: string;
  timestamp: Date;
}

const EXAMPLE_PROMPTS = [
  'Which channel has the highest clip yield?',
  'Show me monthly video processing trend',
  'What is the average processing time per team member?',
  'Compare publish rates across languages',
];

const MOCK_RESPONSES: Record<string, Omit<Message, 'id' | 'role' | 'timestamp'>> = {
  'which channel has the highest clip yield?': {
    content: "YouTube leads with 1,842 clips generated, followed by LinkedIn at 1,204. Here's the full breakdown by channel:",
    sql: `SELECT channel, SUM(clips_generated) AS total_clips\nFROM fact_video_usage\nGROUP BY channel\nORDER BY 2 DESC;`,
    chart: 'bar',
    chartData: channelMetrics.map((c) => ({ name: c.channel, value: c.clipsGenerated })),
    insight: 'YouTube is 53% higher than the next best channel (LinkedIn). Consider reallocating more content to YouTube-first workflows.',
  },
  'show me monthly video processing trend': {
    content: "Here's the monthly video processing trend over the past year:",
    sql: `SELECT DATE_TRUNC('month', uploaded_at) AS month,\n       COUNT(*) AS videos_processed\nFROM fact_video_usage\nWHERE uploaded_at >= NOW() - INTERVAL '12 months'\nGROUP BY 1 ORDER BY 1;`,
    chart: 'line',
    chartData: monthlyMetrics.map((m) => ({ name: m.month.slice(0, 3), value: m.videosProcessed })),
    insight: 'Processing volume grew 28% YoY. The trough in August may indicate seasonal content pipeline slowdown.',
  },
  'what is the average processing time per team member?': {
    content: "Here's the average processing time breakdown by team member:",
    sql: `SELECT user, AVG(processing_time_min) AS avg_min\nFROM fact_video_usage\nGROUP BY user\nORDER BY 2;`,
    chart: 'bar',
    chartData: [
      { name: 'Priya S.', value: 18 },
      { name: 'Arjun M.', value: 22 },
      { name: 'Zara K.', value: 16 },
      { name: 'Arnav R.', value: 25 },
      { name: 'Divya P.', value: 20 },
      { name: 'Karan T.', value: 19 },
    ],
    insight: 'Zara has the fastest average at 16 min. Arnav may benefit from additional tooling or training to reduce 25 min average.',
  },
};

function fallbackResponse(query: string): Omit<Message, 'id' | 'role' | 'timestamp'> {
  return {
    content: `I found relevant data for "${query}". Based on the current dataset, here's a summary: the platform processed 1,284 videos this period with a 73% publish rate. For more specific analysis, try one of the example queries above or explore the Query Builder for custom SQL.`,
    insight: 'No specific pattern detected. Try rephrasing for a more targeted insight.',
  };
}

const DarkTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-lg p-2 text-xs">
      <p className="text-[#71717A]">{label}</p>
      <p className="text-white font-metric">{payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

export default function AIAnalyticsPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I\'m your Frammer AI analytics assistant. Ask me anything about your content processing data — I\'ll generate SQL, charts, and insights automatically.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: String(Date.now()), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    const key = text.trim().toLowerCase();
    const resp = MOCK_RESPONSES[key] ?? fallbackResponse(text);
    const aiMsg: Message = { id: String(Date.now() + 1), role: 'assistant', timestamp: new Date(), ...resp };
    setMessages((p) => [...p, aiMsg]);
    setLoading(false);
  };

  return (
    <DashboardLayout title="AI Analytics" subtitle="Natural language analytics assistant">
      <div className="space-y-4">
        <PageHeader title="AI Analytics" subtitle="Ask questions in plain English — get SQL, charts, and insights" />

        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
          {/* Chat */}
          <div className="col-span-12 lg:col-span-8 flex flex-col frammer-card overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                      msg.role === 'assistant' ? 'bg-frammer-red/15 border border-frammer-red/30' : 'bg-[#27272A]'
                    )}>
                      {msg.role === 'assistant' ? <Bot size={13} className="text-frammer-red" /> : <User size={13} className="text-white" />}
                    </div>
                    <div className={cn('max-w-[85%] space-y-2', msg.role === 'user' ? 'items-end flex flex-col' : '')}>
                      <div className={cn(
                        'rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                        msg.role === 'user' ? 'bg-frammer-red/15 text-white border border-frammer-red/25' : 'bg-[#1C1C1C] text-[#A1A1AA]'
                      )}>
                        {msg.content}
                      </div>

                      {msg.sql && (
                        <div className="w-full rounded-lg overflow-hidden border border-[#27272A]">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0D0D] border-b border-[#1C1C1C]">
                            <Code2 size={11} className="text-[#52525B]" />
                            <span className="text-[10px] text-[#52525B] uppercase tracking-wider">Generated SQL</span>
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.sql!)}
                              className="ml-auto text-[#3F3F46] hover:text-white"
                            >
                              <Copy size={10} />
                            </button>
                          </div>
                          <pre className="p-3 text-[11px] text-[#A1A1AA] font-mono leading-relaxed overflow-x-auto">
                            <code>{msg.sql}</code>
                          </pre>
                        </div>
                      )}

                      {msg.chart && msg.chartData && (
                        <div className="w-full rounded-xl bg-[#111111] border border-[#27272A] p-3">
                          <ResponsiveContainer width="100%" height={160}>
                            {msg.chart === 'bar' ? (
                              <BarChart data={msg.chartData} margin={{ left: -20 }}>
                                <CartesianGrid vertical={false} stroke="#1C1C1C" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<DarkTooltip />} />
                                <Bar dataKey="value" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} />
                              </BarChart>
                            ) : (
                              <LineChart data={msg.chartData} margin={{ left: -20 }}>
                                <CartesianGrid vertical={false} stroke="#1C1C1C" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<DarkTooltip />} />
                                <Line dataKey="value" stroke={CHART_COLORS.blue} strokeWidth={2} dot={false} />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}

                      {msg.insight && (
                        <div className="flex items-start gap-2 bg-blue-500/8 border border-blue-500/20 rounded-xl px-3 py-2">
                          <Sparkles size={12} className="text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-blue-300">{msg.insight}</p>
                        </div>
                      )}

                      {msg.role === 'assistant' && msg.id !== 'welcome' && (
                        <div className="flex gap-1">
                          <button className="text-[#3F3F46] hover:text-green-400 transition-colors"><ThumbsUp size={11} /></button>
                          <button className="text-[#3F3F46] hover:text-red-400 transition-colors"><ThumbsDown size={11} /></button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-frammer-red/15 border border-frammer-red/30 flex items-center justify-center">
                    <Bot size={13} className="text-frammer-red" />
                  </div>
                  <div className="bg-[#1C1C1C] rounded-xl px-4 py-2.5 flex gap-1.5 items-center">
                    {[0, 0.15, 0.3].map((d) => (
                      <motion.div
                        key={d}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d }}
                        className="w-1.5 h-1.5 rounded-full bg-frammer-red"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-[#1C1C1C] p-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask anything — e.g. 'Which channel has the most clips?'"
                  className="flex-1 bg-[#1C1C1C] border border-[#3F3F46] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#3F3F46] outline-none focus:border-frammer-red/50 transition-colors"
                />
                <Button
                  onClick={() => sendMessage(input)}
                  size="sm"
                  className="bg-frammer-red hover:bg-frammer-red/90 text-white h-10 w-10 p-0"
                  disabled={loading}
                >
                  <Send size={14} />
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Prompts */}
          <div className="col-span-12 lg:col-span-4 space-y-3">
            <div className="frammer-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-frammer-red" />
                <p className="text-xs text-white font-semibold">Example Prompts</p>
              </div>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#272727] border border-[#27272A] hover:border-[#3F3F46] text-xs text-[#A1A1AA] hover:text-white transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="frammer-card p-4 space-y-3">
              <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Capabilities</p>
              {[
                { icon: <Code2 size={12} />, label: 'Generates SQL automatically' },
                { icon: <BarChart3 size={12} />, label: 'Renders charts from results' },
                { icon: <Sparkles size={12} />, label: 'Surfaces actionable insights' },
                { icon: <RefreshCw size={12} />, label: 'Remembers conversation context' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-xs text-[#71717A]">
                  <span className="text-frammer-red">{icon}</span> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
