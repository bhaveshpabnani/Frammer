import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  LayoutDashboard,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  ExternalLink,
  BarChart3,
  PieChart,
  TrendingUp,
  Table2,
  Clock,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DashboardItem {
  id: string;
  name: string;
  description: string;
  widgetCount: number;
  lastModified: string;
  author: string;
  tag: 'Official' | 'Personal' | 'Shared';
  thumbnailWidgets: ('bar' | 'line' | 'pie' | 'kpi' | 'table')[];
}

const INITIAL_DASHBOARDS: DashboardItem[] = [
  {
    id: 'dash-1',
    name: 'Executive Overview',
    description: 'High-level KPIs, content funnel, and monthly trends for stakeholder reviews.',
    widgetCount: 8,
    lastModified: '2026-02-28',
    author: 'Priya S.',
    tag: 'Official',
    thumbnailWidgets: ['kpi', 'bar', 'line', 'pie'],
  },
  {
    id: 'dash-2',
    name: 'Channel Performance',
    description: 'Breakdown of clips, hours, and publish rate by channel.',
    widgetCount: 6,
    lastModified: '2026-02-20',
    author: 'Arjun M.',
    tag: 'Official',
    thumbnailWidgets: ['bar', 'bar', 'table'],
  },
  {
    id: 'dash-3',
    name: 'Team Productivity',
    description: 'Per-member processing metrics, throughput, and efficiency scores.',
    widgetCount: 5,
    lastModified: '2026-02-15',
    author: 'Zara K.',
    tag: 'Shared',
    thumbnailWidgets: ['table', 'kpi', 'bar'],
  },
  {
    id: 'dash-4',
    name: 'Language & Region',
    description: 'Content volume and publishing breakdown by language.',
    widgetCount: 4,
    lastModified: '2026-01-30',
    author: 'Priya S.',
    tag: 'Personal',
    thumbnailWidgets: ['pie', 'bar'],
  },
  {
    id: 'dash-5',
    name: 'Client Portal — TechCorp',
    description: 'Client-facing dashboard showing processed and published stats for TechCorp.',
    widgetCount: 7,
    lastModified: '2026-02-10',
    author: 'Arnav R.',
    tag: 'Shared',
    thumbnailWidgets: ['kpi', 'kpi', 'line', 'table'],
  },
  {
    id: 'dash-6',
    name: 'Processing Funnel',
    description: 'Upload → Process → Publish funnel with stage conversion rates.',
    widgetCount: 3,
    lastModified: '2026-01-18',
    author: 'Divya P.',
    tag: 'Personal',
    thumbnailWidgets: ['kpi', 'bar', 'line'],
  },
];

const TAG_COLORS: Record<DashboardItem['tag'], string> = {
  Official: 'bg-frammer-red/15 text-frammer-red border-frammer-red/30',
  Shared: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Personal: 'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]',
};

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  bar: <BarChart3 size={14} className="text-[#52525B]" />,
  line: <TrendingUp size={14} className="text-[#52525B]" />,
  pie: <PieChart size={14} className="text-[#52525B]" />,
  kpi: <span className="text-[10px] text-[#52525B] font-metric">KPI</span>,
  table: <Table2 size={14} className="text-[#52525B]" />,
};

function DashboardThumbnail({ widgets }: { widgets: DashboardItem['thumbnailWidgets'] }) {
  return (
    <div className="h-28 bg-[#0D0D0D] rounded-lg overflow-hidden p-3 grid grid-cols-3 gap-1.5">
      {widgets.map((w, i) => (
        <div
          key={i}
          className={cn(
            'rounded bg-[#1C1C1C] flex items-center justify-center',
            i === 0 && widgets.length <= 3 ? 'col-span-2' : ''
          )}
        >
          {WIDGET_ICONS[w]}
        </div>
      ))}
    </div>
  );
}

export default function DashboardsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dashboards, setDashboards] = useState<DashboardItem[]>(INITIAL_DASHBOARDS);
  const [filterTag, setFilterTag] = useState<string>('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const filtered =
    filterTag === 'All' ? dashboards : dashboards.filter((d) => d.tag === filterTag);

  const handleDelete = (id: string) => {
    setDashboards((p) => p.filter((d) => d.id !== id));
    toast({ title: 'Dashboard deleted' });
  };

  const handleDuplicate = (d: DashboardItem) => {
    const newD: DashboardItem = {
      ...d,
      id: `dash-${Date.now()}`,
      name: `${d.name} (copy)`,
      tag: 'Personal',
      lastModified: new Date().toISOString().slice(0, 10),
    };
    setDashboards((p) => [newD, ...p]);
    toast({ title: 'Dashboard duplicated' });
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    const d: DashboardItem = {
      id: `dash-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'No description.',
      widgetCount: 0,
      lastModified: new Date().toISOString().slice(0, 10),
      author: 'You',
      tag: 'Personal',
      thumbnailWidgets: [],
    };
    setDashboards((p) => [d, ...p]);
    setCreateOpen(false);
    setNewName('');
    setNewDesc('');
    navigate('/dashboards/builder');
  };

  return (
    <DashboardLayout title="Dashboards" subtitle="Manage your analytics dashboards">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Dashboards"
            subtitle={`${dashboards.length} dashboards across your workspace`}
          />
          <Button
            onClick={() => setCreateOpen(true)}
            size="sm"
            className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs"
          >
            <Plus size={13} className="mr-1.5" /> New Dashboard
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1">
          {['All', 'Official', 'Shared', 'Personal'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterTag(t)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs transition-all',
                filterTag === t
                  ? 'bg-frammer-red/15 text-white border border-frammer-red/30'
                  : 'text-[#52525B] hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="frammer-card group hover:border-[#3F3F46] transition-all flex flex-col"
            >
              <div className="p-4 flex-1 space-y-3">
                <DashboardThumbnail widgets={d.thumbnailWidgets} />
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-semibold truncate">{d.name}</p>
                    <p className="text-xs text-[#52525B] mt-0.5 line-clamp-2">{d.description}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-[#52525B] hover:text-white transition-colors mt-0.5 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal size={15} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#161616] border-[#27272A]">
                      <DropdownMenuItem onClick={() => navigate('/dashboards/builder')} className="text-[#A1A1AA] text-xs hover:text-white cursor-pointer">
                        <Pencil size={12} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(d)} className="text-[#A1A1AA] text-xs hover:text-white cursor-pointer">
                        <Copy size={12} className="mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(d.id)} className="text-red-400 text-xs hover:text-red-300 cursor-pointer">
                        <Trash2 size={12} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={cn('text-[10px] px-2 py-0 border', TAG_COLORS[d.tag])}>
                    {d.tag}
                  </Badge>
                  <span className="text-[10px] text-[#52525B]">{d.widgetCount} widgets</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#52525B]">
                  <span className="flex items-center gap-1"><User size={9} /> {d.author}</span>
                  <span className="flex items-center gap-1"><Clock size={9} /> {d.lastModified}</span>
                </div>
              </div>
              <div className="px-4 py-2.5 border-t border-[#1C1C1C] flex gap-2">
                <Button
                  onClick={() => navigate('/dashboards/builder')}
                  size="sm"
                  className="flex-1 h-7 text-[11px] bg-frammer-red/15 hover:bg-frammer-red/25 text-white border-0"
                >
                  <ExternalLink size={10} className="mr-1.5" /> Open
                </Button>
                <Button
                  onClick={() => navigate('/dashboards/builder')}
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-7 text-[11px] text-[#52525B] hover:text-white"
                >
                  <Pencil size={10} className="mr-1.5" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111111] border-[#27272A] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <LayoutDashboard size={16} className="text-frammer-red" /> New Dashboard
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Dashboard name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm"
            />
            <Textarea
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={2}
              className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)} className="text-[#52525B] text-xs">Cancel</Button>
            <Button onClick={handleCreate} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">
              Create & Open Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
