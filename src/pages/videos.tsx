import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { videoExplorerData, type VideoRecord } from '@/data/videoExplorerData';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  Download,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const columnHelper = createColumnHelper<VideoRecord>();

function PublishedBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="inline-flex items-center gap-1 text-[11px] text-green-400 font-medium">
      <CheckCircle2 size={11} /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#52525B] font-medium">
      <XCircle size={11} /> Unpublished
    </span>
  );
}

const COLUMNS = [
  columnHelper.accessor('video_id', {
    header: 'ID',
    cell: (info) => <span className="font-metric text-[11px] text-[#71717A]">{info.getValue()}</span>,
    size: 90,
  }),
  columnHelper.accessor('headline', {
    header: 'Headline',
    cell: (info) => (
      <span className="text-xs text-white font-medium line-clamp-2 max-w-64">{info.getValue()}</span>
    ),
    size: 280,
  }),
  columnHelper.accessor('client', {
    header: 'Client',
    cell: (info) => <span className="text-xs text-[#A1A1AA]">{info.getValue()}</span>,
    size: 100,
  }),
  columnHelper.accessor('channel', {
    header: 'Channel',
    cell: (info) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/5 text-[#A1A1AA] border border-[#27272A]">
        {info.getValue()}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor('user', {
    header: 'Team Member',
    cell: (info) => <span className="text-xs text-[#A1A1AA]">{info.getValue()}</span>,
    size: 110,
  }),
  columnHelper.accessor('language', {
    header: 'Language',
    cell: (info) => <span className="text-xs text-[#A1A1AA]">{info.getValue()}</span>,
    size: 90,
  }),
  columnHelper.accessor('input_type', {
    header: 'Input Type',
    cell: (info) => (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-frammer-red/10 text-frammer-red border border-frammer-red/20">
        {info.getValue()}
      </span>
    ),
    size: 110,
  }),
  columnHelper.accessor('output_types', {
    header: 'Output Types',
    cell: (info) => (
      <div className="flex flex-wrap gap-1 max-w-48">
        {info.getValue().map((t) => (
          <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1C1C1C] border border-[#27272A] text-[#71717A]">
            {t}
          </span>
        ))}
      </div>
    ),
    size: 200,
    enableSorting: false,
  }),
  columnHelper.accessor('duration_min', {
    header: 'Duration (min)',
    cell: (info) => <span className="font-metric text-xs text-white">{info.getValue()}</span>,
    size: 110,
  }),
  columnHelper.accessor('clips_generated', {
    header: 'Clips',
    cell: (info) => (
      <span className="font-metric text-sm font-semibold text-frammer-red">{info.getValue()}</span>
    ),
    size: 60,
  }),
  columnHelper.accessor('processing_time_min', {
    header: 'Proc. Time',
    cell: (info) => <span className="font-metric text-xs text-[#A1A1AA]">{info.getValue()} min</span>,
    size: 90,
  }),
  columnHelper.accessor('published_flag', {
    header: 'Status',
    cell: (info) => <PublishedBadge published={info.getValue()} />,
    size: 110,
  }),
  columnHelper.accessor('uploaded_at', {
    header: 'Uploaded',
    cell: (info) => <span className="text-[11px] text-[#52525B] font-metric">{info.getValue().slice(0, 10)}</span>,
    size: 100,
  }),
];

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (!sorted) return <ArrowUpDown size={12} className="text-[#3F3F46]" />;
  if (sorted === 'asc') return <ArrowUp size={12} className="text-frammer-red" />;
  return <ArrowDown size={12} className="text-frammer-red" />;
}

export default function VideosPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: videoExplorerData,
    columns: COLUMNS,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalRows = table.getPrePaginationRowModel().rows.length;

  function exportCSV() {
    const rows = table.getPrePaginationRowModel().rows;
    const keys = Object.keys(rows[0]?.original ?? {}) as (keyof VideoRecord)[];
    const header = keys.join(',');
    const body = rows
      .map((r) =>
        keys
          .map((k) => {
            const v = r.original[k];
            const str = Array.isArray(v) ? v.join(';') : String(v ?? '');
            return `"${str.replace(/"/g, '""')}"`;
          })
          .join(',')
      )
      .join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'video_explorer.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout title="Video Explorer" subtitle="Row-level view of all processed videos">
      <div className="space-y-4">
        <PageHeader
          title="Video Explorer"
          subtitle="Search, filter, and export individual video records"
          badge={{ label: `${totalRows} records`, variant: 'default' }}
          onDownload={exportCSV}
        />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-52 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B]" />
            <Input
              placeholder="Search videos, clients, users..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9 h-9 bg-[#111111] border-[#27272A] text-sm text-white placeholder:text-[#52525B] focus:border-frammer-red/50 focus:ring-frammer-red/20"
            />
          </div>

          {/* Quick filters */}
          <Select
            value={(table.getColumn('channel')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(v) =>
              table.getColumn('channel')?.setFilterValue(v === 'all' ? undefined : v)
            }
          >
            <SelectTrigger className="h-9 w-36 bg-[#111111] border-[#27272A] text-xs text-[#A1A1AA]">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent className="bg-[#161616] border-[#27272A]">
              <SelectItem value="all" className="text-xs text-[#A1A1AA]">All Channels</SelectItem>
              {['YouTube', 'Instagram', 'LinkedIn', 'Twitter/X', 'Podcast', 'Webinar'].map((c) => (
                <SelectItem key={c} value={c} className="text-xs text-[#A1A1AA]">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={(table.getColumn('published_flag')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(v) =>
              table.getColumn('published_flag')?.setFilterValue(
                v === 'all' ? undefined : v === 'true'
              )
            }
          >
            <SelectTrigger className="h-9 w-36 bg-[#111111] border-[#27272A] text-xs text-[#A1A1AA]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#161616] border-[#27272A]">
              <SelectItem value="all" className="text-xs text-[#A1A1AA]">All Status</SelectItem>
              <SelectItem value="true" className="text-xs text-[#A1A1AA]">Published</SelectItem>
              <SelectItem value="false" className="text-xs text-[#A1A1AA]">Unpublished</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:text-white text-xs">
                <Columns3 size={13} className="mr-1.5" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#161616] border-[#27272A] w-44">
              {table.getAllLeafColumns().map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(v)}
                  className="text-xs text-[#A1A1AA] capitalize"
                >
                  {col.id.replace(/_/g, ' ')}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={exportCSV} variant="outline" size="sm" className="h-9 bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:text-white text-xs">
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-[#1C1C1C] overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-320px)] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-[#111111]">
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-[#1C1C1C] hover:bg-transparent">
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-[11px] font-semibold uppercase tracking-wider text-[#52525B] py-3 px-3 whitespace-nowrap"
                        style={{ width: header.getSize() }}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            disabled={!header.column.getCanSort()}
                            className="flex items-center gap-1.5 hover:text-white transition-colors"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <SortIcon sorted={header.column.getIsSorted()} />
                            )}
                          </button>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length} className="text-center py-16 text-sm text-[#52525B]">
                      No videos match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="border-[#1C1C1C] hover:bg-white/2 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-2.5 px-3 align-top">
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

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-[#71717A]">
          <span>
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              totalRows
            )}{' '}
            of {totalRows} videos
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger className="h-7 w-20 bg-[#111111] border-[#27272A] text-xs text-[#A1A1AA]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#27272A]">
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs text-[#A1A1AA]">
                    {n} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:text-white"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={13} />
            </Button>
            <span className="font-metric">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 bg-[#111111] border-[#27272A] text-[#A1A1AA] hover:text-white"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
