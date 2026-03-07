/**
 * ExportButton — exports the current page's data as CSV.
 * Prepends metadata rows (filter context, generated_at, source_grain) before data rows.
 */
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ResponseMetadata } from '@/api/types';

interface ExportButtonProps {
  /** Data rows to export */
  data: Record<string, unknown>[];
  /** Filename without extension */
  filename?: string;
  /** Optional metadata to prepend as comment rows */
  meta?: ResponseMetadata | null;
  /** Whether export is disabled (e.g. while loading) */
  disabled?: boolean;
  className?: string;
}

function escapeCSV(value: unknown): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(data: Record<string, unknown>[], meta?: ResponseMetadata | null): string {
  if (data.length === 0) return '';

  const lines: string[] = [];

  // Metadata header rows
  if (meta) {
    lines.push(`# Generated at: ${meta.generated_at}`);
    lines.push(`# Source grain: ${meta.source_grain}`);
    if (meta.unit) lines.push(`# Unit: ${meta.unit}`);
    const filterStr = Object.entries(meta.filters_applied)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (filterStr) lines.push(`# Filters: ${filterStr}`);
    if (meta.caveats.length > 0) {
      lines.push(`# Caveats: ${meta.caveats.join(' | ')}`);
    }
    lines.push('');
  }

  // Column headers
  const headers = Object.keys(data[0]);
  lines.push(headers.map(escapeCSV).join(','));

  // Data rows
  for (const row of data) {
    lines.push(headers.map((h) => escapeCSV(row[h])).join(','));
  }

  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ExportButton({
  data,
  filename = 'export',
  meta,
  disabled = false,
  className = '',
}: ExportButtonProps) {
  const handleCSV = () => {
    const csv = toCSV(data, meta);
    downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
  };

  const handleJSON = () => {
    const payload = meta ? { meta, data } : data;
    downloadFile(JSON.stringify(payload, null, 2), `${filename}.json`, 'application/json');
  };

  if (data.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className={`gap-1.5 ${className}`}
        >
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCSV}>Download CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleJSON}>Download JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
