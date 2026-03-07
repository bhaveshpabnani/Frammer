import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus, LayoutDashboard, MoreHorizontal, Pencil, Trash2, Copy,
  ExternalLink, Lock, Users, User, Star, Clock, ShieldCheck,
  BookmarkCheck, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilters } from '@/contexts/FilterContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type DashboardType = 'official' | 'team' | 'personal';

interface WidgetDef {
  id: string;
  type: 'kpi' | 'chart' | 'table';
  title: string;
  endpoint: string;
}

interface SavedDashboard {
  id: string;
  name: string;
  description?: string;
  type: DashboardType;
  filter_state: Record<string, string>;
  widgets: WidgetDef[];
  layout: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  metric_version: string;
  query_version: string;
  data_range: string;
  // drill bookmarks as array of { label, url }
  drill_bookmarks: { label: string; url: string }[];
}

// ── Persistence helpers ───────────────────────────────────────────────────────

const STORAGE_KEY = 'frammer_saved_dashboards';

function loadDashboards(): SavedDashboard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveDashboards(dashboards: SavedDashboard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards));
}

// ── Default official dashboards ───────────────────────────────────────────────

const OFFICIAL_DASHBOARDS: SavedDashboard[] = [
  {
    id: 'official-overview',
    name: 'Operations Overview',
    description: 'Official executive overview of the content pipeline',
    type: 'official',
    filter_state: {},
    widgets: [
      { id: 'w1', type: 'kpi',   title: 'Pipeline KPIs',     endpoint: '/api/v1/core/kpis' },
      { id: 'w2', type: 'chart', title: 'Monthly Trend',     endpoint: '/api/v1/trends/monthly' },
      { id: 'w3', type: 'chart', title: 'Channel Health',    endpoint: '/api/v1/performance/analytics/channel-health' },
    ],
    layout: ['w1', 'w2', 'w3'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user_id: 'system',
    metric_version: '1.0',
    query_version:  '1.0',
    data_range:     'last_30d',
    drill_bookmarks: [],
  },
  {
    id: 'official-quality',
    name: 'Data Quality Monitor',
    description: 'Official DQ scorecard and rule evaluation dashboard',
    type: 'official',
    filter_state: {},
    widgets: [
      { id: 'w1', type: 'kpi',   title: 'DQ Score',    endpoint: '/api/v1/diagnostics/quality/summary' },
      { id: 'w2', type: 'table', title: 'DQ Rules',    endpoint: '/api/v1/diagnostics/quality/rules' },
      { id: 'w3', type: 'table', title: 'DQ Issues',   endpoint: '/api/v1/diagnostics/quality/issues' },
    ],
    layout: ['w1', 'w2', 'w3'],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    user_id: 'system',
    metric_version: '1.0',
    query_version:  '1.0',
    data_range:     'last_30d',
    drill_bookmarks: [],
  },
];

// ── Type icons ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<DashboardType, { icon: React.ReactNode; label: string; badge: string }> = {
  official: { icon: <Lock className="h-3.5 w-3.5" />,   label: 'Official',  badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  team:     { icon: <Users className="h-3.5 w-3.5" />,  label: 'Team',      badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  personal: { icon: <User className="h-3.5 w-3.5" />,   label: 'Personal',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

// ── Audit log ─────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  action: 'created' | 'updated' | 'deleted' | 'viewed';
  dashboard_name: string;
  dashboard_id: string;
  timestamp: string;
  user_id: string;
  metric_version: string;
  data_range: string;
}

const AUDIT_KEY = 'frammer_audit_log';

function loadAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function appendAuditLog(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
  const log = loadAuditLog();
  const newEntry: AuditEntry = {
    ...entry,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };
  log.unshift(newEntry);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log.slice(0, 100)));
}

// ── Main component ────────────────────────────────────────────────────────────

const Dashboards: React.FC = () => {
  const { filters }                           = useFilters();
  const [personalDashboards, setPersonalDashboards] = useState<SavedDashboard[]>(() => loadDashboards());
  const [activeTab, setActiveTab]             = useState<'official' | 'team' | 'personal' | 'audit'>('official');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editTarget, setEditTarget]           = useState<SavedDashboard | null>(null);
  const [newName, setNewName]                 = useState('');
  const [newDesc, setNewDesc]                 = useState('');
  const [newType, setNewType]                 = useState<DashboardType>('personal');
  const [auditLog, setAuditLog]               = useState<AuditEntry[]>(() => loadAuditLog());

  // Persist to localStorage on change
  useEffect(() => {
    saveDashboards(personalDashboards);
  }, [personalDashboards]);

  const currentFilterState = {
    client:          filters.client,
    channel:         filters.channel,
    language:        filters.language,
    dateRange:       filters.dateRange,
    teamMember:      filters.teamMember,
    inputType:       filters.inputType,
    outputType:      filters.outputType,
    publishedFlag:   filters.publishedFlag,
    publishedPlatform: filters.publishedPlatform,
    billableFlag:    filters.billableFlag,
  };

  const createDashboard = () => {
    if (!newName.trim()) return;
    const d: SavedDashboard = {
      id:               Date.now().toString(),
      name:             newName.trim(),
      description:      newDesc.trim(),
      type:             newType,
      filter_state:     currentFilterState,
      widgets:          [],
      layout:           [],
      created_at:       new Date().toISOString(),
      updated_at:       new Date().toISOString(),
      user_id:          'current_user',
      metric_version:   '1.0',
      query_version:    '1.0',
      data_range:       filters.dateRange,
      drill_bookmarks:  [],
    };
    setPersonalDashboards(prev => [d, ...prev]);
    appendAuditLog({ action: 'created', dashboard_name: d.name, dashboard_id: d.id, user_id: 'current_user', metric_version: '1.0', data_range: filters.dateRange });
    setAuditLog(loadAuditLog());
    setShowCreateDialog(false);
    setNewName('');
    setNewDesc('');
  };

  const saveCurrent = (id: string) => {
    setPersonalDashboards(prev => prev.map(d =>
      d.id === id
        ? { ...d, filter_state: currentFilterState, updated_at: new Date().toISOString(), data_range: filters.dateRange }
        : d
    ));
    appendAuditLog({ action: 'updated', dashboard_name: personalDashboards.find(d => d.id === id)?.name ?? id, dashboard_id: id, user_id: 'current_user', metric_version: '1.0', data_range: filters.dateRange });
    setAuditLog(loadAuditLog());
  };

  const deleteDashboard = (id: string) => {
    const d = personalDashboards.find(d => d.id === id);
    if (d) appendAuditLog({ action: 'deleted', dashboard_name: d.name, dashboard_id: id, user_id: 'current_user', metric_version: '1.0', data_range: d.data_range });
    setPersonalDashboards(prev => prev.filter(d => d.id !== id));
    setAuditLog(loadAuditLog());
  };

  const duplicateDashboard = (d: SavedDashboard) => {
    const copy: SavedDashboard = {
      ...d,
      id:   Date.now().toString(),
      name: `${d.name} (copy)`,
      type: 'personal',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPersonalDashboards(prev => [copy, ...prev]);
  };

  const DashboardCard = ({ d, readonly = false }: { d: SavedDashboard; readonly?: boolean }) => {
    const cfg   = TYPE_CONFIG[d.type];
    const isStale = d.filter_state.dateRange !== filters.dateRange;
    return (
      <div className="frammer-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide', cfg.badge)}>
                {cfg.icon}
                {cfg.label}
              </span>
              {isStale && !readonly && (
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Stale filters
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[#E4E4E7] truncate">{d.name}</h3>
            {d.description && <p className="text-[11px] text-[#52525B] mt-0.5 line-clamp-2">{d.description}</p>}
          </div>
          {!readonly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-[#52525B] hover:text-[#A1A1AA] flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => saveCurrent(d.id)} className="gap-2">
                  <BookmarkCheck className="h-4 w-4" /> Save current filters
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => duplicateDashboard(d)} className="gap-2">
                  <Copy className="h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteDashboard(d.id)} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Saved filter chips */}
        {Object.entries(d.filter_state).filter(([, v]) => v && v !== 'all').length > 0 && (
          <div className="flex flex-wrap gap-1">
            {Object.entries(d.filter_state)
              .filter(([, v]) => v && v !== 'all')
              .map(([k, v]) => (
                <Badge key={k} variant="secondary" className="text-[10px]">{k}: {v}</Badge>
              ))}
          </div>
        )}

        {/* Widgets preview */}
        {d.widgets.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {d.widgets.slice(0, 3).map(w => (
              <span key={w.id} className="text-[10px] px-1.5 py-0.5 rounded bg-[#111] border border-[#1C1C1C] text-[#71717A]">
                {w.title}
              </span>
            ))}
            {d.widgets.length > 3 && (
              <span className="text-[10px] text-[#52525B]">+{d.widgets.length - 3} more</span>
            )}
          </div>
        )}

        {/* Drill bookmarks */}
        {d.drill_bookmarks.length > 0 && (
          <div className="space-y-1">
            {d.drill_bookmarks.slice(0, 2).map((b, i) => (
              <a key={i} href={b.url} className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                <ExternalLink className="h-3 w-3" /> {b.label}
              </a>
            ))}
          </div>
        )}

        {/* Audit metadata */}
        <div className="border-t border-[#1C1C1C] pt-2 text-[10px] text-[#3a3a3a] flex flex-wrap gap-x-3 gap-y-0.5">
          <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {new Date(d.updated_at).toLocaleDateString()}</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> v{d.metric_version}</span>
          <span>{d.data_range}</span>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Dashboards" subtitle="Governance, saved views, and audit trail">
      <div className="space-y-6 animate-fade-in">

        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Saved Dashboards"
            subtitle="Official, team, and personal dashboards with filter state persistence and audit trail"
            badge={{ label: 'GOVERNANCE', variant: 'blue' as any }}
            onDownload={() => {}}
          />
          <Button
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            New Dashboard
          </Button>
        </div>

        {/* Current context bar */}
        <div className="frammer-card p-3 text-xs flex flex-wrap items-center gap-3">
          <span className="text-[#52525B]">Current filter state:</span>
          {Object.entries(currentFilterState).filter(([, v]) => v && v !== 'all').length === 0 ? (
            <span className="text-[#71717A]">No filters active (showing all data)</span>
          ) : (
            Object.entries(currentFilterState).filter(([, v]) => v && v !== 'all').map(([k, v]) => (
              <Badge key={k} variant="secondary" className="text-[10px]">{k}: {v}</Badge>
            ))
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
          <TabsList className="bg-[#111] border border-[#1C1C1C]">
            <TabsTrigger value="official">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              Official ({OFFICIAL_DASHBOARDS.length})
            </TabsTrigger>
            <TabsTrigger value="personal">
              <User className="h-3.5 w-3.5 mr-1.5" />
              Personal ({personalDashboards.filter(d => d.type === 'personal').length})
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Team ({personalDashboards.filter(d => d.type === 'team').length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Official dashboards */}
          <TabsContent value="official" className="mt-4">
            <div className="mb-3 flex items-center gap-2 text-xs text-[#52525B]">
              <Lock className="h-3.5 w-3.5" />
              Official dashboards are read-only templates managed by the platform team.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {OFFICIAL_DASHBOARDS.map(d => (
                <DashboardCard key={d.id} d={d} readonly />
              ))}
            </div>
          </TabsContent>

          {/* Personal dashboards */}
          <TabsContent value="personal" className="mt-4">
            {personalDashboards.filter(d => d.type === 'personal').length === 0 ? (
              <div className="text-center py-12 text-[#52525B] text-sm">
                <LayoutDashboard className="mx-auto h-8 w-8 mb-2 opacity-40" />
                No personal dashboards yet. Click "New Dashboard" to create one.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalDashboards.filter(d => d.type === 'personal').map(d => (
                  <DashboardCard key={d.id} d={d} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Team dashboards */}
          <TabsContent value="team" className="mt-4">
            {personalDashboards.filter(d => d.type === 'team').length === 0 ? (
              <div className="text-center py-12 text-[#52525B] text-sm">
                <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
                No team dashboards yet. Create one and set the type to "Team".
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalDashboards.filter(d => d.type === 'team').map(d => (
                  <DashboardCard key={d.id} d={d} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Audit Log */}
          <TabsContent value="audit" className="mt-4">
            <div className="frammer-card overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1C1C1C] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#E4E4E7]">Audit Log</h3>
                <span className="text-[10px] text-[#52525B]">Last 100 actions · stored locally</span>
              </div>
              {auditLog.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#52525B]">No audit entries yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1C1C1C]">
                        {['Time', 'Action', 'Dashboard', 'User', 'Metric v', 'Data Range'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-[#52525B] uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {auditLog.map(entry => (
                        <tr key={entry.id} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                          <td className="px-4 py-2 font-mono text-[#52525B]">{new Date(entry.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-2">
                            <Badge
                              variant="outline"
                              className={cn('text-[10px] capitalize', {
                                'text-green-400 border-green-500/30': entry.action === 'created',
                                'text-blue-400 border-blue-500/30':   entry.action === 'updated',
                                'text-red-400 border-red-500/30':     entry.action === 'deleted',
                                'text-[#71717A]':                      entry.action === 'viewed',
                              })}
                            >
                              {entry.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-[#A1A1AA] max-w-[160px] truncate">{entry.dashboard_name}</td>
                          <td className="px-4 py-2 text-[#71717A] font-mono">{entry.user_id}</td>
                          <td className="px-4 py-2 text-[#52525B] font-mono">v{entry.metric_version}</td>
                          <td className="px-4 py-2 text-[#52525B]">{entry.data_range}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-[#111] border-[#1C1C1C]">
            <DialogHeader>
              <DialogTitle>New Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717A]">Name *</label>
                <Input
                  className="bg-[#0a0a0a] border-[#1C1C1C]"
                  placeholder="My dashboard"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717A]">Description</label>
                <Input
                  className="bg-[#0a0a0a] border-[#1C1C1C]"
                  placeholder="Optional description"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717A]">Type</label>
                <div className="flex gap-2">
                  {(['personal', 'team'] as DashboardType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setNewType(t)}
                      className={cn(
                        'flex-1 text-xs py-2 rounded border transition-colors capitalize',
                        newType === t
                          ? 'border-primary text-primary bg-primary/10'
                          : 'border-[#1C1C1C] text-[#71717A] hover:border-[#3a3a3a]',
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-[11px] text-[#52525B] p-3 rounded bg-[#0a0a0a] border border-[#1C1C1C]">
                Current filters will be saved automatically. Metric version and timestamp are logged for audit.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="bg-[#111] border-[#1C1C1C]">
                Cancel
              </Button>
              <Button onClick={createDashboard} disabled={!newName.trim()}>
                Create Dashboard
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
};

export default Dashboards;
