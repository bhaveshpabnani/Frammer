import type { ResponsiveLayouts } from 'react-grid-layout';

export type LocalDashboardWidgetKind =
  | 'kpi_total_videos'
  | 'kpi_total_clips'
  | 'kpi_publish_rate'
  | 'monthly_uploaded'
  | 'top_channels'
  | 'language_share'
  | 'output_type_table';

export type LocalDashboardWidgetVisual = 'kpi' | 'line' | 'bar' | 'pie' | 'table';

export interface LocalDashboardFilterState {
  client: string;
  channel: string;
  language: string;
  dateRange: string;
  teamMember: string;
  inputType: string;
  outputType: string;
  publishedFlag: 'all' | 'true' | 'false';
  publishedPlatform: string;
  billableFlag: 'all' | 'true' | 'false';
}

export interface LocalDashboardWidget {
  id: string;
  kind: LocalDashboardWidgetKind;
  title: string;
  color: string;
}

export interface LocalDashboard {
  id: string;
  name: string;
  description?: string;
  type: 'template' | 'personal';
  filter_state: LocalDashboardFilterState;
  widgets: LocalDashboardWidget[];
  layouts: ResponsiveLayouts;
  created_at: string;
  updated_at: string;
  source_template_id?: string | null;
}

export interface LocalDashboardActivity {
  id: string;
  dashboard_id: string;
  dashboard_name: string;
  action: 'created' | 'updated' | 'deleted' | 'opened' | 'duplicated';
  timestamp: string;
}

export interface WidgetLibraryItem {
  kind: LocalDashboardWidgetKind;
  label: string;
  visual: LocalDashboardWidgetVisual;
  defaultTitle: string;
  defaultColor: string;
  defaultW: number;
  defaultH: number;
}

const DASHBOARD_STORAGE_KEY = 'frammer_local_dashboards_v2';
const DASHBOARD_ACTIVITY_KEY = 'frammer_local_dashboard_activity_v2';

const nowIso = () => new Date().toISOString();

export const EMPTY_FILTER_STATE: LocalDashboardFilterState = {
  client: 'all',
  channel: 'all',
  language: 'all',
  dateRange: 'last_30d',
  teamMember: 'all',
  inputType: 'all',
  outputType: 'all',
  publishedFlag: 'all',
  publishedPlatform: 'all',
  billableFlag: 'all',
};

export const WIDGET_LIBRARY: WidgetLibraryItem[] = [
  {
    kind: 'kpi_total_videos',
    label: 'Total Videos KPI',
    visual: 'kpi',
    defaultTitle: 'Total Videos',
    defaultColor: '#ef4444',
    defaultW: 2,
    defaultH: 2,
  },
  {
    kind: 'kpi_total_clips',
    label: 'Total Clips KPI',
    visual: 'kpi',
    defaultTitle: 'Total Clips',
    defaultColor: '#3b82f6',
    defaultW: 2,
    defaultH: 2,
  },
  {
    kind: 'kpi_publish_rate',
    label: 'Publish Rate KPI',
    visual: 'kpi',
    defaultTitle: 'Publish Rate',
    defaultColor: '#22c55e',
    defaultW: 2,
    defaultH: 2,
  },
  {
    kind: 'monthly_uploaded',
    label: 'Monthly Trend',
    visual: 'line',
    defaultTitle: 'Monthly Uploaded Trend',
    defaultColor: '#f59e0b',
    defaultW: 6,
    defaultH: 4,
  },
  {
    kind: 'top_channels',
    label: 'Top Channels',
    visual: 'bar',
    defaultTitle: 'Top Channels by Volume',
    defaultColor: '#8b5cf6',
    defaultW: 5,
    defaultH: 4,
  },
  {
    kind: 'language_share',
    label: 'Language Share',
    visual: 'pie',
    defaultTitle: 'Language Share',
    defaultColor: '#06b6d4',
    defaultW: 4,
    defaultH: 4,
  },
  {
    kind: 'output_type_table',
    label: 'Output Types Table',
    visual: 'table',
    defaultTitle: 'Output Types',
    defaultColor: '#f97316',
    defaultW: 6,
    defaultH: 4,
  },
];

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function widgetByKind(kind: LocalDashboardWidgetKind): WidgetLibraryItem {
  return WIDGET_LIBRARY.find((item) => item.kind === kind) ?? WIDGET_LIBRARY[0];
}

export function createWidget(kind: LocalDashboardWidgetKind): LocalDashboardWidget {
  const spec = widgetByKind(kind);
  return {
    id: makeId('widget'),
    kind,
    title: spec.defaultTitle,
    color: spec.defaultColor,
  };
}

export function buildLayouts(widgets: LocalDashboardWidget[]): ResponsiveLayouts {
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  const lg = widgets.map((widget) => {
    const spec = widgetByKind(widget.kind);
    if (cursorX + spec.defaultW > 12) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }
    const item = {
      i: widget.id,
      x: cursorX,
      y: cursorY,
      w: spec.defaultW,
      h: spec.defaultH,
    };
    cursorX += spec.defaultW;
    rowHeight = Math.max(rowHeight, spec.defaultH);
    return item;
  });
  return { lg };
}

function createTemplate(
  id: string,
  name: string,
  description: string,
  widgetKinds: LocalDashboardWidgetKind[],
): LocalDashboard {
  const widgets = widgetKinds.map(createWidget);
  const createdAt = nowIso();
  return {
    id,
    name,
    description,
    type: 'template',
    filter_state: cloneJson(EMPTY_FILTER_STATE),
    widgets,
    layouts: buildLayouts(widgets),
    created_at: createdAt,
    updated_at: createdAt,
    source_template_id: null,
  };
}

export const STARTER_DASHBOARDS: LocalDashboard[] = [
  createTemplate(
    'template_operations_snapshot',
    'Operations Snapshot',
    'A balanced starter dashboard for volume, publish rate, channels, and language mix.',
    ['kpi_total_videos', 'kpi_total_clips', 'kpi_publish_rate', 'monthly_uploaded', 'top_channels', 'language_share'],
  ),
  createTemplate(
    'template_content_mix',
    'Content Mix',
    'A starter dashboard focused on monthly trend, languages, and output type composition.',
    ['kpi_total_videos', 'monthly_uploaded', 'language_share', 'output_type_table'],
  ),
];

export function loadPersonalDashboards(): LocalDashboard[] {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalDashboard[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePersonalDashboards(dashboards: LocalDashboard[]): void {
  localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashboards));
}

export function loadDashboardActivity(): LocalDashboardActivity[] {
  try {
    const raw = localStorage.getItem(DASHBOARD_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalDashboardActivity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendDashboardActivity(
  action: LocalDashboardActivity['action'],
  dashboard: Pick<LocalDashboard, 'id' | 'name'>,
): LocalDashboardActivity[] {
  const nextEntry: LocalDashboardActivity = {
    id: makeId('activity'),
    dashboard_id: dashboard.id,
    dashboard_name: dashboard.name,
    action,
    timestamp: nowIso(),
  };
  const nextLog = [nextEntry, ...loadDashboardActivity()].slice(0, 100);
  localStorage.setItem(DASHBOARD_ACTIVITY_KEY, JSON.stringify(nextLog));
  return nextLog;
}

export function createPersonalDashboard(input: {
  name: string;
  description?: string;
  filterState?: Partial<LocalDashboardFilterState>;
  fromTemplate?: LocalDashboard | null;
}): LocalDashboard {
  const createdAt = nowIso();
  const template = input.fromTemplate ?? null;
  const widgets = template ? cloneJson(template.widgets) : [
    createWidget('kpi_total_videos'),
    createWidget('monthly_uploaded'),
    createWidget('top_channels'),
  ];
  const dashboard: LocalDashboard = {
    id: makeId('dashboard'),
    name: input.name.trim(),
    description: input.description?.trim() || '',
    type: 'personal',
    filter_state: { ...EMPTY_FILTER_STATE, ...(input.filterState ?? {}) },
    widgets,
    layouts: template ? cloneJson(template.layouts) : buildLayouts(widgets),
    created_at: createdAt,
    updated_at: createdAt,
    source_template_id: template?.id ?? null,
  };
  return dashboard;
}

export function updatePersonalDashboard(
  dashboards: LocalDashboard[],
  dashboardId: string,
  updater: (dashboard: LocalDashboard) => LocalDashboard,
): LocalDashboard[] {
  return dashboards.map((dashboard) => (
    dashboard.id === dashboardId
      ? { ...updater(dashboard), updated_at: nowIso() }
      : dashboard
  ));
}

export function duplicatePersonalDashboard(dashboard: LocalDashboard): LocalDashboard {
  return {
    ...cloneJson(dashboard),
    id: makeId('dashboard'),
    name: `${dashboard.name} (copy)`,
    type: 'personal',
    created_at: nowIso(),
    updated_at: nowIso(),
  };
}
