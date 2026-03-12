import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Lightbulb, Brain } from 'lucide-react';
import { CHART_COLORS } from '@/types';
import { useInsightsSummary, useAnomalies, useWaterfall } from '@/hooks/useApi';
import { useState } from 'react';

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
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const SEVERITY_COLORS: Record<string, string> = {
  high: CHART_COLORS.red,
  medium: CHART_COLORS.amber,
  low: CHART_COLORS.green,
  critical: '#ef4444',
};

export const InsightsContent: React.FC = () => {
  const { data: insights, isLoading: insightsLoading } = useInsightsSummary();
  const { data: anomalies } = useAnomalies();
  const [waterfallMetric] = useState('uploaded');
  const [waterfallDimension] = useState('channel');
  const { data: waterfall } = useWaterfall(waterfallMetric, waterfallDimension);

  const riskCount = insights?.top_risks?.length ?? 0;
  const oppCount = insights?.top_opportunities?.length ?? 0;
  const driverCount = insights?.likely_drivers?.length ?? 0;
  const anomalyCount = anomalies?.length ?? 0;

  return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Insights & Recommendations"
          subtitle="AI-generated analysis of your content operations"
          badge={{ label: 'AI', variant: 'blue' }}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatsCard
            title="Risks Detected"
            value={riskCount}
            icon={<AlertTriangle size={16} />}
            accentColor="red"
          />
          <StatsCard
            title="Opportunities"
            value={oppCount}
            icon={<TrendingUp size={16} />}
            accentColor="green"
          />
          <StatsCard
            title="Key Drivers"
            value={driverCount}
            icon={<Lightbulb size={16} />}
            accentColor="amber"
          />
          <StatsCard
            title="Anomalies"
            value={anomalyCount}
            icon={<Brain size={16} />}
            accentColor="purple"
          />
        </div>

        {/* Executive Summary */}
        {insights?.executive_summary && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="frammer-card p-6"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Brain size={16} className="text-frammer-red" />
              Executive Summary
            </h3>
            <p className="text-sm text-[#A1A1AA] leading-relaxed whitespace-pre-line">
              {insights.executive_summary}
            </p>
          </motion.div>
        )}

        {/* Risks & Opportunities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Risks */}
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle size={14} className="text-red-400" />
                Top Risks
              </h3>
            </div>
            {insightsLoading ? (
              <div className="p-8 text-center text-[#52525B] text-sm">Loading...</div>
            ) : !insights?.top_risks?.length ? (
              <div className="p-8 text-center text-[#52525B] text-sm">No risks identified</div>
            ) : (
              <div className="divide-y divide-[#0F0F0F]">
                {insights.top_risks.map((risk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-5 py-4 hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: SEVERITY_COLORS[risk.severity] || CHART_COLORS.amber }}
                      />
                      <span className="text-sm font-medium text-white">{risk.title}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                        style={{
                          color: SEVERITY_COLORS[risk.severity] || '#71717A',
                          background: `${SEVERITY_COLORS[risk.severity] || '#71717A'}20`,
                        }}
                      >
                        {risk.severity}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] ml-4">{risk.detail}</p>
                    {risk.suggested_action && (
                      <p className="text-xs text-[#52525B] ml-4 mt-1 italic">Action: {risk.suggested_action}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Opportunities */}
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <TrendingUp size={14} className="text-green-400" />
                Top Opportunities
              </h3>
            </div>
            {insightsLoading ? (
              <div className="p-8 text-center text-[#52525B] text-sm">Loading...</div>
            ) : !insights?.top_opportunities?.length ? (
              <div className="p-8 text-center text-[#52525B] text-sm">No opportunities found</div>
            ) : (
              <div className="divide-y divide-[#0F0F0F]">
                {insights.top_opportunities.map((opp, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="px-5 py-4 hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS.green }} />
                      <span className="text-sm font-medium text-white">{opp.title}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded text-green-400 bg-green-400/10">
                        {opp.potential_impact}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] ml-4">{opp.detail}</p>
                    {opp.suggested_action && (
                      <p className="text-xs text-[#52525B] ml-4 mt-1 italic">Action: {opp.suggested_action}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drivers */}
        {insights?.likely_drivers && insights.likely_drivers.length > 0 && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Lightbulb size={14} className="text-amber-400" />
                Likely Growth/Decline Drivers
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1C1C1C]">
                  {['Metric', 'Segment', 'Dimension', 'Contribution', 'Direction'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {insights.likely_drivers.map((d, i) => (
                  <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04]">
                    <td className="px-5 py-3 text-white font-medium">{d.metric}</td>
                    <td className="px-5 py-3 text-[#A1A1AA]">{d.segment}</td>
                    <td className="px-5 py-3 text-[#71717A]">{d.dimension}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{d.contribution_pct}%</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${d.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                        {d.direction === 'up' ? '▲' : '▼'} {d.direction}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Waterfall Chart */}
        {waterfall && waterfall.segments.length > 0 && (
          <ChartCard
            title="Contribution to Change Waterfall"
            subtitle={`${waterfallMetric} by ${waterfallDimension} — total delta: ${waterfall.total_delta > 0 ? '+' : ''}${waterfall.total_delta}`}
            height={300}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfall.segments} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
                <XAxis dataKey="segment" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="delta" name="Delta" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {waterfall.segments.map((s, i) => (
                    <Cell key={i} fill={s.delta >= 0 ? CHART_COLORS.green : CHART_COLORS.red} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Anomalies Table */}
        {anomalies && anomalies.length > 0 && (
          <div className="frammer-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1C1C1C]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Brain size={14} className="text-purple-400" />
                Detected Anomalies ({anomalies.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1C1C1C]">
                    {['Segment', 'Dimension', 'Metric', 'Current', 'Previous', 'Change', 'Severity'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anomalies.slice(0, 15).map((a, i) => (
                    <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04]">
                      <td className="px-5 py-3 text-white font-medium">{a.segment}</td>
                      <td className="px-5 py-3 text-[#71717A]">{a.dimension}</td>
                      <td className="px-5 py-3 text-[#A1A1AA]">{a.metric}</td>
                      <td className="px-5 py-3 font-metric text-[#A1A1AA]">{a.current_value.toLocaleString()}</td>
                      <td className="px-5 py-3 font-metric text-[#71717A]">{a.previous_value.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <span className={`font-metric text-xs font-semibold ${a.change_pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {a.change_pct >= 0 ? '+' : ''}{a.change_pct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            color: SEVERITY_COLORS[a.severity] || '#71717A',
                            background: `${SEVERITY_COLORS[a.severity] || '#71717A'}20`,
                          }}
                        >
                          {a.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
};

const InsightsPage: React.FC = () => (
  <DashboardLayout title="AI Insights" subtitle="LLM-powered executive summary, anomalies, and growth drivers">
    <InsightsContent />
  </DashboardLayout>
);

export default InsightsPage;
