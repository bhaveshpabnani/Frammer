import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  LineChart, Line,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  ShieldCheck, AlertTriangle, AlertCircle, CheckCircle2, ExternalLink, Search,
} from 'lucide-react';
import { cn, downloadCsv } from '@/lib/utils';
import {
  useQuality, useQualityExtended, useQualityFields, useQualityRules, useQualityIssues,
} from '@/hooks/useApi';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonPage } from '@/components/SkeletonPage';
import { ExportButton } from '@/components/ExportButton';
import { InsightStrip, buildInsights } from '@/components/InsightStrip';

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const map: Record<string, string> = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    warning:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
    info:     'bg-blue-500/15 text-blue-400 border-blue-500/30',
    ok:       'bg-green-500/15 text-green-400 border-green-500/30',
    good:     'bg-green-500/15 text-green-400 border-green-500/30',
  };
  return (
    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide', map[severity] ?? map.info)}>
      {severity}
    </span>
  );
};

const StatusDot = ({ status }: { status: string }) => {
  const color = status === 'good' ? 'bg-green-400' : status === 'warning' ? 'bg-amber-400' : 'bg-red-400';
  return <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', color)} />;
};

const SCORE_RING_SIZE = 100;

function ScoreGauge({ score }: { score: number }) {
  const pct   = Math.min(Math.max(score, 0), 100) / 100;
  const r     = 36;
  const circ  = 2 * Math.PI * r;
  const dash  = pct * circ;
  const color = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';

  return (
    <svg width={SCORE_RING_SIZE} height={SCORE_RING_SIZE} viewBox={`0 0 ${SCORE_RING_SIZE} ${SCORE_RING_SIZE}`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1C1C1C" strokeWidth={10} />
      <circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x="50" y="54" textAnchor="middle" fill={color} fontSize="18" fontWeight="700" fontFamily="monospace">
        {score.toFixed(0)}
      </text>
    </svg>
  );
}

const Quality: React.FC = () => {
  const navigate                             = useNavigate();
  const [activeTab, setActiveTab]            = useState('summary');
  const [issueCategory, setIssueCategory]   = useState<string>('all');
  const [issueSearch, setIssueSearch]       = useState('');

  const { data: qualityData,   isLoading: summaryLoading }    = useQuality();
  const { data: extendedData,  isLoading: extendedLoading }   = useQualityExtended();
  const { data: fieldsData,    isLoading: fieldsLoading }     = useQualityFields();
  const { data: rulesData,     isLoading: rulesLoading }      = useQualityRules();
  const { data: issuesData,    isLoading: issuesLoading }     = useQualityIssues(
    issueCategory === 'all' ? undefined : issueCategory, 200
  );

  const score    = qualityData?.overall_score ?? extendedData?.trend?.slice(-1)[0]?.overall_score ?? 0;
  const scoreRisk = score >= 80 ? 'ok' : score >= 60 ? 'warning' : 'critical';

  // Score trend line from extended
  const trendData = useMemo(() => (extendedData?.trend ?? []).map(t => ({
    month: t.month_label,
    Score: parseFloat(t.overall_score.toFixed(1)),
  })), [extendedData]);

  // Issues filtered by search
  const filteredIssues = useMemo(() => {
    if (!issuesData) return [];
    const q = issueSearch.toLowerCase();
    return issuesData.filter(r =>
      !q || (r.headline ?? '').toLowerCase().includes(q)
        || (r.channel ?? '').toLowerCase().includes(q)
        || r.issue_category.toLowerCase().includes(q),
    );
  }, [issuesData, issueSearch]);

  const insights = buildInsights({
    dqScore: score,
    caveats: rulesData?.critical_count
      ? [`${rulesData.critical_count} critical rules failing`]
      : [],
  });

  if (summaryLoading) return (
    <DashboardLayout title="Data Quality" subtitle="Loading…">
      <SkeletonPage statsCount={4} chartsCount={1} showTable />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Data Quality" subtitle="Comprehensive DQ diagnostics — fields, rules, and issues">
      <div className="space-y-6 animate-fade-in">

        <PageHeader
          title="Data Quality"
          subtitle="Field completeness, rule evaluation (R01–R19), and issue drillthrough"
          badge={{ label: scoreRisk === 'ok' ? 'HEALTHY' : scoreRisk === 'warning' ? 'WARNING' : 'CRITICAL', variant: scoreRisk === 'ok' ? 'green' : 'red' }}
          onDownload={() => downloadCsv('frammer-data-quality', (fieldsData ?? []).map(f => ({ field: f.field, table: f.table, null_pct: f.null_pct, unknown_pct: f.unknown_pct, distinct_count: f.distinct_count, status: f.status })))}
        />

        {insights.length > 0 && <InsightStrip insights={insights} />}

        {/* ── Summary KPI strip ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="frammer-card p-4 flex flex-col items-center justify-center gap-2">
            <ScoreGauge score={score} />
            <p className="text-[10px] text-[#71717A] uppercase tracking-wide">Overall Score</p>
          </div>
          <StatsCard
            title="Duplicate IDs"
            value={String(qualityData?.duplicate_video_ids ?? 0)}
            icon={<AlertCircle size={15} />}
            accentColor={(qualityData?.duplicate_video_ids ?? 0) > 0 ? 'red' : 'green'}
          />
          <StatsCard
            title="Unknown Teams"
            value={String(qualityData?.unknown_team_names ?? 0)}
            icon={<AlertTriangle size={15} />}
            accentColor={(qualityData?.unknown_team_names ?? 0) > 0 ? 'amber' : 'green'}
          />
          <StatsCard
            title="Critical Rules"
            value={String(rulesData?.critical_count ?? 0)}
            icon={<ShieldCheck size={15} />}
            accentColor={(rulesData?.critical_count ?? 0) > 0 ? 'red' : 'green'}
          />
        </div>

        {/* ── 4-Tab panel ──────────────────────────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#111] border border-[#1C1C1C]">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
          </TabsList>

          {/* ── TAB: Summary ─────────────────────────────────────────────────────── */}
          <TabsContent value="summary" className="mt-4 space-y-4">

            {/* Score trend */}
            <ChartCard title="DQ Score Trend" subtitle="Overall quality score over time" height={220}>
              {trendData.length === 0 ? (
                <EmptyState title="No trend data yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="Score" stroke="#4ade80" strokeWidth={2} dot={{ fill: '#4ade80', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            {/* Column health grid */}
            {qualityData?.columns && qualityData.columns.length > 0 && (
              <ChartCard title="Column Health Grid" subtitle="Null rate and issue status per field" height={280}>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1C1C1C]">
                        {['Column', 'Total Rows', 'Null %', 'Distinct', 'Status'].map((h, i) => (
                          <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : 'text-right px-2')}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {qualityData.columns.map((col, i) => (
                        <tr key={i} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                          <td className="py-2 pr-4 text-[#E4E4E7] font-mono">{col.column}</td>
                          <td className="py-2 px-2 text-right font-mono text-[#71717A]">{col.total_rows.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-mono">
                            <span className={cn(col.null_pct > 10 ? 'text-red-400' : col.null_pct > 0 ? 'text-amber-400' : 'text-green-400')}>
                              {col.null_pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-[#71717A]">{col.distinct_count.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <StatusDot status={col.status} />
                              <span className="capitalize text-[#A1A1AA]">{col.status}</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            )}
          </TabsContent>

          {/* ── TAB: Fields ──────────────────────────────────────────────────────── */}
          <TabsContent value="fields" className="mt-4">
            <ChartCard title="Field DQ Report" subtitle="Null %, unknown %, distinct counts per field" height={400}>
              {fieldsLoading ? (
                <div className="flex items-center justify-center h-40 text-[#52525B] text-sm">Loading…</div>
              ) : !fieldsData || fieldsData.length === 0 ? (
                <EmptyState title="No field report data" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#1C1C1C]">
                          {['Field', 'Table', 'Null %', 'Unknown %', 'Distinct', 'Status'].map((h, i) => (
                            <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : 'text-right px-2')}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fieldsData.map((f, i) => (
                          <tr key={i} className="border-b border-[#111] hover:bg-[#0d0d0d]">
                            <td className="py-2 pr-4 text-[#E4E4E7] font-mono">{f.field}</td>
                            <td className="py-2 px-2 text-right text-[#71717A]">{f.table}</td>
                            <td className="py-2 px-2 text-right font-mono">
                              <span className={cn(f.null_pct > 10 ? 'text-red-400' : f.null_pct > 0 ? 'text-amber-400' : 'text-green-400')}>
                                {f.null_pct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              <span className={cn(f.unknown_pct > 10 ? 'text-amber-400' : 'text-[#71717A]')}>
                                {f.unknown_pct.toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-[#71717A]">{f.distinct_count.toLocaleString()}</td>
                            <td className="py-2 px-2 text-right">
                              <SeverityBadge severity={f.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <ExportButton
                      data={fieldsData as unknown as Record<string, unknown>[]}
                      filename="dq-fields"
                    />
                  </div>
                </>
              )}
            </ChartCard>
          </TabsContent>

          {/* ── TAB: Rules ───────────────────────────────────────────────────────── */}
          <TabsContent value="rules" className="mt-4">
            <div className="space-y-3">
              {rulesLoading ? (
                <SkeletonPage statsCount={0} chartsCount={0} showTable />
              ) : !rulesData?.rules?.length ? (
                <EmptyState title="No rule evaluation data" />
              ) : (
                rulesData.rules.map((rule, i) => (
                  <div
                    key={i}
                    className={cn(
                      'frammer-card p-4 border',
                      rule.severity === 'critical' ? 'border-red-500/20'   :
                      rule.severity === 'warning'  ? 'border-amber-500/20' : 'border-[#1C1C1C]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[11px] text-[#71717A] uppercase">{rule.rule_id}</span>
                          <span className="text-[#E4E4E7] font-medium text-sm">{rule.rule_name}</span>
                          <Badge variant="outline" className="text-[10px] capitalize">{rule.category}</Badge>
                        </div>
                        <p className="text-[11px] text-[#71717A] leading-relaxed">{rule.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <SeverityBadge severity={rule.severity} />
                        <span className={cn(
                          'font-mono text-sm font-semibold',
                          rule.severity === 'critical' ? 'text-red-400' :
                          rule.severity === 'warning'  ? 'text-amber-400' : 'text-green-400',
                        )}>
                          {rule.affected_pct.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-[#52525B]">
                          {rule.affected_count.toLocaleString()} / {rule.total_rows.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-[#111] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          rule.severity === 'critical' ? 'bg-red-500'   :
                          rule.severity === 'warning'  ? 'bg-amber-500' : 'bg-green-500',
                        )}
                        style={{ width: `${Math.min(rule.affected_pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── TAB: Issues ──────────────────────────────────────────────────────── */}
          <TabsContent value="issues" className="mt-4">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-xs bg-[#111] border-[#1C1C1C]"
                  placeholder="Search issues…"
                  value={issueSearch}
                  onChange={e => setIssueSearch(e.target.value)}
                />
              </div>
              <Select value={issueCategory} onValueChange={setIssueCategory}>
                <SelectTrigger className="h-8 w-[160px] text-xs bg-[#111] border-[#1C1C1C]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="missing_team">Missing Team</SelectItem>
                  <SelectItem value="missing_platform">Missing Platform</SelectItem>
                  <SelectItem value="invalid_url">Invalid URL</SelectItem>
                  <SelectItem value="duplicate_video_id">Duplicate ID</SelectItem>
                  <SelectItem value="null_channel">Null Channel</SelectItem>
                  <SelectItem value="null_user">Null User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <ChartCard title="Issues Drillthrough" subtitle={`${filteredIssues.length} issues shown`} height={400}>
              {issuesLoading ? (
                <div className="flex items-center justify-center h-48 text-[#52525B] text-sm">Loading…</div>
              ) : filteredIssues.length === 0 ? (
                <EmptyState hasFilters={!!issueSearch || issueCategory !== 'all'} title="No issues found" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#1C1C1C]">
                          {['Video', 'Channel', 'Category', 'Detail', 'Severity', ''].map((h, i) => (
                            <th key={i} className={cn('py-2 text-[#71717A] font-medium', i === 0 ? 'text-left pr-4' : i < 5 ? 'text-left px-2' : 'text-right')}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIssues.slice(0, 100).map((issue, i) => (
                          <tr key={i} className="border-b border-[#111] hover:bg-[#0d0d0d] transition-colors">
                            <td className="py-2 pr-4 text-[#E4E4E7] max-w-[160px]">
                              <p className="truncate">{issue.headline ?? issue.video_id ?? '—'}</p>
                              {issue.video_id && issue.headline && (
                                <p className="text-[#52525B] font-mono text-[10px] truncate">{issue.video_id}</p>
                              )}
                            </td>
                            <td className="py-2 px-2 text-[#71717A] truncate max-w-[100px]">{issue.channel ?? '—'}</td>
                            <td className="py-2 px-2">
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {issue.issue_category.replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="py-2 px-2 text-[#71717A] max-w-[180px] truncate" title={issue.issue_detail}>
                              {issue.issue_detail}
                            </td>
                            <td className="py-2 px-2">
                              <SeverityBadge severity={issue.severity} />
                            </td>
                            <td className="py-2 pl-2 text-right">
                              <button
                                onClick={() => navigate(`/videos?search=${encodeURIComponent(issue.video_id ?? issue.headline ?? '')}`)}
                                className="text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                                title="View in Explorer"
                              >
                                <ExternalLink size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <ExportButton
                      data={filteredIssues as unknown as Record<string, unknown>[]}
                      filename="dq-issues"
                    />
                  </div>
                </>
              )}
            </ChartCard>
          </TabsContent>
        </Tabs>

      </div>
    </DashboardLayout>
  );
};

export default Quality;
