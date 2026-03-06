import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ForecastChart } from '@/components/ForecastChart';
import { TrendingUp, AlertCircle, Info } from 'lucide-react';
import { monthlyMetrics } from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import type { ForecastDataPoint } from '@/components/ForecastChart';

type Horizon = '3' | '6' | '12';
type MetricKey = 'videosProcessed' | 'clipsGenerated' | 'avgDurationMin';

const METRIC_OPTIONS: { value: MetricKey; label: string; color: string; lowerIsBetter?: boolean }[] = [
  { value: 'videosProcessed', label: 'Videos Processed', color: CHART_COLORS.red },
  { value: 'clipsGenerated', label: 'Clips Generated', color: CHART_COLORS.blue },
  { value: 'avgDurationMin', label: 'Avg Duration (min)', color: CHART_COLORS.amber, lowerIsBetter: true },
];

// Growth rates derived from mock data
const GROWTH_RATES: Record<MetricKey, number> = {
  videosProcessed: 0.04,
  clipsGenerated: 0.055,
  avgDurationMin: -0.015,
};

function buildForecastData(metric: MetricKey, horizonMonths: number): ForecastDataPoint[] {
  const actual: ForecastDataPoint[] = monthlyMetrics.map((m) => ({
    label: m.month,
    actual: m[metric] as number,
    forecast: undefined,
    upperBound: undefined,
    lowerBound: undefined,
  }));

  const lastActual = actual[actual.length - 1].actual ?? 0;
  const growth = GROWTH_RATES[metric];
  const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const lastLabel = actual[actual.length - 1].label;
  const lastIdx = MONTHS.indexOf(lastLabel.slice(0, 3));

  const future: ForecastDataPoint[] = [];
  for (let i = 1; i <= horizonMonths; i++) {
    const forecastVal = Math.round(lastActual * Math.pow(1 + growth, i));
    const uncertainty = 0.05 + (i / horizonMonths) * 0.1;
    future.push({
      label: MONTHS[(lastIdx + i) % 12],
      actual: undefined,
      forecast: forecastVal,
      upperBound: Math.round(forecastVal * (1 + uncertainty)),
      lowerBound: Math.round(forecastVal * (1 - uncertainty)),
      isForecast: true,
    });
  }

  return [...actual, ...future];
}

export default function ForecastingPage() {
  const [horizon, setHorizon] = useState<Horizon>('6');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('videosProcessed');

  const metricInfo = METRIC_OPTIONS.find((m) => m.value === selectedMetric)!;
  const data = buildForecastData(selectedMetric, parseInt(horizon));

  const lastActual = monthlyMetrics[monthlyMetrics.length - 1][selectedMetric] as number;
  const forecastEnd = data[data.length - 1].forecast ?? lastActual;
  const growthRate = GROWTH_RATES[selectedMetric];
  const isPositive = metricInfo.lowerIsBetter ? growthRate < 0 : growthRate > 0;

  return (
    <DashboardLayout title="Forecasting" subtitle="AI-powered metric forecasts with confidence intervals">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PageHeader
            title="Forecasting"
            subtitle="Projected trends based on historical processing data"
          />
          <div className="flex items-center gap-2">
            <Select value={horizon} onValueChange={(v) => setHorizon(v as Horizon)}>
              <SelectTrigger className="h-8 w-36 bg-[#111111] border-[#27272A] text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#161616] border-[#27272A]">
                <SelectItem value="3" className="text-xs text-[#A1A1AA]">3-month horizon</SelectItem>
                <SelectItem value="6" className="text-xs text-[#A1A1AA]">6-month horizon</SelectItem>
                <SelectItem value="12" className="text-xs text-[#A1A1AA]">12-month horizon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metric selector pills */}
        <div className="flex gap-2 flex-wrap">
          {METRIC_OPTIONS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMetric(m.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs transition-all border',
                selectedMetric === m.value
                  ? 'text-white border-[#3F3F46] bg-[#1C1C1C]'
                  : 'text-[#52525B] border-transparent hover:text-white'
              )}
              style={selectedMetric === m.value ? { borderColor: m.color + '40', backgroundColor: m.color + '15' } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Main chart */}
        <div className="frammer-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp size={16} className="text-frammer-red" />
              <p className="text-sm font-semibold text-white">{metricInfo.label}</p>
              <Badge variant="outline" className={cn('text-[10px] border px-2', isPositive ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30')}>
                {isPositive ? '▲' : '▼'} {Math.abs(growthRate * 100).toFixed(1)}%/mo
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#52525B]">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-frammer-red inline-block rounded" /> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-400 inline-block rounded border-t border-dashed border-blue-400" /> Forecast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded bg-blue-400/10 border border-blue-400/20 inline-block" /> Confidence
              </span>
            </div>
          </div>
          <ForecastChart
            data={data}
            metricLabel={metricInfo.label}
            actualColor={metricInfo.color}
            forecastColor={CHART_COLORS.blue}
            height={260}
          />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Last Actual', value: lastActual.toLocaleString(), badge: null },
            { label: `Forecast (${horizon}mo)`, value: forecastEnd.toLocaleString(), badge: isPositive ? '+ve trend' : '-ve trend', positive: isPositive },
            { label: 'Monthly Growth Rate', value: `${(growthRate * 100).toFixed(1)}%/mo`, badge: null },
            { label: 'Model Confidence', value: horizon === '3' ? '92%' : horizon === '6' ? '84%' : '71%', badge: null },
          ].map((card) => (
            <div key={card.label} className="frammer-card p-4">
              <p className="text-xs text-[#52525B] mb-2">{card.label}</p>
              <p className="text-2xl font-metric text-white">{card.value}</p>
              {card.badge && (
                <Badge variant="outline" className={cn('mt-1 text-[10px] border px-1.5', card.positive ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30')}>
                  {card.badge}
                </Badge>
              )}
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 bg-[#1C1C1C] border border-[#27272A] rounded-xl px-4 py-3">
          <Info size={13} className="text-[#52525B] mt-0.5 shrink-0" />
          <p className="text-xs text-[#52525B]">
            Forecasts are generated using linear trend extrapolation on historical data. Confidence bands widen at longer horizons reflecting model uncertainty. These projections are for planning purposes only and assume no significant operational changes.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
