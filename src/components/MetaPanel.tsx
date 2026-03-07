/**
 * MetaPanel — slide-in Sheet showing response metadata.
 * Triggered by an "ⓘ" icon button. Shows filters_applied, generated_at,
 * metric_definitions_used, source_grain, and caveats.
 */
import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { ResponseMetadata } from '@/api/types';

interface MetaPanelProps {
  meta?: ResponseMetadata | null;
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2 border-b last:border-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function MetaPanel({ meta }: MetaPanelProps) {
  if (!meta) return null;

  const filtersEntries = Object.entries(meta.filters_applied).filter(([, v]) => v != null && v !== '');

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="View metadata">
          <Info className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80 overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Response Metadata</SheetTitle>
        </SheetHeader>

        <div className="space-y-0">
          <MetaRow label="Generated at">
            <span className="font-mono text-xs">{new Date(meta.generated_at).toLocaleString()}</span>
          </MetaRow>

          <MetaRow label="Source grain">
            <Badge variant="secondary">{meta.source_grain}</Badge>
          </MetaRow>

          {meta.unit && (
            <MetaRow label="Unit">
              <Badge variant="outline">{meta.unit}</Badge>
            </MetaRow>
          )}

          {filtersEntries.length > 0 && (
            <MetaRow label="Filters applied">
              <div className="flex flex-wrap gap-1 mt-1">
                {filtersEntries.map(([k, v]) => (
                  <Badge key={k} variant="secondary" className="text-xs">
                    {k}: {String(v)}
                  </Badge>
                ))}
              </div>
            </MetaRow>
          )}

          {meta.metric_definitions_used.length > 0 && (
            <MetaRow label="Metrics used">
              <div className="flex flex-wrap gap-1 mt-1">
                {meta.metric_definitions_used.map((m) => (
                  <Badge key={m} variant="outline" className="text-xs font-mono">
                    {m}
                  </Badge>
                ))}
              </div>
            </MetaRow>
          )}

          {meta.caveats.length > 0 && (
            <MetaRow label="Caveats">
              <ul className="mt-1 space-y-1">
                {meta.caveats.map((c, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    • {c}
                  </li>
                ))}
              </ul>
            </MetaRow>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
