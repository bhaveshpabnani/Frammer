import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChevronLeft,
  GripVertical,
  Plus,
  Save,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFilters } from '@/contexts/FilterContext';
import {
  useChannels,
  useKpis,
  useLanguages,
  useMonthly,
  useOutputTypes,
} from '@/hooks/useApi';
import {
  appendDashboardActivity,
  buildLayouts,
  createWidget,
  loadPersonalDashboards,
  savePersonalDashboards,
  updatePersonalDashboard,
  WIDGET_LIBRARY,
  type LocalDashboard,
  type LocalDashboardWidget,
} from '@/lib/localDashboards';

const PIE_FALLBACK_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e', '#8b5cf6', '#06b6d4'];

type DashboardData = {
  kpis?: ReturnType<typeof useKpis>['data'];
  monthly?: ReturnType<typeof useMonthly>['data'];
  channels?: ReturnType<typeof useChannels>['data'];
  languages?: ReturnType<typeof useLanguages>['data'];
  outputTypes?: ReturnType<typeof useOutputTypes>['data'];
  isLoading: boolean;
  hasError: boolean;
};

const DarkTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-lg p-2.5 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      <p className="text-white font-metric">
        {typeof payload[0]?.value === 'number' ? payload[0].value.toLocaleString() : payload[0]?.value}
      </p>
    </div>
  );
};

function WidgetShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col gap-2">
      <div className="text-[11px] uppercase tracking-wide text-[#71717A]">{title}</div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function WidgetStateMessage({ message, tone = 'muted' }: { message: string; tone?: 'muted' | 'error' }) {
  return (
    <div className={cn(
      'h-full flex items-center justify-center text-xs text-center px-3',
      tone === 'error' ? 'text-red-400' : 'text-[#52525B]',
    )}>
      {message}
    </div>
  );
}

function renderWidget(widget: LocalDashboardWidget, data: DashboardData) {
  if (data.hasError) {
    return <WidgetStateMessage message="This widget could not load live data." tone="error" />;
  }

  switch (widget.kind) {
    case 'kpi_total_videos':
      if (data.isLoading || !data.kpis) return <WidgetStateMessage message="Loading live KPI..." />;
      return (
        <WidgetShell title={widget.title}>
          <div className="flex flex-col justify-center h-full gap-1">
            <p className="text-3xl font-metric text-white">{data.kpis.totalVideos.toLocaleString()}</p>
            <p className="text-xs text-[#71717A]">Uploaded videos in the current filter context</p>
          </div>
        </WidgetShell>
      );

    case 'kpi_total_clips':
      if (data.isLoading || !data.kpis) return <WidgetStateMessage message="Loading live KPI..." />;
      return (
        <WidgetShell title={widget.title}>
          <div className="flex flex-col justify-center h-full gap-1">
            <p className="text-3xl font-metric text-white">{data.kpis.totalClips.toLocaleString()}</p>
            <p className="text-xs text-[#71717A]">Created clips in the current filter context</p>
          </div>
        </WidgetShell>
      );

    case 'kpi_publish_rate':
      if (data.isLoading || !data.kpis) return <WidgetStateMessage message="Loading live KPI..." />;
      return (
        <WidgetShell title={widget.title}>
          <div className="flex flex-col justify-center h-full gap-1">
            <p className="text-3xl font-metric text-white">{data.kpis.publishRate.toFixed(1)}%</p>
            <p className="text-xs text-[#71717A]">Publish conversion for the current filter context</p>
          </div>
        </WidgetShell>
      );

    case 'monthly_uploaded': {
      if (data.isLoading) return <WidgetStateMessage message="Loading monthly trend..." />;
      const rows = data.monthly ?? [];
      if (rows.length === 0) return <WidgetStateMessage message="No monthly data available for this filter set." />;
      return (
        <WidgetShell title={widget.title}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={widget.color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={widget.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#1C1C1C" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Area type="monotone" dataKey="videosProcessed" stroke={widget.color} fill={`url(#grad-${widget.id})`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    }

    case 'top_channels': {
      if (data.isLoading) return <WidgetStateMessage message="Loading channels..." />;
      const rows = (data.channels ?? []).slice(0, 6).map((row) => ({
        name: row.channel,
        value: row.videosProcessed,
      }));
      if (rows.length === 0) return <WidgetStateMessage message="No channel data available for this filter set." />;
      return (
        <WidgetShell title={widget.title}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#1C1C1C" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Bar dataKey="value" fill={widget.color} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    }

    case 'language_share': {
      if (data.isLoading) return <WidgetStateMessage message="Loading language mix..." />;
      const rows = (data.languages ?? []).slice(0, 6).map((row, index) => ({
        name: row.language,
        value: row.count,
        color: row.color ?? PIE_FALLBACK_COLORS[index % PIE_FALLBACK_COLORS.length],
      }));
      if (rows.length === 0) return <WidgetStateMessage message="No language data available for this filter set." />;
      return (
        <WidgetShell title={widget.title}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={rows} dataKey="value" nameKey="name" innerRadius="40%" outerRadius="72%" paddingAngle={2}>
                {rows.map((row) => (
                  <Cell key={row.name} fill={row.color} />
                ))}
              </Pie>
              <Tooltip content={<DarkTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </WidgetShell>
      );
    }

    case 'output_type_table': {
      if (data.isLoading) return <WidgetStateMessage message="Loading output types..." />;
      const rows = data.outputTypes ?? [];
      if (rows.length === 0) return <WidgetStateMessage message="No output-type data available for this filter set." />;
      return (
        <WidgetShell title={widget.title}>
          <div className="overflow-auto h-full text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#27272A]">
                  <th className="text-left text-[#52525B] py-1 pr-3 font-normal">Type</th>
                  <th className="text-right text-[#52525B] py-1 font-normal">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 8).map((row) => (
                  <tr key={row.type} className="border-b border-[#1C1C1C]">
                    <td className="text-[#A1A1AA] py-1 pr-3">{row.type}</td>
                    <td className="text-white font-metric text-right py-1">{row.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </WidgetShell>
      );
    }

    default:
      return <WidgetStateMessage message="Unsupported widget." tone="error" />;
  }
}

interface GridCanvasProps {
  layouts: ResponsiveLayouts;
  setLayouts: React.Dispatch<React.SetStateAction<ResponsiveLayouts>>;
  widgets: LocalDashboardWidget[];
  selected: string | null;
  setSelected: (id: string) => void;
  removeWidget: (id: string) => void;
  data: DashboardData;
}

function GridCanvas({ layouts, setLayouts, widgets, selected, setSelected, removeWidget, data }: GridCanvasProps) {
  const { containerRef, width } = useContainerWidth();
  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className="flex-1 overflow-auto bg-[#070707] p-4 bg-[radial-gradient(circle,#1C1C1C_1px,transparent_1px)] [background-size:20px_20px]"
    >
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        width={width}
        onLayoutChange={(_layout, allLayouts) => setLayouts(allLayouts)}
        breakpoints={{ lg: 1200, md: 960, sm: 720 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={60}
        margin={[12, 12]}
      >
        {widgets.map((widget) => (
          <div
            key={widget.id}
            onClick={() => setSelected(widget.id)}
            className={cn(
              'bg-[#111111] border rounded-xl overflow-hidden flex flex-col transition-all cursor-pointer',
              selected === widget.id ? 'border-frammer-red/60 shadow-lg shadow-frammer-red/10' : 'border-[#1C1C1C] hover:border-[#3F3F46]',
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1C1C1C] shrink-0">
              <span className="drag-handle cursor-grab text-[#3F3F46] hover:text-[#52525B]">
                <GripVertical size={12} />
              </span>
              <span className="text-[11px] text-[#71717A] font-medium flex-1 truncate">{widget.title}</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  removeWidget(widget.id);
                }}
                className="text-[#3F3F46] hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
            <div className="flex-1 p-3 min-h-0">
              {renderWidget(widget, data)}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

export default function DashboardBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { filters, updateFilters } = useFilters();

  const kpisQuery = useKpis();
  const monthlyQuery = useMonthly();
  const channelsQuery = useChannels();
  const languagesQuery = useLanguages();
  const outputTypesQuery = useOutputTypes();

  const [dashboard, setDashboard] = useState<LocalDashboard | null>(null);
  const [widgets, setWidgets] = useState<LocalDashboardWidget[]>([]);
  const [layouts, setLayouts] = useState<ResponsiveLayouts>({ lg: [] });
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const saved = loadPersonalDashboards().find((item) => item.id === id) ?? null;
    setDashboard(saved);
    setWidgets(saved?.widgets ?? []);
    setLayouts(saved?.layouts ?? { lg: [] });
    setSelected(saved?.widgets[0]?.id ?? null);
  }, [id]);

  useEffect(() => {
    if (!dashboard) return;
    updateFilters({ ...dashboard.filter_state });
  }, [dashboard, updateFilters]);

  const data: DashboardData = {
    kpis: kpisQuery.data,
    monthly: monthlyQuery.data,
    channels: channelsQuery.data,
    languages: languagesQuery.data,
    outputTypes: outputTypesQuery.data,
    isLoading: [kpisQuery, monthlyQuery, channelsQuery, languagesQuery, outputTypesQuery].some((query) => query.isLoading),
    hasError: [kpisQuery, monthlyQuery, channelsQuery, languagesQuery, outputTypesQuery].some((query) => Boolean(query.error)),
  };

  const selectedWidget = widgets.find((widget) => widget.id === selected) ?? null;

  const addWidget = (kind: LocalDashboardWidget['kind']) => {
    const widget = createWidget(kind);
    const nextWidgets = [...widgets, widget];
    const nextLayouts = buildLayouts(nextWidgets);
    setWidgets(nextWidgets);
    setLayouts(nextLayouts);
    setSelected(widget.id);
  };

  const removeWidget = (widgetId: string) => {
    const nextWidgets = widgets.filter((widget) => widget.id !== widgetId);
    setWidgets(nextWidgets);
    setLayouts(buildLayouts(nextWidgets));
    if (selected === widgetId) {
      setSelected(nextWidgets[0]?.id ?? null);
    }
  };

  const updateSelectedWidget = (patch: Partial<LocalDashboardWidget>) => {
    if (!selected) return;
    setWidgets((prev) => prev.map((widget) => (
      widget.id === selected ? { ...widget, ...patch } : widget
    )));
  };

  const updateDashboardMeta = (patch: Partial<LocalDashboard>) => {
    if (!dashboard) return;
    setDashboard({ ...dashboard, ...patch });
  };

  const handleSave = () => {
    if (!dashboard) return;
    const nextDashboards = updatePersonalDashboard(
      loadPersonalDashboards(),
      dashboard.id,
      (current) => ({
        ...current,
        name: dashboard.name,
        description: dashboard.description,
        filter_state: {
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
        },
        widgets,
        layouts,
      }),
    );
    savePersonalDashboards(nextDashboards);
    const nextDashboard = nextDashboards.find((item) => item.id === dashboard.id) ?? dashboard;
    setDashboard(nextDashboard);
    appendDashboardActivity('updated', nextDashboard);
    toast({
      title: 'Dashboard saved locally',
      description: 'This dashboard was updated in browser storage only.',
    });
  };

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-white text-lg font-medium">Dashboard not found</p>
          <p className="text-sm text-[#71717A]">
            This local dashboard may have been deleted or only exists in a different browser session.
          </p>
          <Button onClick={() => navigate('/dashboards')}>Back to Dashboards</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <div className="h-12 border-b border-[#1C1C1C] flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => navigate('/dashboards')} className="text-[#52525B] hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-white truncate">{dashboard.name}</span>
        <div className="flex-1" />
        <Button onClick={handleSave} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">
          <Save size={12} className="mr-1.5" />
          Save
        </Button>
      </div>

      <div className="border-b border-[#1C1C1C] px-4 py-3 text-xs text-[#71717A]">
        This dashboard is saved only in this browser. Widgets use live API data and inherit the dashboard&apos;s saved filter context when opened.
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-60 shrink-0 border-r border-[#1C1C1C] overflow-y-auto p-3 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#71717A]">Dashboard name</label>
            <input
              value={dashboard.name}
              onChange={(event) => updateDashboardMeta({ name: event.target.value })}
              className="w-full bg-[#111111] border border-[#1C1C1C] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-frammer-red/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#71717A]">Description</label>
            <textarea
              value={dashboard.description ?? ''}
              onChange={(event) => updateDashboardMeta({ description: event.target.value })}
              className="w-full min-h-[72px] resize-none bg-[#111111] border border-[#1C1C1C] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-frammer-red/50"
            />
          </div>

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-[#52525B] font-semibold">Add Widget</p>
            <div className="space-y-1.5">
              {WIDGET_LIBRARY.map((item) => (
                <button
                  key={item.kind}
                  onClick={() => addWidget(item.kind)}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left bg-[#111111] hover:bg-[#1C1C1C] border border-[#1C1C1C] hover:border-[#3F3F46] transition-all group"
                >
                  <span className="text-xs text-[#A1A1AA] group-hover:text-white transition-colors flex-1">
                    {item.label}
                  </span>
                  <Plus size={11} className="text-[#3F3F46] group-hover:text-frammer-red transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <GridCanvas
          layouts={layouts}
          setLayouts={setLayouts}
          widgets={widgets}
          selected={selected}
          setSelected={setSelected}
          removeWidget={removeWidget}
          data={data}
        />

        <div className="w-64 shrink-0 border-l border-[#1C1C1C] overflow-y-auto p-3 space-y-4">
          {selectedWidget ? (
            <>
              <div className="flex items-center gap-2">
                <Settings2 size={13} className="text-frammer-red" />
                <p className="text-xs text-white font-semibold">Widget Config</p>
              </div>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#71717A]">Title</label>
                  <input
                    value={selectedWidget.title}
                    onChange={(event) => updateSelectedWidget({ title: event.target.value })}
                    className="w-full bg-[#1C1C1C] border border-[#3F3F46] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-frammer-red/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#71717A]">Widget type</label>
                  <Select value={selectedWidget.kind} onValueChange={(value) => updateSelectedWidget({ kind: value as LocalDashboardWidget['kind'] })}>
                    <SelectTrigger className="h-8 bg-[#1C1C1C] border-[#3F3F46] text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#27272A]">
                      {WIDGET_LIBRARY.map((item) => (
                        <SelectItem key={item.kind} value={item.kind} className="text-xs text-[#A1A1AA]">
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#71717A]">Accent color</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {PIE_FALLBACK_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateSelectedWidget({ color })}
                        className={cn(
                          'w-5 h-5 rounded-full transition-transform',
                          selectedWidget.color === color ? 'ring-2 ring-white ring-offset-1 ring-offset-[#111111] scale-110' : '',
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Settings2 size={20} className="text-[#3F3F46] mx-auto" />
              <p className="text-xs text-[#52525B]">Click a widget to configure it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
