import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { FileText, Download, Printer, ChevronRight, TrendingUp, Clock, Video, BookOpen } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import {
  useKpis, useMonthly, useChannels, useLanguages, useUsers,
  useQualityRules, useRegistryMetrics,
} from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import { apiFetchWithMeta } from '@/api/client';
import type { ResponseMetadata } from '@/api/types';

const TABS = ['Executive Summary', 'Trends', 'Channel', 'Language', 'Team', 'Metric Appendix'] as const;
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

function MetaFooter({ meta }: { meta?: ResponseMetadata | null }) {
  if (!meta) return null;
  return (
    <div className="mt-4 pt-3 border-t border-[#1C1C1C] text-[10px] text-[#52525B] space-y-1">
      <p>Generated at: {new Date(meta.generated_at).toLocaleString()}</p>
      <p>Source grain: {meta.source_grain}</p>
      {meta.metric_definitions_used.length > 0 && (
        <p>Metrics: {meta.metric_definitions_used.join(', ')}</p>
      )}
      {meta.caveats.length > 0 && (
        <p>Caveats: {meta.caveats.join(' · ')}</p>
      )}
    </div>
  );
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab]         = useState<Tab>('Executive Summary');
  const { filters }                       = useFilters();

  const { data: kpis }                    = useKpis();
  const { data: monthlyData = [] }        = useMonthly();
  const { data: channelData = [] }        = useChannels();
  const { data: languageData = [] }       = useLanguages();
  const { data: userData = [] }           = useUsers();
  const { data: qualityRules }            = useQualityRules();
  const { data: registryMetrics = [] }    = useRegistryMetrics();

  // Collect metadata from last fetch
  const [sectionMeta, setSectionMeta]     = useState<Record<string, ResponseMetadata>>({});

  const activeFiltersText = useMemo(() => {
    const parts: string[] = [];
    if (filters.client  !== 'all') parts.push(`Client: ${filters.client}`);
    if (filters.channel !== 'all') parts.push(`Channel: ${filters.channel}`);
    if (filters.dateRange !== 'all') parts.push(`Period: ${filters.dateRange}`);
    return parts.length > 0 ? parts.join(' · ') : 'All data (no filters applied)';
  }, [filters]);

  const trendData = monthlyData.map(m => ({
    month:    m.month,
    Uploaded: m.videosProcessed,
    Published: (m as any).videosPublished ?? 0,
  }));

  const channelBarData = channelData.slice(0, 8).map(c => ({
    channel: c.channel,
    Videos: c.videosProcessed,
    Hours:  Math.round(c.totalDurationHours),
  }));

  const langPieData = languageData.slice(0, 6).map(l => ({
    language: l.language,
    count: l.count,
  }));

  const PIE_COLORS = [
    CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
    CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
  ];

  const handlePrint = () => window.print();

  const handleExportJSON = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      filters_applied: {
        client: filters.client,
        channel: filters.channel,
        dateRange: filters.dateRange,
        language: filters.language,
      },
      insight_summary: {
        total_uploaded: kpis?.totalVideos ?? 0,
        total_published: 0,
        publish_rate: kpis?.publishRate ?? 0,
        dq_score: kpis?.dqScore ?? null,
        mom_growth: kpis?.momGrowth ?? 0,
      },
      metric_appendix: registryMetrics.slice(0, 20).map(m => ({
        name: m.name,
        label: m.label,
        caveats: m.caveats,
      })),
      data: {
        monthly: monthlyData,
        channels: channelData,
        languages: languageData,
        users: userData.slice(0, 20),
      },
      section_metadata: sectionMeta,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `frammer-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="Reports" subtitle="Metadata-driven report generation across all metrics">
      <div className="space-y-6 animate-fade-in">

        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Reports"
            subtitle="Structured report with filter context, metric appendix, and export"
            badge={{ label: 'LIVE', variant: 'blue' as any }}
            onDownload={handleExportJSON}
          />
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 bg-[#111] border-[#1C1C1C]" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 bg-[#111] border-[#1C1C1C]" onClick={handleExportJSON}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Report header metadata */}
        <div className="frammer-card p-4 text-xs space-y-1">
          <div className="flex items-center gap-2 text-[#71717A] mb-2">
            <FileText className="h-4 w-4" />
            <span className="font-semibold text-[#A1A1AA]">Report Context</span>
          </div>
          <p><span className="text-[#52525B]">Generated:</span> <span className="text-[#A1A1AA]">{new Date().toLocaleString()}</span></p>
          <p><span className="text-[#52525B]">Filters:</span> <span className="text-[#A1A1AA]">{activeFiltersText}</span></p>
          {kpis?.dqScore != null && (
            <p><span className="text-[#52525B]">Data Quality Score:</span> <span className={cn('font-semibold', kpis.dqScore >= 80 ? 'text-green-400' : kpis.dqScore >= 60 ? 'text-amber-400' : 'text-red-400')}>{kpis.dqScore.toFixed(0)}/100</span></p>
          )}
          {qualityRules?.critical_count != null && qualityRules.critical_count > 0 && (
            <p><span className="text-[#52525B]">Critical DQ Rules:</span> <span className="text-red-400 font-semibold">{qualityRules.critical_count} failing</span></p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 flex-wrap border-b border-[#1C1C1C] pb-0">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-primary text-[#E4E4E7]'
                  : 'border-transparent text-[#71717A] hover:text-[#A1A1AA]',
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Executive Summary ─────────────────────────────────────────────── */}
        {activeTab === 'Executive Summary' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-[#E4E4E7]">Key Performance Indicators</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Videos Uploaded',    value: kpis?.totalVideos?.toLocaleString() ?? '—',   icon: <Video size={14} /> },
                { label: 'Publish Rate',        value: kpis?.publishRate != null ? `${(kpis.publishRate * 100).toFixed(1)}%` : '—', icon: <TrendingUp size={14} /> },
                { label: 'Hours Processed',     value: kpis?.totalHoursProcessed != null ? `${kpis.totalHoursProcessed.toFixed(0)}h` : '—', icon: <Clock size={14} /> },
                { label: 'MoM Growth',          value: kpis?.momGrowth != null ? `${kpis.momGrowth >= 0 ? '+' : ''}${kpis.momGrowth.toFixed(1)}%` : '—', icon: <TrendingUp size={14} /> },
              ].map((item, i) => (
                <div key={i} className="frammer-card p-4">
                  <div className="flex items-center gap-2 text-[#71717A] mb-2">{item.icon} <span className="text-[10px] uppercase tracking-wide">{item.label}</span></div>
                  <p className="font-metric text-xl text-[#E4E4E7]">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="frammer-card p-4">
              <h4 className="text-xs font-semibold text-[#A1A1AA] mb-3">Insight Summary</h4>
              <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
                <li>• Total uploaded videos: <strong className="text-[#E4E4E7]">{kpis?.totalVideos?.toLocaleString() ?? '—'}</strong></li>
                <li>• Active channels: <strong className="text-[#E4E4E7]">{kpis?.activeChannels ?? '—'}</strong> · Active clients: <strong className="text-[#E4E4E7]">{kpis?.activeClients ?? '—'}</strong></li>
                <li>• Clips generated per video: <strong className="text-[#E4E4E7]">{kpis?.avgClipsPerVideo ?? '—'}×</strong></li>
                <li>• Top channel by volume: <strong className="text-[#E4E4E7]">{kpis?.topChannel ?? '—'}</strong></li>
                <li>• Top language: <strong className="text-[#E4E4E7]">{kpis?.topLanguage ?? '—'}</strong></li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Trends ────────────────────────────────────────────────────────── */}
        {activeTab === 'Trends' && (
          <div className="frammer-card p-4">
            <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4">Monthly Pipeline Trend</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="Uploaded" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Published" stroke={CHART_COLORS.green} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Channel ───────────────────────────────────────────────────────── */}
        {activeTab === 'Channel' && (
          <div className="frammer-card p-4">
            <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4">Channel Volume Breakdown</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={channelBarData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="channel" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Videos" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Hours" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── Language ──────────────────────────────────────────────────────── */}
        {activeTab === 'Language' && (
          <div className="frammer-card p-4">
            <h3 className="text-sm font-semibold text-[#E4E4E7] mb-4">Language Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={langPieData} dataKey="count" nameKey="language" cx="45%" cy="50%" outerRadius={90} paddingAngle={2} strokeWidth={0}>
                  {langPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {langPieData.map((l, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-[#A1A1AA] truncate">{l.language}</span>
                  <span className="font-mono text-[#71717A] ml-auto">{l.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Team ──────────────────────────────────────────────────────────── */}
        {activeTab === 'Team' && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-[#E4E4E7]">Team Member Performance</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    {['Name', 'Team', 'Videos', 'Avg Duration'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {userData.slice(0, 20).map((u, i) => (
                    <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                      <td className="px-5 py-2.5 text-[#E4E4E7]">{u.name}</td>
                      <td className="px-5 py-2.5 text-[#71717A]">{u.teamName || '—'}</td>
                      <td className="px-5 py-2.5 font-mono text-[#A1A1AA]">{u.videosProcessed.toLocaleString()}</td>
                      <td className="px-5 py-2.5 font-mono text-[#A1A1AA]">{u.avgProcessingTimeMin.toFixed(1)} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Metric Appendix ────────────────────────────────────────────────── */}
        {activeTab === 'Metric Appendix' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-[#71717A] mb-2">
              <BookOpen className="h-4 w-4" />
              <span>Definitions sourced from the metric registry. Used metrics are highlighted.</span>
            </div>
            {registryMetrics.length === 0 ? (
              <p className="text-xs text-[#52525B]">Registry not loaded — check backend connection.</p>
            ) : (
              registryMetrics.slice(0, 30).map((m, i) => (
                <div key={i} className="frammer-card p-4">
                  <div className="flex items-start justify-between gap-4 mb-1">
                    <div>
                      <span className="font-mono text-[11px] text-[#52525B] mr-2">{m.name}</span>
                      <span className="text-sm font-medium text-[#E4E4E7]">{m.label}</span>
                    </div>
                    {m.is_proxy && <Badge variant="outline" className="text-[10px] shrink-0">proxy</Badge>}
                  </div>
                  {m.formula_sql && (
                    <pre className="text-[10px] text-[#71717A] font-mono bg-[#0a0a0a] p-2 rounded mt-2 overflow-x-auto whitespace-pre-wrap">
                      {m.formula_sql}
                    </pre>
                  )}
                  {m.caveats.length > 0 && (
                    <p className="text-[10px] text-[#52525B] mt-1.5">⚠ {m.caveats.join(' · ')}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default Reports;
