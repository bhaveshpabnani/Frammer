import React, { useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { Zap, Users, TrendingUp, BarChart3 } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { formatNumber } from '@/lib/utils';
import { useClientsSummary, useFunnel, useConcentration, useChannelHealth } from '@/hooks/useApi';

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill || '#999' }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">
            {typeof p.value === 'number'
              ? p.dataKey?.includes('rate') || p.dataKey?.includes('pct')
                ? `${(p.value * 100).toFixed(1)}%`
                : p.value.toLocaleString()
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const QUADRANT_COLORS: Record<string, string> = {
  star: CHART_COLORS.green,
  high_volume: CHART_COLORS.blue,
  high_efficiency: CHART_COLORS.amber,
  underperforming: CHART_COLORS.red,
};

const ClientPerformance: React.FC = () => {
  const { data: clients } = useClientsSummary();
  const { data: funnel } = useFunnel();
  const { data: concentration } = useConcentration();
  const { data: channelHealth } = useChannelHealth();

  // KPI figures
  const totalClients = clients?.length ?? 0;
  const avgPublishRate =
    clients && clients.length > 0
      ? clients.reduce((s, c) => s + c.publish_rate, 0) / clients.length
      : null;
  const top5ChannelShare = concentration?.top5_channel_share ?? null;
  const top5UserShare = concentration?.top5_user_share ?? null;

  // Funnel stages
  const funnelStages = funnel?.stages ?? [];
  const funnelChartData = funnelStages.map((s) => ({
    stage: s.stage,
    count: s.count,
    pct: s.conversion_pct != null ? Math.round(s.conversion_pct * 10) / 10 : null,
  }));

  // Client publish rate chart
  const clientChartData = useMemo(
    () =>
      (clients ?? [])
        .slice()
        .sort((a, b) => b.publish_rate - a.publish_rate)
        .map((c) => ({
          name: c.slug,
          publishRate: Math.round(c.publish_rate * 1000) / 10, // → percentage
          uploaded: c.total_uploaded,
          published: c.total_published,
          channels: c.active_channels,
          users: c.active_users,
        })),
    [clients],
  );

  // Channel health scatter
  const scatterData = useMemo(
    () =>
      (channelHealth ?? []).map((r) => ({
        channel: r.channel,
        volume: r.total_uploaded,
        publishRate: Math.round(r.publish_rate * 1000) / 10,
        quadrant: r.quadrant,
      })),
    [channelHealth],
  );

  // Pareto chart for concentration
  const channelPareto = concentration?.channel_pareto?.slice(0, 15) ?? [];

  return (
    <DashboardLayout>
      <PageHeader
        title="Client Performance"
        subtitle="Client health scores, funnel conversion, channel quadrant analysis, and concentration metrics"
      />

      {/* KPI cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StatsCard
          title="Active Clients"
          value={String(totalClients)}
          icon={<Users size={16} />}
        />
        <StatsCard
          title="Avg Publish Rate"
          value={avgPublishRate != null ? `${(avgPublishRate * 100).toFixed(1)}%` : '—'}
          icon={<TrendingUp size={16} />}
        />
        <StatsCard
          title="Top-5 Channel Share"
          value={top5ChannelShare != null ? `${(top5ChannelShare * 100).toFixed(1)}%` : '—'}
          icon={<BarChart3 size={16} />}
        />
        <StatsCard
          title="Top-5 User Share"
          value={top5UserShare != null ? `${(top5UserShare * 100).toFixed(1)}%` : '—'}
          icon={<BarChart3 size={16} />}
        />
      </motion.div>

      {/* Funnel + Client publish rate */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <ChartCard title="Upload → Process → Publish Funnel" subtitle="Overall volume at each funnel stage">
          {funnelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnelChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717A' }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 12, fill: '#A1A1AA' }}
                  width={85}
                />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]}>
                  {funnelChartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={[CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.green][i % 3]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#52525B] text-sm">
              Funnel data not available
            </div>
          )}
        </ChartCard>

        <ChartCard title="Client Publish Rates" subtitle="Percentage of uploaded videos published, by client">
          {clientChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={clientChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#71717A' }} unit="%" domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#A1A1AA' }}
                  width={80}
                />
                <Tooltip content={<DarkTooltip />} />
                <ReferenceLine x={50} stroke={CHART_COLORS.amber} strokeDasharray="4 3" />
                <Bar dataKey="publishRate" name="Publish Rate %" radius={[0, 4, 4, 0]}>
                  {clientChartData.map((d) => (
                    <Cell
                      key={d.name}
                      fill={d.publishRate >= 50 ? CHART_COLORS.green : CHART_COLORS.red}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#52525B] text-sm">
              Client data not available
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Channel health quadrant + Pareto */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <ChartCard
          title="Channel Health Quadrants"
          subtitle="Volume (x) vs Publish Rate (y) — colored by quadrant"
        >
          {scatterData.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3 mb-2">
                {Object.entries(QUADRANT_COLORS).map(([q, color]) => (
                  <div key={q} className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    {q.replace('_', ' ')}
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                  <XAxis
                    dataKey="volume"
                    name="Volume"
                    type="number"
                    tick={{ fontSize: 11, fill: '#71717A' }}
                    label={{ value: 'Uploads', position: 'insideBottomRight', offset: -4, fontSize: 10, fill: '#52525B' }}
                  />
                  <YAxis
                    dataKey="publishRate"
                    name="Publish Rate"
                    type="number"
                    tick={{ fontSize: 11, fill: '#71717A' }}
                    unit="%"
                    label={{ value: 'Publish Rate %', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#52525B' }}
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
                          <p className="text-white font-medium mb-1">{d.channel}</p>
                          <p className="text-[#A1A1AA]">Uploads: {d.volume}</p>
                          <p className="text-[#A1A1AA]">Publish Rate: {d.publishRate}%</p>
                          <p className="text-[#A1A1AA]">Quadrant: {d.quadrant}</p>
                        </div>
                      );
                    }}
                  />
                  <Scatter
                    data={scatterData}
                    fill={CHART_COLORS.blue}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={QUADRANT_COLORS[payload.quadrant] ?? '#999'}
                          fillOpacity={0.8}
                          stroke="none"
                        />
                      );
                    }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#52525B] text-sm">
              Channel health data not available
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Channel Concentration (Pareto)"
          subtitle="Cumulative share of upload volume by channel"
        >
          {channelPareto.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={channelPareto}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                <XAxis
                  dataKey="channel"
                  tick={{ fontSize: 10, fill: '#71717A' }}
                  angle={-35}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 11, fill: '#71717A' }}
                  domain={[0, 1]}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
                        <p className="text-white font-medium mb-1">{label}</p>
                        <p className="text-[#A1A1AA]">Count: {d.count?.toLocaleString()}</p>
                        <p className="text-[#A1A1AA]">Cumulative: {(d.cumulative_share * 100).toFixed(1)}%</p>
                      </div>
                    );
                  }}
                />
                <ReferenceLine y={0.8} stroke={CHART_COLORS.amber} strokeDasharray="4 3" label={{ value: '80%', fontSize: 10, fill: CHART_COLORS.amber }} />
                <Line
                  type="monotone"
                  dataKey="cumulative_share"
                  name="Cumulative Share"
                  stroke={CHART_COLORS.blue}
                  strokeWidth={2}
                  dot={{ r: 3, fill: CHART_COLORS.blue }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-[#52525B] text-sm">
              Concentration data not available
            </div>
          )}
        </ChartCard>
      </motion.div>
    </DashboardLayout>
  );
};

export default ClientPerformance;
