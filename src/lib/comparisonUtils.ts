// Comparison utilities — delta calculations, baseline simulation, colour helpers

export interface MetricComparison {
  current: number;
  baseline: number;
  delta: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  isPositive: boolean;
}

export function compareMetrics(
  current: number,
  baseline: number,
  lowerIsBetter = false
): MetricComparison {
  const delta = current - baseline;
  const percentageChange = baseline !== 0 ? (delta / baseline) * 100 : 0;
  const trend = delta > 0.5 ? 'up' : delta < -0.5 ? 'down' : 'stable';
  const isPositive = lowerIsBetter ? delta < 0 : delta > 0;

  return { current, baseline, delta, percentageChange, trend, isPositive };
}

export function compareTimeSeries<T extends { [key: string]: number | string }>(
  current: T[],
  baseline: T[],
  keyField: keyof T
): Array<T & { _baseline?: number; _current?: number }> {
  return current.map((item, i) => ({
    ...item,
    _current: typeof item[keyField] === 'number' ? (item[keyField] as number) : 0,
    _baseline: baseline[i] ? (baseline[i][keyField] as number) : 0,
  }));
}

/**
 * Simulate a baseline dataset by applying a random variation (±5–15%)
 * to each numeric value in an array. Used for demo/mock comparison mode.
 */
export function simulateBaseline<T extends Record<string, unknown>>(
  data: T[],
  fields: (keyof T)[],
  variationFactor = 0.12
): T[] {
  return data.map((row) => {
    const copy = { ...row };
    for (const field of fields) {
      const val = row[field];
      if (typeof val === 'number') {
        const variation = 1 - variationFactor + Math.random() * variationFactor * 2;
        (copy as Record<string, unknown>)[field as string] = Math.round(val * variation);
      }
    }
    return copy;
  });
}

export function getComparisonColorClass(comparison: MetricComparison): string {
  if (comparison.trend === 'stable') return 'text-[#71717A]';
  return comparison.isPositive ? 'text-green-400' : 'text-red-400';
}

export function getComparisonIcon(comparison: MetricComparison): string {
  if (comparison.trend === 'up') return '↑';
  if (comparison.trend === 'down') return '↓';
  return '→';
}

export const COMPARISON_COLORS = {
  current: '#E8212B',
  baseline: '#3B82F6',
  currentFill: 'rgba(232,33,43,0.15)',
  baselineFill: 'rgba(59,130,246,0.15)',
} as const;
