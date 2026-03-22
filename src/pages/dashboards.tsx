import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BookOpen,
  Copy,
  ExternalLink,
  LayoutDashboard,
  MonitorCog,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { downloadCsv } from '@/lib/utils';
import { useFilters } from '@/contexts/FilterContext';
import { useToast } from '@/hooks/use-toast';
import {
  appendDashboardActivity,
  createPersonalDashboard,
  duplicatePersonalDashboard,
  loadDashboardActivity,
  loadPersonalDashboards,
  savePersonalDashboards,
  STARTER_DASHBOARDS,
  type LocalDashboard,
  type LocalDashboardActivity,
} from '@/lib/localDashboards';

const filterLabelMap: Record<string, string> = {
  client: 'Client',
  channel: 'Channel',
  language: 'Language',
  dateRange: 'Date',
  teamMember: 'Team Member',
  inputType: 'Input Type',
  outputType: 'Output Type',
  publishedFlag: 'Published',
  publishedPlatform: 'Platform',
  billableFlag: 'Billable',
};

function isMeaningfulFilterValue(value?: string) {
  return Boolean(value && value !== 'all' && value !== 'all_data');
}

function filterEntries(dashboard: LocalDashboard) {
  return Object.entries(dashboard.filter_state).filter(([, value]) => isMeaningfulFilterValue(value));
}

const Dashboards: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { filters, updateFilters } = useFilters();

  const [personalDashboards, setPersonalDashboards] = useState<LocalDashboard[]>(() => loadPersonalDashboards());
  const [activityLog, setActivityLog] = useState<LocalDashboardActivity[]>(() => loadDashboardActivity());
  const [activeTab, setActiveTab] = useState<'templates' | 'personal' | 'activity'>('templates');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const currentFilterState = {
    client: filters.client,
    channel: filters.channel,
    language: filters.language,
    dateRange: filters.dateRange,
    teamMember: filters.teamMember,
    inputType: filters.inputType,
    outputType: filters.outputType,
    publishedFlag: filters.publishedFlag,
    publishedPlatform: filters.publishedPlatform,
    billableFlag: filters.billableFlag,
  };

  const currentFilterChips = useMemo(
    () => Object.entries(currentFilterState).filter(([, value]) => isMeaningfulFilterValue(value)),
    [currentFilterState],
  );

  const syncActivity = (action: LocalDashboardActivity['action'], dashboard: LocalDashboard) => {
    setActivityLog(appendDashboardActivity(action, dashboard));
  };

  const openDashboard = (dashboard: LocalDashboard) => {
    updateFilters({ ...dashboard.filter_state });
    syncActivity('opened', dashboard);
    navigate(`/dashboards/builder/${dashboard.id}`);
  };

  const createDashboard = () => {
    if (!newName.trim()) return;
    const dashboard = createPersonalDashboard({
      name: newName,
      description: newDesc,
      filterState: currentFilterState,
    });
    const nextDashboards = [dashboard, ...personalDashboards];
    setPersonalDashboards(nextDashboards);
    savePersonalDashboards(nextDashboards);
    syncActivity('created', dashboard);
    setShowCreateDialog(false);
    setNewName('');
    setNewDesc('');
    toast({
      title: 'Dashboard created',
      description: 'Saved.',
    });
    openDashboard(dashboard);
  };

  const createFromTemplate = (template: LocalDashboard) => {
    const dashboard = createPersonalDashboard({
      name: template.name,
      description: template.description,
      filterState: currentFilterState,
      fromTemplate: template,
    });
    const nextDashboards = [dashboard, ...personalDashboards];
    setPersonalDashboards(nextDashboards);
    savePersonalDashboards(nextDashboards);
    syncActivity('created', dashboard);
    toast({
      title: 'Template copied',
      description: 'A personal copy was created in this browser.',
    });
    openDashboard(dashboard);
  };

  const duplicateDashboard = (dashboard: LocalDashboard) => {
    const copy = duplicatePersonalDashboard(dashboard);
    const nextDashboards = [copy, ...personalDashboards];
    setPersonalDashboards(nextDashboards);
    savePersonalDashboards(nextDashboards);
    syncActivity('duplicated', copy);
    toast({
      title: 'Dashboard duplicated',
      description: 'Saved.',
    });
  };

  const updateSavedFilters = (dashboardId: string) => {
    let updatedDashboard: LocalDashboard | null = null;
    const nextDashboards = personalDashboards.map((dashboard) => {
      if (dashboard.id !== dashboardId) return dashboard;
      updatedDashboard = {
        ...dashboard,
        filter_state: { ...currentFilterState },
        updated_at: new Date().toISOString(),
      };
      return updatedDashboard;
    });
    setPersonalDashboards(nextDashboards);
    savePersonalDashboards(nextDashboards);
    if (updatedDashboard) {
      syncActivity('updated', updatedDashboard);
      toast({
        title: 'Saved filters updated',
        description: 'The dashboard now remembers the current filter state.',
      });
    }
  };

  const deleteDashboard = (dashboardId: string) => {
    const dashboard = personalDashboards.find((item) => item.id === dashboardId);
    if (!dashboard) return;
    const nextDashboards = personalDashboards.filter((item) => item.id !== dashboardId);
    setPersonalDashboards(nextDashboards);
    savePersonalDashboards(nextDashboards);
    syncActivity('deleted', dashboard);
  };

  const DashboardCard = ({
    dashboard,
    template = false,
  }: {
    dashboard: LocalDashboard;
    template?: boolean;
  }) => (
    <div className="frammer-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px]">
              {template ? 'Template' : 'Local'}
            </Badge>
            {dashboard.source_template_id && !template && (
              <Badge variant="outline" className="text-[10px]">
                From Starter
              </Badge>
            )}
          </div>
          <h3 className="text-sm font-semibold text-[#E4E4E7] truncate">{dashboard.name}</h3>
          {dashboard.description && (
            <p className="text-[11px] text-[#52525B] mt-1 line-clamp-2">{dashboard.description}</p>
          )}
        </div>
        <span className="text-[10px] text-[#52525B] shrink-0">
          {dashboard.widgets.length} widgets
        </span>
      </div>

      {filterEntries(dashboard).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filterEntries(dashboard).map(([key, value]) => (
            <Badge key={key} variant="secondary" className="text-[10px]">
              {filterLabelMap[key] ?? key}: {value}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {dashboard.widgets.slice(0, 4).map((widget) => (
          <span
            key={widget.id}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#111] border border-[#1C1C1C] text-[#71717A]"
          >
            {widget.title}
          </span>
        ))}
        {dashboard.widgets.length > 4 && (
          <span className="text-[10px] text-[#52525B]">+{dashboard.widgets.length - 4} more</span>
        )}
      </div>

      <div className="border-t border-[#1C1C1C] pt-3 flex flex-wrap gap-2">
        {template ? (
          <Button size="sm" className="gap-1.5" onClick={() => createFromTemplate(dashboard)}>
            <Plus className="h-3.5 w-3.5" />
            Use Template
          </Button>
        ) : (
          <>
            <Button size="sm" className="gap-1.5" onClick={() => openDashboard(dashboard)}>
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => duplicateDashboard(dashboard)}>
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => updateSavedFilters(dashboard.id)}>
              <Save className="h-3.5 w-3.5" />
              Save Filters
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-destructive" onClick={() => deleteDashboard(dashboard.id)}>
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Dashboards" subtitle="Starter dashboards and browser-local saved views">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4">
          <PageHeader
            title="Local Dashboards"
            subtitle="Starter dashboards and personal saved views stored only in this browser"
            badge={{ label: 'LOCAL ONLY', variant: 'blue' as any }}
            onDownload={() => {
              const source = activeTab === 'templates' ? STARTER_DASHBOARDS : personalDashboards;
              downloadCsv(
                `local-dashboards-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`,
                source.map((dashboard) => ({
                  id: dashboard.id,
                  name: dashboard.name,
                  description: dashboard.description ?? '',
                  type: dashboard.type,
                  widgets: dashboard.widgets.length,
                  updated_at: dashboard.updated_at,
                })),
              );
            }}
          />
          <Button size="sm" className="gap-1.5 shrink-0" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4" />
            New Dashboard
          </Button>
        </div>

        <div className="frammer-card p-3 text-xs flex flex-wrap items-center gap-3">
          <span className="text-[#52525B]">Current filter context:</span>
          {currentFilterChips.length === 0 ? (
            <span className="text-[#71717A]">No filters active</span>
          ) : (
            currentFilterChips.map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-[10px]">
                {filterLabelMap[key] ?? key}: {value}
              </Badge>
            ))
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          <TabsList className="bg-[#111] border border-[#1C1C1C]">
            <TabsTrigger value="templates">
              <BookOpen className="h-3.5 w-3.5 mr-1.5" />
              Starter Dashboards ({STARTER_DASHBOARDS.length})
            </TabsTrigger>
            <TabsTrigger value="personal">
              <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" />
              My Dashboards ({personalDashboards.length})
            </TabsTrigger>
            <TabsTrigger value="activity">
              <MonitorCog className="h-3.5 w-3.5 mr-1.5" />
              Local Activity ({activityLog.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STARTER_DASHBOARDS.map((dashboard) => (
                <DashboardCard key={dashboard.id} dashboard={dashboard} template />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="personal" className="mt-4">
            {personalDashboards.length === 0 ? (
              <div className="text-center py-12 text-[#52525B] text-sm">
                <LayoutDashboard className="mx-auto h-8 w-8 mb-2 opacity-40" />
                No local dashboards yet. Create one or start from a template.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personalDashboards.map((dashboard) => (
                  <DashboardCard key={dashboard.id} dashboard={dashboard} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <div className="frammer-card overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1C1C1C] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#E4E4E7]">Local Activity</h3>
                <span className="text-[10px] text-[#52525B]">Stored in this browser only</span>
              </div>
              {activityLog.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#52525B]">No local dashboard activity yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1C1C1C]">
                        {['Time', 'Action', 'Dashboard'].map((header) => (
                          <th key={header} className="px-4 py-2.5 text-left text-[11px] font-medium text-[#52525B] uppercase tracking-wide">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activityLog.map((entry) => (
                        <tr key={entry.id} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                          <td className="px-4 py-2 font-mono text-[#52525B]">{new Date(entry.timestamp).toLocaleString()}</td>
                          <td className="px-4 py-2 text-[#A1A1AA] capitalize">{entry.action}</td>
                          <td className="px-4 py-2 text-[#A1A1AA]">{entry.dashboard_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="bg-[#111] border-[#1C1C1C]">
            <DialogHeader>
              <DialogTitle>Create Local Dashboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717A]">Name *</label>
                <Input
                  className="bg-[#0a0a0a] border-[#1C1C1C]"
                  placeholder="My dashboard"
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-[#71717A]">Description</label>
                <Input
                  className="bg-[#0a0a0a] border-[#1C1C1C]"
                  placeholder="Optional description"
                  value={newDesc}
                  onChange={(event) => setNewDesc(event.target.value)}
                />
              </div>
              <div className="text-[11px] text-[#52525B] p-3 rounded bg-[#0a0a0a] border border-[#1C1C1C]">
                The current global filters will be saved with this dashboard, and the dashboard will only exist in this browser.
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
