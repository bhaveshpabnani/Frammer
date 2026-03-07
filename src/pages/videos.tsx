import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { motion } from 'framer-motion';
import {
  Search, ChevronDown, AlertCircle, CheckCircle2, Clock, Flag, ExternalLink,
  ArrowLeft, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVideoExplorer } from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import { toApiParams } from '@/api/client';
import type { VideoRowExtended } from '@/api/types';
import { ExportButton } from '@/components/ExportButton';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonPage } from '@/components/SkeletonPage';
import { CrossFilterBar } from '@/components/CrossFilterChip';

// ── Preset filter definitions ─────────────────────────────────────────────────
const PRESETS = [
  { id: 'all',                   label: 'All'                 },
  { id: 'processed_not_published', label: 'Not Published'     },
  { id: 'high_lag',              label: 'High Lag'            },
  { id: 'missing_metadata',      label: 'Missing Metadata'    },
  { id: 'invalid_url',           label: 'Invalid URL'         },
  { id: 'duplicates',            label: 'Duplicates'          },
  { id: 'billable_only',         label: 'Billable Only'       },
] as const;

type PresetId = typeof PRESETS[number]['id'];

// ── Issue badge ────────────────────────────────────────────────────────────────
const IssueBadge = ({ row }: { row: VideoRowExtended }) => {
  const flags = [
    row.missing_team_flag      && { label: 'No team',   color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    row.invalid_url_flag       && { label: 'Bad URL',   color: 'bg-red-500/15 text-red-400 border-red-500/30' },
    row.duplicate_video_id_flag && { label: 'Dup ID',  color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    row.missing_platform_flag  && { label: 'No platform', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  ].filter(Boolean) as { label: string; color: string }[];

  if (flags.length === 0) return <CheckCircle2 size={12} className="text-green-500/60" />;

  return (
    <div className="flex flex-wrap gap-0.5">
      {flags.slice(0, 2).map((f, i) => (
        <span key={i} className={cn('text-[9px] font-bold px-1 py-0.5 rounded border uppercase tracking-wide', f.color)}>
          {f.label}
        </span>
      ))}
    </div>
  );
};

const colHelper = createColumnHelper<VideoRowExtended>();

const VideoExplorer: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { filters, updateFilters } = useFilters();

  const [search, setSearch]           = useState(searchParams.get('search') ?? '');
  const [preset, setPreset]           = useState<string>(searchParams.get('preset') ?? 'all');
  const [page, setPage]               = useState(1);
  const [pageSize]                    = useState(50);
  const [sorting, setSorting]         = useState<SortingState>([]);
  const [colVisibility, setColVisibility] = useState<VisibilityState>({
    processing_lag_min: false,
    publishing_lag_min: false,
    total_cycle_lag_min: false,
  });

  // Apply URL params → filters on mount
  useEffect(() => {
    const channel    = searchParams.get('channel');
    const teamMember = searchParams.get('teamMember');
    const inputType  = searchParams.get('inputType');
    const partial: Record<string, string> = {};
    if (channel)    partial.channel    = channel;
    if (teamMember) partial.teamMember = teamMember;
    if (inputType)  partial.inputType  = inputType;
    if (Object.keys(partial).length > 0) {
      updateFilters(partial as Parameters<typeof updateFilters>[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, isLoading, isFetching } = useVideoExplorer(page, pageSize, search || undefined, preset === 'all' ? undefined : preset);
  const { activeFilterCount } = useFilters();

  const rows    = data?.items ?? [];
  const total   = data?.total ?? 0;
  const totalPg = data?.totalPages ?? 1;

  // ── Table columns ────────────────────────────────────────────────────────────
  const columns = useMemo(() => [
    colHelper.accessor('headline', {
      header: 'Headline',
      cell: info => (
        <div className="max-w-[200px]">
          <p className="truncate text-[#E4E4E7] text-xs" title={info.getValue() ?? ''}>
            {info.getValue() ?? '—'}
          </p>
          {info.row.original.video_id && (
            <p className="text-[#52525B] font-mono text-[10px] truncate">{info.row.original.video_id}</p>
          )}
        </div>
      ),
    }),
    colHelper.accessor('channel', {
      header: 'Channel',
      cell: info => (
        <button
          className="text-xs text-[#A1A1AA] hover:text-[#E4E4E7] transition-colors truncate max-w-[100px] block"
          onClick={() => updateFilters({ channel: info.getValue() ?? 'all' })}
        >
          {info.getValue() ?? '—'}
        </button>
      ),
    }),
    colHelper.accessor('user', {
      header: 'User',
      cell: info => <span className="text-xs text-[#71717A]">{info.getValue() ?? '—'}</span>,
    }),
    colHelper.accessor('language', {
      header: 'Language',
      cell: info => <Badge variant="outline" className="text-[10px]">{info.getValue() ?? '—'}</Badge>,
    }),
    colHelper.accessor('input_type', {
      header: 'Input Type',
      cell: info => <span className="text-xs text-[#71717A]">{info.getValue() ?? '—'}</span>,
    }),
    colHelper.accessor('published', {
      header: 'Published',
      cell: info => info.getValue()
        ? <CheckCircle2 size={14} className="text-green-400 mx-auto" />
        : <AlertCircle size={14} className="text-[#3a3a3a] mx-auto" />,
    }),
    colHelper.accessor('processing_lag_min', {
      header: 'Process Lag',
      cell: info => {
        const v = info.getValue();
        if (v == null) return <span className="text-[#3a3a3a] text-xs">—</span>;
        const hrs = (v / 60).toFixed(1);
        return (
          <span className={cn('text-xs font-mono', v > 1440 ? 'text-red-400' : v > 480 ? 'text-amber-400' : 'text-[#71717A]')}>
            {hrs}h
          </span>
        );
      },
    }),
    colHelper.accessor('total_cycle_lag_min', {
      header: 'Total Lag',
      cell: info => {
        const v = info.getValue();
        if (v == null) return <span className="text-[#3a3a3a] text-xs">—</span>;
        const hrs = (v / 60).toFixed(1);
        return <span className="text-xs font-mono text-[#71717A]">{hrs}h</span>;
      },
    }),
    colHelper.display({
      id: 'issues',
      header: 'Issues',
      cell: info => <IssueBadge row={info.row.original} />,
    }),
    colHelper.display({
      id: 'actions',
      header: '',
      cell: info => (
        <button
          className="text-[#52525B] hover:text-[#A1A1AA] transition-colors"
          title="View details"
          onClick={() => {/* future: open detail panel */}}
        >
          <ExternalLink size={12} />
        </button>
      ),
    }),
  ], [updateFilters]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, columnVisibility: colVisibility },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: totalPg,
  });

  if (isLoading && !data) return (
    <DashboardLayout title="Video Explorer" subtitle="Loading…">
      <SkeletonPage statsCount={0} chartsCount={0} showTable />
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Video Explorer" subtitle="Terminal investigation node — search, filter, and drill">
      <div className="space-y-4 animate-fade-in">

        <PageHeader
          title="Video Explorer"
          subtitle={`${total.toLocaleString()} records · terminal node for all drillthrough workflows`}
          badge={{ label: 'EXPLORER', variant: 'blue' as any }}
          onDownload={() => {}}
        />

        <CrossFilterBar />

        {/* ── Preset filter bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.id}
              onClick={() => { setPreset(p.id); setPage(1); }}
              className={cn(
                'text-[11px] px-2.5 py-1 rounded border transition-colors',
                preset === p.id
                  ? 'border-white/40 text-white bg-white/10'
                  : 'border-[#2a2a2a] text-[#71717A] hover:border-[#3a3a3a]',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* ── Search + Column visibility ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs bg-[#111] border-[#1C1C1C]"
              placeholder="Search headline, video ID, channel…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1 bg-[#111] border-[#1C1C1C]">
                Columns <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter(c => c.getCanHide()).map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize text-xs"
                  checked={col.getIsVisible()}
                  onCheckedChange={v => col.toggleVisibility(!!v)}
                >
                  {col.id.replace(/_/g, ' ')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {rows.length > 0 && (
            <ExportButton
              data={rows as unknown as Record<string, unknown>[]}
              filename={`video-explorer-p${page}`}
            />
          )}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────────────── */}
        <div className="frammer-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map(hg => (
                  <TableRow key={hg.id} className="border-[#1C1C1C] hover:bg-transparent">
                    {hg.headers.map(header => (
                      <TableHead
                        key={header.id}
                        className="text-[11px] text-[#71717A] uppercase tracking-wide font-medium whitespace-nowrap cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: ' ↑', desc: ' ↓' }[header.column.getIsSorted() as string] ?? ''}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isFetching ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-[#111]">
                      {columns.map((_, j) => (
                        <TableCell key={j}><div className="h-3 bg-[#1C1C1C] rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <EmptyState hasFilters={activeFilterCount > 0 || !!search} />
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <TableRow key={row.id} className="border-[#111] hover:bg-[#0d0d0d] transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id} className="py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between text-xs text-[#71717A]">
          <span>{total.toLocaleString()} total records</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 bg-[#111] border-[#1C1C1C]"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ArrowLeft size={12} /> Prev
            </Button>
            <span>Page {page} / {totalPg}</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1 bg-[#111] border-[#1C1C1C]"
              disabled={page >= totalPg}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ArrowRight size={12} />
            </Button>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default VideoExplorer;
