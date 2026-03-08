import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, ScatterChart, Scatter,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
  ZAxis, Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, Video, Scissors, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { formatNumber, cn, downloadCsv } from '@/lib/utils';
import { useClientsSummary, useKpis, useConcentration, useChannelHealth } from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import type { ClientSummaryRow } from '@/api/types';
import { ExportButton } from '@/components/ExportButton';
import { CrossFilterBar } from '@/components/CrossFilterChip';

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">
            {p.name?.includes('%') || p.name?.toLowerCase().includes('rate')
              ? `${Number(p.value).toFixed(1)}%`
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// Minimal mock fallback — matches ClientSummaryRow shape
const MOCK_CLIENTS: ClientSummaryRow[] = [
  { slug: 'client_1', name: 'Client 1', total_uploaded: 389, total_published: 284, total_clips: 2529, publish_rate: 0.73, active_channels: 2, active_users: 4, uploaded_duration_hrs: 312 },
  { slug: 'client_2', name: 'Client 2', total_uploaded: 287, total_published: 201, total_clips: 1866, publish_rate: 0.70, active_channels: 2, active_users: 3, uploaded_duration_hrs: 230 },
  { slug: 'client_3', name: 'Client 3', total_uploaded: 241, total_published: 165, total_clips: 1567, publish_rate: 0.68, active_channels: 2, active_users: 3, uploaded_duration_hrs: 193 },
  { slug: 'client_4', name: 'Client 4', total_uploaded: 218, total_published: 148, total_clips: 1417, publish_rate: 0.68, active_channels: 2, active_users: 2, uploaded_duration_hrs: 175 },
  { slug: 'client_5', name: 'Client 5', total_uploaded: 196, total_published: 130, total_clips: 1274, publish_rate: 0.66, active_channels: 2, active_users: 2, uploaded_duration_hrs: 157 },
];

const CLIENT_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple,
];

const ClientPortal: React.FC = () => {
  const navigate                                        = useNavigate();
  const { updateFilters }                               = useFilters();
  const { data: rawClients, isLoading: clientsLoading } = useClientsSummary();
  const { data: kpis }                                  = useKpis();
  const { data: concentrationData }                     = useConcentration();
  const { data: healthData }                            = useChannelHealth();
  const [expandedClient, setExpandedClient]             = useState<string | null>(null);

  const clients: ClientSummaryRow[] = React.useMemo(() => {
    if (!rawClients || rawClients.length === 0) {
      if (!clientsLoading) {
        console.warn('[ClientPortal] Client summary unavailable — showing mock fallback');
      }
      return MOCK_CLIENTS;
    }
    return rawClients;
  }, [rawClients, clientsLoading]);

  const avgVideos = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.total_uploaded, 0) / clients.length)
    : 0;
  const avgClips = clients.length
    ? Math.round(clients.reduce((s, c) => s + c.total_clips, 0) / clients.length)
    : 0;
  const avgPublishRate = clients.length
    ? (clients.reduce((s, c) => s + c.publish_rate, 0) / clients.length) * 100
    : 0;

  const volumeChartData = clients.map((c) => ({
    name: c.name,
    Videos: c.total_uploaded,
    Clips: c.total_clips,
  }));

  const publishRateChartData = clients.map((c) => ({
    name: c.name,
    'Publish Rate %': Math.round(c.publish_rate * 1000) / 10,
  }));

  return (
    <DashboardLayout title="Client Portal" subtitle="Per-client usage, volume and performance metrics">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Client Portal"
          subtitle="Monitor usage, volume and health for each client account"
          badge={{ label: 'LIVE', variant: 'blue' }}
          onDownload={() => downloadCsv('frammer-clients', clients.map(c => ({ name: c.name, total_uploaded: c.total_uploaded, total_published: c.total_published, total_clips: c.total_clips, publish_rate_pct: (c.publish_rate * 100).toFixed(1), active_channels: c.active_channels, active_users: c.active_users, uploaded_duration_hrs: c.uploaded_duration_hrs })))}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            title="Active Clients"
            value={kpis?.activeClients ?? clients.length}
            icon={<Users size={16} />}
            accentColor="red"
          />
          <StatsCard
            title="Avg Videos / Client"
            value={avgVideos}
            icon={<Video size={16} />}
            accentColor="blue"
          />
          <StatsCard
            title="Avg Clips / Client"
            value={formatNumber(avgClips)}
            icon={<Scissors size={16} />}
            accentColor="amber"
          />
          <StatsCard
            title="Avg Publish Rate"
            value={`${avgPublishRate.toFixed(1)}%`}
            trend={{ value: avgPublishRate, label: 'avg' }}
            icon={<TrendingUp size={16} />}
            accentColor="green"
          />
        </div>

        <CrossFilterBar />

        {/* Client summary cards — expandable accordion */}
        <div className="space-y-2">
          {clients.map((client, i) => {
            const color     = CLIENT_COLORS[i % CLIENT_COLORS.length];
            const isExpanded = expandedClient === client.slug;
            return (
              <div
                key={client.slug}
                className="frammer-card overflow-hidden"
                style={{ borderColor: isExpanded ? `${color}40` : undefined }}
              >
                {/* Header row */}
                <div
                  className="flex items-center gap-4 px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedClient(isExpanded ? null : client.slug)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: color }}
                  >
                    {client.name.split(' ').slice(-1)[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{client.name}</p>
                    <p className="text-[10px] text-[#71717A]">{client.active_channels} channels · {client.active_users} users</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-xs">
                    <div className="text-right">
                      <p className="text-[#52525B]">Uploaded</p>
                      <p className="font-mono text-[#A1A1AA]">{client.total_uploaded.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#52525B]">Published</p>
                      <p className="font-mono text-[#A1A1AA]">{client.total_published.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#52525B]">Publish Rate</p>
                      <p className={cn('font-mono font-semibold',
                        (client.publish_rate * 100) >= 70 ? 'text-green-400' :
                        (client.publish_rate * 100) >= 50 ? 'text-amber-400' : 'text-red-400',
                      )}>
                        {(client.publish_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#52525B]">Hours</p>
                      <p className="font-mono text-[#A1A1AA]">{client.uploaded_duration_hrs.toFixed(0)}h</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/videos?client=${encodeURIComponent(client.slug)}`); }}
                      className="text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                      title="View in Explorer"
                    >
                      <ExternalLink size={13} />
                    </button>
                    {isExpanded ? <ChevronDown size={14} className="text-[#71717A]" /> : <ChevronRight size={14} className="text-[#71717A]" />}
                  </div>
                </div>

                {/* Expanded drill panel */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[#1C1C1C]"
                    >
                      <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-[#52525B] mb-1">Total Clips</p>
                          <p className="font-mono text-[#E4E4E7] text-sm">{client.total_clips.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[#52525B] mb-1">Active Channels</p>
                          <p className="font-mono text-[#E4E4E7] text-sm">{client.active_channels}</p>
                        </div>
                        <div>
                          <p className="text-[#52525B] mb-1">Active Users</p>
                          <p className="font-mono text-[#E4E4E7] text-sm">{client.active_users}</p>
                        </div>
                        <div>
                          <p className="text-[#52525B] mb-1">Clips / Video</p>
                          <p className="font-mono text-[#E4E4E7] text-sm">
                            {client.total_uploaded > 0 ? (client.total_clips / client.total_uploaded).toFixed(1) : '—'}×
                          </p>
                        </div>
                      </div>
                      <div className="px-5 pb-4">
                        <button
                          onClick={() => updateFilters({ client: client.slug })}
                          className="text-[11px] text-primary hover:underline mr-4"
                        >
                          Filter dashboard to this client
                        </button>
                        <button
                          onClick={() => navigate(`/videos?client=${encodeURIComponent(client.slug)}`)}
                          className="text-[11px] text-[#71717A] hover:text-[#A1A1AA]"
                        >
                          View all videos →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Advanced drill charts (from former client-performance page) */}
        {healthData && healthData.length > 0 && (
          <ChartCard
            title="Channel Health Overview"
            subtitle="Volume vs publish rate across all channels for this client"
            height={280}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 8, left: -10, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" />
                <XAxis dataKey="total_uploaded" name="Volume" type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="publish_conversion_pct" name="Publish Rate" type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <ZAxis dataKey="health_score" range={[40, 200]} />
                <Tooltip content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
                      <p className="text-white font-semibold">{d.channel}</p>
                      <p className="text-[#A1A1AA]">Volume: {d.total_uploaded?.toLocaleString()}</p>
                      <p className="text-[#A1A1AA]">Pub Rate: {d.publish_conversion_pct?.toFixed(1)}%</p>
                    </div>
                  );
                }} />
                <Scatter data={healthData}>
                  {healthData.map((entry, i) => (
                    <Cell key={i} fill={CHART_COLORS.red} fillOpacity={0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Comparison charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard
            title="Client Volume Comparison"
            subtitle="Videos uploaded and clips generated per client"
            height={260}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Videos" fill={CHART_COLORS.red} radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Clips" fill={CHART_COLORS.blue} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Publish Rate by Client"
            subtitle="Percentage of uploaded videos successfully published"
            height={260}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={publishRateChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="Publish Rate %" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {clients.map((_, i) => (
                    <Cell key={i} fill={CLIENT_COLORS[i % CLIENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Client detail table */}
        <div className="frammer-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C]">
            <h3 className="text-sm font-semibold text-white">Client Account Overview</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['Client', 'Videos', 'Clips', 'Published', 'Channels', 'Users', 'Hours', 'Publish Rate'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => {
                  const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
                  return (
                    <tr key={c.slug} className="border-b border-[#0F0F0F] hover:bg-white/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ background: color }}
                          >
                            {c.name.split(' ').slice(-1)[0]}
                          </div>
                          <span className="text-sm font-medium text-white">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.total_uploaded.toLocaleString()}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.total_clips.toLocaleString()}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.total_published.toLocaleString()}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.active_channels}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.active_users}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{c.uploaded_duration_hrs.toFixed(0)}h</td>
                      <td className="px-5 py-3">
                        <span className="badge-green text-xs">
                          {(c.publish_rate * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClientPortal;
