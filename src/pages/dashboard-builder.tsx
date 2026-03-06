import React, { useState, useRef } from 'react';
import { ResponsiveGridLayout, useContainerWidth } from 'react-grid-layout';
import type { LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Save,
  Undo2,
  Plus,
  Trash2,
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Table2,
  Hash,
  Settings2,
  GripVertical,
  ChevronLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { channelMetrics, teamMetrics, monthlyMetrics, languageData } from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';

type WidgetType = 'kpi' | 'bar' | 'line' | 'area' | 'pie' | 'table';

interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  color: string;
}

const WIDGET_PALETTE: { type: WidgetType; label: string; icon: React.ReactNode; defaultW: number; defaultH: number }[] = [
  { type: 'kpi', label: 'KPI Card', icon: <Hash size={14} />, defaultW: 2, defaultH: 2 },
  { type: 'bar', label: 'Bar Chart', icon: <BarChart3 size={14} />, defaultW: 4, defaultH: 3 },
  { type: 'line', label: 'Line Chart', icon: <TrendingUp size={14} />, defaultW: 4, defaultH: 3 },
  { type: 'area', label: 'Area Chart', icon: <TrendingUp size={14} />, defaultW: 6, defaultH: 3 },
  { type: 'pie', label: 'Pie Chart', icon: <PieIcon size={14} />, defaultW: 3, defaultH: 3 },
  { type: 'table', label: 'Data Table', icon: <Table2 size={14} />, defaultW: 6, defaultH: 4 },
];

const DATA_SOURCES = ['Channel Metrics', 'Team Metrics', 'Monthly Trend', 'Language Data'];
const COLORS = Object.values(CHART_COLORS);

const KPI_DATA = [
  { label: 'Videos Processed', value: '1,284', delta: '+12%' },
  { label: 'Clips Generated', value: '4,621', delta: '+18%' },
  { label: 'Hours Processed', value: '312 hrs', delta: '+6%' },
  { label: 'Publish Rate', value: '73%', delta: '+3pp' },
];

function getChartData(dataSource: string) {
  switch (dataSource) {
    case 'Channel Metrics':
      return channelMetrics.map((c) => ({ name: c.channel, value: c.clipsGenerated }));
    case 'Team Metrics':
      return teamMetrics.map((t) => ({ name: t.name.split(' ')[0], value: t.clipsGenerated }));
    case 'Monthly Trend':
      return monthlyMetrics.map((m) => ({ name: m.month.slice(0, 3), value: m.videosProcessed }));
    case 'Language Data':
      return languageData.map((l) => ({ name: l.language, value: l.count }));
    default:
      return [];
  }
}

const DarkTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-lg p-2.5 text-xs shadow-xl">
      <p className="text-[#71717A] mb-1">{label}</p>
      <p className="text-white font-metric">{payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

function WidgetContent({ config }: { config: WidgetConfig }) {
  const data = getChartData(config.dataSource);
  const kpiIndex = KPI_DATA.findIndex((k) => k.label.toLowerCase().includes(config.title.toLowerCase().split(' ')[0].toLowerCase()));
  const kpi = KPI_DATA[Math.max(0, kpiIndex)];

  switch (config.type) {
    case 'kpi':
      return (
        <div className="flex flex-col justify-center h-full gap-1">
          <p className="text-2xl font-metric text-white">{kpi.value}</p>
          <p className="text-xs text-[#52525B]">{config.title}</p>
          <span className="text-xs text-green-400">{kpi.delta}</span>
        </div>
      );
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="#1C1C1C" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Bar dataKey="value" fill={config.color} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="#1C1C1C" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Line dataKey="value" stroke={config.color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case 'area':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: -20 }}>
            <defs>
              <linearGradient id={`grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1C1C1C" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#52525B' }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Area dataKey="value" stroke={config.color} fill={`url(#grad-${config.id})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      );
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="40%" outerRadius="70%" paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      );
    case 'table':
      return (
        <div className="overflow-auto h-full text-xs">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#27272A]">
                <th className="text-left text-[#52525B] py-1 pr-3 font-normal">Name</th>
                <th className="text-right text-[#52525B] py-1 font-normal">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.name} className="border-b border-[#1C1C1C]">
                  <td className="text-[#A1A1AA] py-1 pr-3">{row.name}</td>
                  <td className="text-white font-metric text-right py-1">{row.value.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

let idCounter = 10;

interface GridCanvasProps {
  layouts: ResponsiveLayouts;
  setLayouts: React.Dispatch<React.SetStateAction<ResponsiveLayouts>>;
  widgets: WidgetConfig[];
  selected: string | null;
  setSelected: (id: string) => void;
  removeWidget: (id: string) => void;
}

function GridCanvas({ layouts, setLayouts, widgets, selected, setSelected, removeWidget }: GridCanvasProps) {
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
        {widgets.map((w) => (
          <div
            key={w.id}
            onClick={() => setSelected(w.id)}
            className={cn(
              'bg-[#111111] border rounded-xl overflow-hidden flex flex-col transition-all cursor-pointer',
              selected === w.id ? 'border-frammer-red/60 shadow-lg shadow-frammer-red/10' : 'border-[#1C1C1C] hover:border-[#3F3F46]'
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1C1C1C] shrink-0">
              <span className="drag-handle cursor-grab text-[#3F3F46] hover:text-[#52525B]">
                <GripVertical size={12} />
              </span>
              <span className="text-[11px] text-[#71717A] font-medium flex-1 truncate">{w.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); removeWidget(w.id); }}
                className="text-[#3F3F46] hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
            <div className="flex-1 p-3 min-h-0">
              <WidgetContent config={w} />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}

export default function DashboardBuilderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [layouts, setLayouts] = useState<ResponsiveLayouts>({
    lg: [
      { i: 'w-1', x: 0, y: 0, w: 2, h: 2 },
      { i: 'w-2', x: 2, y: 0, w: 2, h: 2 },
      { i: 'w-3', x: 0, y: 2, w: 4, h: 3 },
      { i: 'w-4', x: 4, y: 0, w: 4, h: 5 },
    ],
  });

  const [widgets, setWidgets] = useState<WidgetConfig[]>([
    { id: 'w-1', type: 'kpi', title: 'Videos Processed', dataSource: 'Channel Metrics', color: CHART_COLORS.red },
    { id: 'w-2', type: 'kpi', title: 'Clips Generated', dataSource: 'Team Metrics', color: CHART_COLORS.blue },
    { id: 'w-3', type: 'bar', title: 'Clips by Channel', dataSource: 'Channel Metrics', color: CHART_COLORS.red },
    { id: 'w-4', type: 'line', title: 'Monthly Trend', dataSource: 'Monthly Trend', color: CHART_COLORS.blue },
  ]);

  const [selected, setSelected] = useState<string | null>(null);

  const selectedWidget = widgets.find((w) => w.id === selected);

  const addWidget = (palette: typeof WIDGET_PALETTE[0]) => {
    const id = `w-${++idCounter}`;
    const newWidget: WidgetConfig = {
      id,
      type: palette.type,
      title: palette.label,
      dataSource: 'Channel Metrics',
      color: CHART_COLORS.red,
    };
    const newLayout: LayoutItem = {
      i: id,
      x: 0,
      y: Infinity,
      w: palette.defaultW,
      h: palette.defaultH,
    };
    setWidgets((p) => [...p, newWidget]);
    setLayouts((p) => ({ ...p, lg: [...(p.lg ?? []), newLayout] }));
  };

  const removeWidget = (id: string) => {
    setWidgets((p) => p.filter((w) => w.id !== id));
    setLayouts((p) => ({ ...p, lg: (p.lg ?? []).filter((l) => l.i !== id) }));
    if (selected === id) setSelected(null);
  };

  const updateSelected = (patch: Partial<WidgetConfig>) => {
    if (!selected) return;
    setWidgets((p) => p.map((w) => (w.id === selected ? { ...w, ...patch } : w)));
  };

  const handleSave = () => {
    toast({ title: 'Dashboard saved', description: 'Layout and widgets persisted to localStorage.' });
    try {
      localStorage.setItem('frammer-builder-widgets', JSON.stringify(widgets));
      localStorage.setItem('frammer-builder-layout', JSON.stringify(layouts));
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      {/* Toolbar */}
      <div className="h-12 border-b border-[#1C1C1C] flex items-center px-4 gap-3 shrink-0">
        <button onClick={() => navigate('/dashboards')} className="text-[#52525B] hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-white">Dashboard Builder</span>
        <Badge variant="outline" className="text-[10px] border-[#27272A] text-[#52525B]">Draft</Badge>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="text-xs text-[#52525B] hover:text-white">
          <Undo2 size={12} className="mr-1.5" /> Undo
        </Button>
        <Button onClick={handleSave} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">
          <Save size={12} className="mr-1.5" /> Save
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Widget palette */}
        <div className="w-52 shrink-0 border-r border-[#1C1C1C] overflow-y-auto p-3 space-y-4">
          <p className="text-[11px] uppercase tracking-wider text-[#52525B] font-semibold">Add Widget</p>
          <div className="space-y-1.5">
            {WIDGET_PALETTE.map((p) => (
              <button
                key={p.type}
                onClick={() => addWidget(p)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-left bg-[#111111] hover:bg-[#1C1C1C] border border-[#1C1C1C] hover:border-[#3F3F46] transition-all group"
              >
                <span className="text-[#52525B] group-hover:text-frammer-red transition-colors">{p.icon}</span>
                <span className="text-xs text-[#A1A1AA] group-hover:text-white transition-colors">{p.label}</span>
                <Plus size={11} className="ml-auto text-[#3F3F46] group-hover:text-frammer-red transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Center: Grid canvas */}
        <GridCanvas
          layouts={layouts}
          setLayouts={setLayouts}
          widgets={widgets}
          selected={selected}
          setSelected={setSelected}
          removeWidget={removeWidget}
        />

        {/* Right: Config panel */}
        <div className="w-56 shrink-0 border-l border-[#1C1C1C] overflow-y-auto p-3 space-y-4">
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
                    onChange={(e) => updateSelected({ title: e.target.value })}
                    className="w-full bg-[#1C1C1C] border border-[#3F3F46] rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-frammer-red/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#71717A]">Data Source</label>
                  <Select value={selectedWidget.dataSource} onValueChange={(v) => updateSelected({ dataSource: v })}>
                    <SelectTrigger className="h-8 bg-[#1C1C1C] border-[#3F3F46] text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#27272A]">
                      {DATA_SOURCES.map((ds) => (
                        <SelectItem key={ds} value={ds} className="text-xs text-[#A1A1AA]">{ds}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] text-[#71717A]">Color</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSelected({ color: c })}
                        className={cn(
                          'w-5 h-5 rounded-full transition-transform',
                          selectedWidget.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-[#111111] scale-110' : ''
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Settings2 size={20} className="text-[#3F3F46] mx-auto" />
              <p className="text-xs text-[#52525B]">Click a widget to configure it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
