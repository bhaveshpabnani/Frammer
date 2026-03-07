import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ForecastChart } from '@/components/ForecastChart';
import type { ForecastDataPoint } from '@/components/ForecastChart';
import { TrendingUp, Info, Loader2, AlertCircle } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { cn } from '@/lib/utils';
import { useForecast, type ForecastMetric } from '@/hooks/useApi';

type Horizon = '3' | '6' | '12';

const METRIC_OPTIONS: {
  value: ForecastMetric;
  label: string;
  color: string;
  lowerIsBetter?: boolean;
}[] = [
  { value: 'total_uploaded',        label: 'Videos Uploaded',         color: CHART_COLORS.red },
  { value: 'total_published',       label: 'Videos Published',        color: CHART_COLORS.blue },
  { value: 'uploaded_duration_hrs', label: 'Upload Duration (hrs)',   color: CHART_COLORS.amber },
  { value: 'created_duration_hrs',  label: 'Created Duration (hrs)',  color: CHART_COLORS.purple },
];

export default function ForecastingPage() {
  const [horizon, setHorizon]               = useState<Horizon>('6');
  const [selectedMetric, setSelectedMetric] = useState<ForecastMetric>('total_uploaded');

  const { data: forecastData, isLoading, isError } = useForecast(selectedMetric, parseInt(horizon));

  const metricInfo = METRIC_OPTIONS.find((m) => m.value === selectedMetric)!;

  // Map backend ForecastPoint → ForecastChart ForecastDataPoint
  const chartData: ForecastDataPoint[] = (forecastData?.data ?? []).map((p) => ({
    label:      p.month_label,
    actual:     p.actual     ?? undefined,
    forecast:   p.forecast   ?? undefined,
    upperBound: p.upper      ?? undefined,
    lowerBound: p.lower      ?? undefined,
    isForecast: p.is_forecast,
  }));

  const growthRate  = forecastData?.monthly_growth_rate ?? 0;
  const confidence  = forecastData?.model_confidence    ?? 0;
  const isPositive  = !metricInfo.lowerIsBetter ? growthRate > 0 : growthRate < 0;

  const actuals     = chartData.filter((p) => !p.isForecast && p.actual !== undefined);
  const forecasts   = chartData.filter((p) => p.isForecast  && p.forecast !== undefined);
  const lastActual  = actuals.at(-1)?.actual   ?? 0;
  const forecastEnd = forecasts.at(-1)?.forecast ?? lastActual;

  return (
    <DashboardLayout title="Forecasting" subtitle="AI-powered metric forecasts with confidence intervals">
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PageHeader
            title="Forecasting"
            subtitle="Projected trends based on historical processing data — linear regression with 95% confidence bands"
          />
          <Select value={horizon} onValueChange={(v) => setHorizon(v as Horizon)}>
            <SelectTrigger className="h-8 w-36 bg-[#111111] border-[#27272A] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#161616] border-[#27272A]">
              <SelectItem value="3"  className="text-xs text-[#A1A1AA]">3-month horizon</SelectItem>
              <SelectItem value="6"  className="text-xs text-[#A1A1AA]">6-month horizon</SelectItem>
              <SelectItem value="12" className="text-xs text-[#A1A1AA]">12-month horizon</SelectItem>
            </SelectContent>
          </Select>
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
                  : 'text-[#52525B] border-transparent hover:text-white',
              )}
              style={
                selectedMetric === m.value
                  ? { borderColor: m.color + '40', backgroundColor: m.color + '15' }
                  : {}
              }
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
              {forecastData && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] border px-2',
                    isPositive ? 'text-green-400 border-green-500/30' : 'text-red-400 border-red-500/30',
                  )}
                >
                  {isPositive ? '▲' : '▼'} {Math.abs(growthRate).toFixed(2)}%/mo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#52525B]">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-frammer-red inline-block rounded" /> Actual
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-blue-400 inline-block rounded border-t border-dashed border-blue-400" /> Forecast
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded bg-blue-400/10 border border-blue-400/20 inline-block" /> 95% CI
              </span>
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center h-64 text-[#52525B] gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Loading forecast…</span>
            </div>
          )}
          {isError && (
            <div className="flex items-center justify-center h-64 gap-2">
              <AlertCircle size={16} className="text-amber-400" />
              <span className="text-sm text-amber-400">Could not load forecast data</span>
            </div>
          )}
          {!isLoading && !isError && (
            <ForecastChart
              data={chartData}
              metricLabel={metricInfo.label}
              actualColor={metricInfo.color}
              forecastColor={CHART_COLORS.blue}
              height={260}
            />
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Last Actual',
              value: isLoading ? '—' : lastActual.toLocaleString(undefined, { maximumFractionDigits: 1 }),
              badge: null,
            },
            {
              label: `Forecast (${horizon}mo end)`,
              value: isLoading ? '—' : forecastEnd.toLocaleString(undefined, { maximumFractionDigits: 1 }),
              badge: isLoading ? null : isPositive ? '+ve trend' : '-ve trend',
              positive: isPositive,
            },
            {
              label: 'Monthly Growth Rate',
              value: isLoading ? '—' : `${growthRate.toFixed(2)}%/mo`,
              badge: null,
            },
            {
              label: 'Model Confidence (R²)',
              value: isLoading ? '—' : `${(confidence * 100).toFixed(1)}%`,
              badge: null,
            },
          ].map((card) => (
            <div key={card.label} className="frammer-card p-4">
              <p className="text-xs text-[#52525B] mb-2">{card.label}</p>
              <p className="text-2xl font-metric text-white">{card.value}</p>
              {card.badge && (
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1 text-[10px] border px-1.5',
                    card.positive
                      ? 'text-green-400 border-green-500/30'
                      : 'text-red-400 border-red-500/30',
                  )}
                >
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
            Forecasts use OLS linear regression on the last 12 months of actuals. Confidence bands are ±1.96σ of
            regression residuals and widen with horizon length. R² measures how well the trend explains variance.
            For planning purposes only.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
