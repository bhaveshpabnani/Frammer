/**
 * InsightStrip — renders 1–3 auto-generated insight/alert pills.
 * Accepts a list of insight items; renders each as a colored chip.
 */
import React from 'react';
import { AlertTriangle, Info, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'positive';

export interface InsightItem {
  id: string;
  message: string;
  severity: InsightSeverity;
}

interface InsightStripProps {
  insights: InsightItem[];
  className?: string;
}

const severityConfig: Record<InsightSeverity, {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  critical: { icon: AlertCircle,    className: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300' },
  warning:  { icon: AlertTriangle,  className: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300' },
  info:     { icon: Info,           className: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300' },
  positive: { icon: TrendingUp,     className: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300' },
};

export function InsightStrip({ insights, className = '' }: InsightStripProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {insights.map((insight) => {
        const { icon: Icon, className: chipClass } = severityConfig[insight.severity];
        return (
          <div
            key={insight.id}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${chipClass}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{insight.message}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Helper: build insight items from common conditions */
export function buildInsights(conditions: {
  dqScore?: number | null;
  backlogCount?: number | null;
  momDrop?: number | null;
  caveats?: string[];
}): InsightItem[] {
  const items: InsightItem[] = [];

  if (conditions.dqScore != null && conditions.dqScore < 70) {
    items.push({
      id: 'dq-score',
      message: `DQ score ${conditions.dqScore.toFixed(0)}% — below 70% threshold`,
      severity: conditions.dqScore < 50 ? 'critical' : 'warning',
    });
  }
  if (conditions.backlogCount != null && conditions.backlogCount > 100) {
    items.push({
      id: 'backlog',
      message: `${conditions.backlogCount.toLocaleString()} items in backlog`,
      severity: conditions.backlogCount > 500 ? 'critical' : 'warning',
    });
  }
  if (conditions.momDrop != null && conditions.momDrop < -20) {
    items.push({
      id: 'mom-drop',
      message: `MoM volume dropped ${Math.abs(conditions.momDrop).toFixed(1)}%`,
      severity: 'warning',
    });
  }
  if (conditions.caveats) {
    conditions.caveats.slice(0, 2).forEach((c, i) => {
      items.push({ id: `caveat-${i}`, message: c, severity: 'info' });
    });
  }

  return items;
}
