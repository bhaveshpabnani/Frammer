import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Calculator,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
  Sigma,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useRegistryMetrics } from '@/hooks/useApi';

interface Metric {
  id: string;
  name: string;
  description: string;
  formula: string;
  aggregation: string;
  category: string;
  usedIn: string[];
  status: 'published' | 'draft';
  createdAt: string;
}

const INITIAL_METRICS: Metric[] = [
  {
    id: 'm-001',
    name: 'Publish Conversion Rate',
    description: 'Percentage of processed videos that are published to a channel.',
    formula: 'COUNT(published_videos) / COUNT(processed_videos) * 100',
    aggregation: 'RATIO',
    category: 'Conversion',
    usedIn: ['Overview', 'Channel Analytics', 'Client Portal'],
    status: 'published',
    createdAt: '2025-06-01',
  },
  {
    id: 'm-002',
    name: 'Clip Yield',
    description: 'Average number of output clips generated per source video.',
    formula: 'SUM(clips_generated) / COUNT(video_id)',
    aggregation: 'RATIO',
    category: 'Efficiency',
    usedIn: ['Overview', 'Content Performance'],
    status: 'published',
    createdAt: '2025-06-01',
  },
  {
    id: 'm-003',
    name: 'Total Duration Processed',
    description: 'Total hours of source video processed in the period.',
    formula: 'SUM(duration_min) / 60',
    aggregation: 'SUM',
    category: 'Volume',
    usedIn: ['Overview', 'Processing Insights'],
    status: 'published',
    createdAt: '2025-06-01',
  },
  {
    id: 'm-004',
    name: 'Avg Processing Time',
    description: 'Mean time in minutes to fully process a single video.',
    formula: 'AVG(processing_time_min)',
    aggregation: 'AVG',
    category: 'Performance',
    usedIn: ['Team Productivity', 'Processing Insights'],
    status: 'published',
    createdAt: '2025-07-10',
  },
  {
    id: 'm-005',
    name: 'Revenue per Clip',
    description: 'Estimated revenue attributed per generated clip (placeholder).',
    formula: 'SUM(estimated_revenue) / SUM(clips_generated)',
    aggregation: 'RATIO',
    category: 'Revenue',
    usedIn: [],
    status: 'draft',
    createdAt: '2026-01-20',
  },
  {
    id: 'm-006',
    name: 'MoM Video Growth',
    description: 'Month-over-month growth percentage in videos processed.',
    formula: '(current_month_videos - previous_month_videos) / previous_month_videos * 100',
    aggregation: 'RATIO',
    category: 'Growth',
    usedIn: ['Overview'],
    status: 'published',
    createdAt: '2025-09-01',
  },
];

const CATEGORIES = ['Conversion', 'Efficiency', 'Volume', 'Performance', 'Revenue', 'Growth', 'Quality', 'Other'];
const AGGREGATIONS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'RATIO', 'CUSTOM'];

const CATEGORY_COLORS: Record<string, string> = {
  Conversion: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Efficiency: 'text-green-400 bg-green-500/10 border-green-500/20',
  Volume: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Performance: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Revenue: 'text-frammer-red bg-frammer-red/10 border-frammer-red/20',
  Growth: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Quality: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Other: 'text-[#71717A] bg-white/5 border-[#27272A]',
};

const EMPTY_METRIC: Omit<Metric, 'id' | 'createdAt' | 'usedIn'> = {
  name: '',
  description: '',
  formula: '',
  aggregation: 'SUM',
  category: 'Conversion',
  status: 'draft',
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>(INITIAL_METRICS);
  const [editTarget, setEditTarget] = useState<Metric | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_METRIC>(EMPTY_METRIC);
  const [filterCategory, setFilterCategory] = useState('all');
  const { toast } = useToast();
  const { data: registryMetrics } = useRegistryMetrics();

  const displayed = filterCategory === 'all' ? metrics : metrics.filter((m) => m.category === filterCategory);

  const openNew = () => {
    setForm(EMPTY_METRIC);
    setIsNew(true);
    setEditTarget(null);
  };

  const openEdit = (m: Metric) => {
    setForm({ name: m.name, description: m.description, formula: m.formula, aggregation: m.aggregation, category: m.category, status: m.status });
    setEditTarget(m);
    setIsNew(false);
  };

  const handleSave = () => {
    if (!form.name || !form.formula) {
      toast({ title: 'Validation error', description: 'Name and formula are required.', variant: 'destructive' });
      return;
    }
    if (isNew) {
      setMetrics((prev) => [
        ...prev,
        { ...form, id: `m-${Date.now()}`, usedIn: [], createdAt: new Date().toISOString().slice(0, 10) },
      ]);
      toast({ title: 'Metric created', description: `${form.name} saved as ${form.status}.` });
    } else if (editTarget) {
      setMetrics((prev) =>
        prev.map((m) => (m.id === editTarget.id ? { ...m, ...form } : m))
      );
      toast({ title: 'Metric updated', description: `${form.name} has been saved.` });
    }
    setEditTarget(null);
    setIsNew(false);
  };

  return (
    <DashboardLayout title="Metric Layer" subtitle="Define and manage reusable business metrics">
      <div className="space-y-6">
        <PageHeader
          title="Semantic Metric Layer"
          subtitle="Define business metrics once — reuse across all dashboards and queries"
          badge={{ label: `${metrics.filter((m) => m.status === 'published').length} published`, variant: 'red' }}
          actions={
            <Button onClick={openNew} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs h-8">
              <Plus size={13} className="mr-1.5" /> New Metric
            </Button>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Metrics', value: metrics.length, icon: <Sigma size={16} /> },
            { label: 'Published', value: metrics.filter((m) => m.status === 'published').length, icon: <CheckCircle2 size={16} className="text-green-400" /> },
            { label: 'Draft', value: metrics.filter((m) => m.status === 'draft').length, icon: <Clock size={16} className="text-amber-400" /> },
            { label: 'Categories', value: CATEGORIES.filter((c) => metrics.some((m) => m.category === c)).length, icon: <Tag size={16} className="text-blue-400" /> },
          ].map((s) => (
            <div key={s.label} className="frammer-card p-4 flex items-center gap-3">
              <div className="text-[#52525B]">{s.icon}</div>
              <div>
                <p className="text-xl font-bold font-metric text-white">{s.value}</p>
                <p className="text-xs text-[#71717A]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap gap-2">
          {['all', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterCategory === cat
                  ? 'bg-frammer-red/15 border border-frammer-red/30 text-white'
                  : 'text-[#71717A] hover:text-white hover:bg-white/5 border border-transparent'
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Metrics table */}
        <div className="rounded-xl border border-[#1C1C1C] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#1C1C1C] hover:bg-transparent bg-[#111111]">
                {['Metric Name', 'Category', 'Aggregation', 'Formula', 'Used In', 'Status', ''].map((h) => (
                  <TableHead key={h} className="text-[11px] uppercase tracking-wider text-[#52525B] py-3 px-4">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((m) => (
                <TableRow key={m.id} className="border-[#1C1C1C] hover:bg-white/2">
                  <TableCell className="py-3 px-4">
                    <div>
                      <p className="text-sm text-white font-medium">{m.name}</p>
                      <p className="text-[11px] text-[#52525B] mt-0.5 max-w-56 truncate">{m.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', CATEGORY_COLORS[m.category] ?? CATEGORY_COLORS.Other)}>
                      {m.category}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className="text-[11px] font-mono text-[#71717A] bg-[#1C1C1C] px-1.5 py-0.5 rounded">
                      {m.aggregation}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-xs">
                    <code className="text-[11px] text-[#A1A1AA] font-mono bg-[#161616] px-2 py-1 rounded border border-[#27272A] block truncate">
                      {m.formula}
                    </code>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    {m.usedIn.length === 0 ? (
                      <span className="text-[11px] text-[#52525B]">—</span>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        {m.usedIn.slice(0, 2).map((d) => (
                          <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#71717A] border border-[#27272A]">{d}</span>
                        ))}
                        {m.usedIn.length > 2 && (
                          <span className="text-[10px] text-[#52525B]">+{m.usedIn.length - 2}</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full border font-medium',
                      m.status === 'published'
                        ? 'text-green-400 bg-green-500/10 border-green-500/20'
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    )}>
                      {m.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#52525B] hover:text-white" onClick={() => openEdit(m)}>
                        <Pencil size={12} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[#52525B] hover:text-red-400" onClick={() => setMetrics((p) => p.filter((x) => x.id !== m.id))}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Registry Metrics — live from backend */}
        {registryMetrics && registryMetrics.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-[#52525B]" />
              <h3 className="text-sm font-semibold text-white">System Registry Metrics</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10">
                {registryMetrics.length} metrics from backend registry
              </span>
            </div>
            <div className="rounded-xl border border-[#1C1C1C] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1C1C1C] bg-[#111111]">
                    {['Metric', 'Formula / SQL', 'Dimensions', 'Proxy'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#52525B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registryMetrics.map((m) => (
                    <tr key={m.name} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <p className="text-sm text-white font-medium">{m.label}</p>
                        <p className="text-[10px] text-[#52525B] font-mono">{m.name}</p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <code className="text-[11px] text-[#A1A1AA] font-mono bg-[#161616] px-2 py-1 rounded border border-[#27272A] block truncate">
                          {m.formula_sql ?? `${m.numerator ?? '—'} / ${m.denominator ?? '—'}`}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-[#71717A]">
                          {m.valid_dimensions === 'all' ? 'All dimensions' : (m.valid_dimensions as string[]).join(', ')}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {m.is_proxy ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10">proxy</span>
                        ) : (
                          <span className="text-[10px] text-[#52525B]">direct</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit / New modal */}
      <Dialog open={isNew || !!editTarget} onOpenChange={() => { setIsNew(false); setEditTarget(null); }}>
        <DialogContent className="bg-[#111111] border-[#27272A] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Calculator size={16} className="text-frammer-red" />
              {isNew ? 'New Metric' : 'Edit Metric'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-[#A1A1AA]">Metric Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Publish Conversion Rate"
                  className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A1A1AA]">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#27272A]">
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="text-sm text-[#A1A1AA]">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A1A1AA]">Aggregation</Label>
                <Select value={form.aggregation} onValueChange={(v) => setForm((p) => ({ ...p, aggregation: v }))}>
                  <SelectTrigger className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#27272A]">
                    {AGGREGATIONS.map((a) => (
                      <SelectItem key={a} value={a} className="text-sm text-[#A1A1AA]">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-[#A1A1AA]">Description</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Human-readable description of this metric"
                  className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs text-[#A1A1AA]">SQL Formula</Label>
                <Textarea
                  value={form.formula}
                  onChange={(e) => setForm((p) => ({ ...p, formula: e.target.value }))}
                  placeholder="e.g. COUNT(published_flag = true) / COUNT(video_id) * 100"
                  rows={3}
                  className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm font-mono resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A1A1AA]">Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-9 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#161616] border-[#27272A]">
                    <SelectItem value="draft" className="text-sm text-[#A1A1AA]">Draft</SelectItem>
                    <SelectItem value="published" className="text-sm text-[#A1A1AA]">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" className="border-[#27272A] text-[#A1A1AA]" onClick={() => { setIsNew(false); setEditTarget(null); }}>
                Cancel
              </Button>
              <Button size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white" onClick={handleSave}>
                {isNew ? 'Create Metric' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
