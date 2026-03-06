import React from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface ForecastDataPoint {
  label: string;
  actual?: number;
  forecast?: number;
  upperBound?: number;
  lowerBound?: number;
  isForecast?: boolean;
}

interface ForecastChartProps {
  data: ForecastDataPoint[];
  metricLabel?: string;
  className?: string;
  height?: number;
  actualColor?: string;
  forecastColor?: string;
}

const CustomTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1C1C1C] border border-[#27272A] rounded-xl p-3 shadow-xl text-xs">
      <p className="text-[#A1A1AA] mb-2 font-medium">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-[#71717A] capitalize">{entry.name}:</span>
          <span className="text-white font-metric">{entry.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export const ForecastChart: React.FC<ForecastChartProps> = ({
  data,
  metricLabel = 'Clips Generated',
  className,
  height = 240,
  actualColor = '#E8212B',
  forecastColor = '#3B82F6',
}) => {
  // Find the boundary between actual and forecast
  const lastActualIdx = data.reduce((acc, d, i) => (d.actual !== undefined ? i : acc), -1);

  return (
    <div className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={forecastColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={forecastColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#27272A" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#52525B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#52525B' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={({ payload }) => (
              <div className="flex items-center gap-4 justify-center mt-2">
                {payload?.map((entry: any) => (
                  <span key={entry.value} className="flex items-center gap-1.5 text-xs text-[#71717A]">
                    <span
                      className="inline-block w-5 h-0.5 rounded"
                      style={{
                        backgroundColor: entry.color,
                        borderTop: entry.payload?.strokeDasharray ? `2px dashed ${entry.color}` : undefined,
                        height: entry.payload?.strokeDasharray ? 0 : 2,
                      }}
                    />
                    {entry.value}
                  </span>
                ))}
              </div>
            )}
          />

          {/* Confidence band */}
          <Area
            dataKey="upperBound"
            stroke="none"
            fill="url(#forecastBand)"
            legendType="none"
            dot={false}
            activeDot={false}
          />
          <Area
            dataKey="lowerBound"
            stroke="none"
            fill="#0A0A0A"
            legendType="none"
            dot={false}
            activeDot={false}
          />

          {/* Actual line */}
          <Line
            dataKey="actual"
            name="Actual"
            stroke={actualColor}
            strokeWidth={2}
            dot={{ r: 3, fill: actualColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: actualColor }}
            connectNulls={false}
          />

          {/* Forecast line (dashed) */}
          <Line
            dataKey="forecast"
            name="Forecast"
            stroke={forecastColor}
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 3, fill: forecastColor, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: forecastColor }}
            connectNulls={false}
          />

          {/* Today separator */}
          {lastActualIdx >= 0 && data[lastActualIdx] && (
            <ReferenceLine
              x={data[lastActualIdx].label}
              stroke="#3F3F46"
              strokeDasharray="3 3"
              label={{ value: 'Today', position: 'insideTopRight', fontSize: 10, fill: '#52525B' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
