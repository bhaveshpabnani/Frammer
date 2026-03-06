import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Cell,
} from 'recharts';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { DataQualityBadge } from '@/components/DataQualityBadge';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ColumnQuality {
  column: string;
  nullPct: number;
  duplicates: number;
  outliers: number;
  badge: 'actual' | 'estimated' | 'calculated' | 'mixed';
  status: 'good' | 'warning' | 'critical';
}

const COLUMN_QUALITY: ColumnQuality[] = [
  { column: 'video_id', nullPct: 0, duplicates: 0, outliers: 0, badge: 'actual', status: 'good' },
  { column: 'headline', nullPct: 0.8, duplicates: 3, outliers: 0, badge: 'actual', status: 'good' },
  { column: 'channel', nullPct: 0, duplicates: 0, outliers: 0, badge: 'actual', status: 'good' },
  { column: 'language', nullPct: 2.1, duplicates: 0, outliers: 0, badge: 'actual', status: 'warning' },
  { column: 'duration_min', nullPct: 0, duplicates: 0, outliers: 12, badge: 'calculated', status: 'warning' },
  { column: 'processing_time_min', nullPct: 4.3, duplicates: 0, outliers: 8, badge: 'calculated', status: 'warning' },
  { column: 'clips_generated', nullPct: 0, duplicates: 0, outliers: 5, badge: 'calculated', status: 'good' },
  { column: 'published_flag', nullPct: 1.2, duplicates: 0, outliers: 0, badge: 'actual', status: 'warning' },
  { column: 'published_at', nullPct: 28.4, duplicates: 0, outliers: 0, badge: 'actual', status: 'critical' },
  { column: 'client', nullPct: 0, duplicates: 0, outliers: 0, badge: 'actual', status: 'good' },
  { column: 'user', nullPct: 0.5, duplicates: 0, outliers: 0, badge: 'actual', status: 'good' },
  { column: 'output_type', nullPct: 6.2, duplicates: 0, outliers: 0, badge: 'estimated', status: 'warning' },
];

const TREND_DATA = [
  { day: 'Feb 1', score: 84 }, { day: 'Feb 5', score: 85 }, { day: 'Feb 10', score: 81 },
  { day: 'Feb 15', score: 87 }, { day: 'Feb 20', score: 89 }, { day: 'Feb 25', score: 88 },
  { day: 'Feb 28', score: 86 },
];

const NULL_CHART = COLUMN_QUALITY
  .filter((c) => c.nullPct > 0)
  .sort((a, b) => b.nullPct - a.nullPct)
  .map((c) => ({ name: c.column.replace('_', ' '), value: c.nullPct, status: c.status }));

const STATUS_COLORS = { good: '#22C55E', warning: '#F59E0B', critical: '#EF4444' };

const DarkTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-lg p-2 text-xs">
      <p className="text-[#71717A]">{label}</p>
      <p className="text-white font-metric">{payload[0]?.value}%</p>
    </div>
  );
};

const overallScore = Math.round(
  COLUMN_QUALITY.reduce((acc, c) => acc + (100 - c.nullPct - Math.min(c.outliers, 10)), 0) / COLUMN_QUALITY.length
);

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'trend'>('overview');
  const good = COLUMN_QUALITY.filter((c) => c.status === 'good').length;
  const warning = COLUMN_QUALITY.filter((c) => c.status === 'warning').length;
  const critical = COLUMN_QUALITY.filter((c) => c.status === 'critical').length;

  return (
    <DashboardLayout title="Data Quality" subtitle="Monitor dataset health and completeness">
      <div className="space-y-5">
        <PageHeader title="Data Quality" subtitle="Monitor completeness, consistency, and accuracy of your datasets" />

        {/* Score cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Overall Score', value: `${overallScore}`, sub: '/ 100', icon: <ShieldCheck size={16} />, color: overallScore >= 85 ? 'text-green-400' : 'text-amber-400' },
            { label: 'Healthy Columns', value: String(good), sub: `/ ${COLUMN_QUALITY.length}`, icon: <CheckCircle2 size={16} />, color: 'text-green-400' },
            { label: 'Warnings', value: String(warning), sub: 'columns', icon: <ShieldAlert size={16} />, color: 'text-amber-400' },
            { label: 'Critical', value: String(critical), sub: 'columns', icon: <ShieldX size={16} />, color: 'text-red-400' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="frammer-card p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs text-[#52525B]">{card.label}</p>
                <span className={card.color}>{card.icon}</span>
              </div>
              <p className={cn('text-2xl font-metric', card.color)}>{card.value}<span className="text-sm text-[#52525B] ml-1">{card.sub}</span></p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {(['overview', 'columns', 'trend'] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} className={cn('px-3 py-1.5 rounded-full text-xs capitalize transition-all', activeTab === t ? 'bg-frammer-red/15 text-white border border-frammer-red/30' : 'text-[#52525B] hover:text-white')}>
              {t}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Null % chart */}
            <div className="frammer-card p-4 space-y-3">
              <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Null % by Column</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={NULL_CHART} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid horizontal={false} stroke="#27272A" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#52525B' }} axisLine={false} tickLine={false} domain={[0, 35]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<DarkTooltip />} />
                  <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                    {NULL_CHART.map((c) => <Cell key={c.name} fill={STATUS_COLORS[c.status]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Issues summary */}
            <div className="frammer-card p-4 space-y-3">
              <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Issues Summary</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Missing published_at (unpublished)', count: 28.4, pct: '28.4%', sev: 'critical' },
                  { label: 'Processing time nulls', count: 4.3, pct: '4.3%', sev: 'warning' },
                  { label: 'Output type gaps', count: 6.2, pct: '6.2%', sev: 'warning' },
                  { label: 'Duration outliers', count: 12, pct: '12 rows', sev: 'warning' },
                  { label: 'Language nulls', count: 2.1, pct: '2.1%', sev: 'warning' },
                ].map((issue) => (
                  <div key={issue.label} className="flex items-center gap-3">
                    {issue.sev === 'critical' ? <ShieldX size={13} className="text-red-400 shrink-0" /> : <AlertTriangle size={13} className="text-amber-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#A1A1AA] truncate">{issue.label}</p>
                    </div>
                    <Badge variant="outline" className={cn('text-[10px] border px-1.5', issue.sev === 'critical' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400')}>
                      {issue.pct}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'columns' && (
          <div className="frammer-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1C1C1C] bg-[#0D0D0D]">
                  {['Column', 'Status', 'Null %', 'Duplicates', 'Outliers', 'Data Type'].map((h) => (
                    <th key={h} className="text-left text-[#52525B] uppercase tracking-wider py-2.5 px-4 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COLUMN_QUALITY.map((row) => (
                  <tr key={row.column} className="border-b border-[#1C1C1C] hover:bg-white/2">
                    <td className="px-4 py-2.5 text-white font-mono">{row.column}</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('flex items-center gap-1', STATUS_COLORS[row.status] === '#22C55E' ? 'text-green-400' : row.status === 'warning' ? 'text-amber-400' : 'text-red-400')}>
                        {row.status === 'good' ? <CheckCircle2 size={12} /> : row.status === 'warning' ? <AlertTriangle size={12} /> : <ShieldX size={12} />}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Progress value={row.nullPct} className="h-1.5 w-16 bg-[#27272A]" />
                        <span className={cn(row.nullPct > 10 ? 'text-red-400' : row.nullPct > 0 ? 'text-amber-400' : 'text-green-400')}>{row.nullPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#71717A]">{row.duplicates}</td>
                    <td className="px-4 py-2.5 text-[#71717A]">{row.outliers}</td>
                    <td className="px-4 py-2.5"><DataQualityBadge type={row.badge} showLabel /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'trend' && (
          <div className="frammer-card p-4 space-y-3">
            <p className="text-xs text-[#52525B] uppercase tracking-wider font-semibold">Quality Score Trend (Feb 2026)</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={TREND_DATA}>
                <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} />
                <YAxis domain={[78, 92]} tick={{ fontSize: 11, fill: '#52525B' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip content={<DarkTooltip />} />
                <Line dataKey="score" stroke="#22C55E" strokeWidth={2} dot={{ r: 3, fill: '#22C55E' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
