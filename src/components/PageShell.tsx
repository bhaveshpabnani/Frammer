/**
 * PageShell — enforces the standard 7-section page layout:
 * GlobalFilterRibbon → KPIStrip → InsightStrip → MainVisuals → Breakdown → DrillTable → ExportBar
 */
import React from 'react';

interface PageShellProps {
  /** Page title shown in the header area */
  title: string;
  /** Optional subtitle / description */
  subtitle?: string;
  /** KPI stat cards row */
  kpis?: React.ReactNode;
  /** Insight / alert pills strip */
  insights?: React.ReactNode;
  /** Primary chart visuals area */
  visuals?: React.ReactNode;
  /** Ranking, matrix, or secondary breakdown */
  breakdown?: React.ReactNode;
  /** Drill-through data table */
  table?: React.ReactNode;
  /** Export / share action bar */
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageShell({
  title,
  subtitle,
  kpis,
  insights,
  visuals,
  breakdown,
  table,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>

      {/* KPI strip */}
      {kpis && <section aria-label="Key metrics">{kpis}</section>}

      {/* Insight / alert strip */}
      {insights && <section aria-label="Insights and alerts">{insights}</section>}

      {/* Main visuals */}
      {visuals && <section aria-label="Charts">{visuals}</section>}

      {/* Ranking / matrix / breakdown */}
      {breakdown && <section aria-label="Breakdown">{breakdown}</section>}

      {/* Drill-through table */}
      {table && <section aria-label="Detail table">{table}</section>}

      {/* Extra children (e.g. tab panels) */}
      {children}
    </div>
  );
}
