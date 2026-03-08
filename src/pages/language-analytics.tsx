import React, { useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { StatsCard } from '@/components/stats-card';
import { ChartCard } from '@/components/chart-card';
import {
  BarChart, Bar, Cell, PieChart, Pie,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';
import { languageData as mockLanguages } from '@/data/mockData';
import { CHART_COLORS } from '@/types';
import { downloadCsv } from '@/lib/utils';
import { useLanguages } from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import { useNavigate } from 'react-router-dom';

const DarkTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#161616] border border-[#27272A] rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="text-[#71717A] mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-[#A1A1AA]">{p.name}:</span>
          <span className="text-white font-medium font-mono">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
        </div>
      ))}
    </div>
  );
};

const LANG_COLORS = [
  CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.amber,
  CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.cyan,
  CHART_COLORS.rose, CHART_COLORS.orange,
];

const LanguageAnalytics: React.FC = () => {
  const { data: liveLanguages } = useLanguages();
  const { updateFilters } = useFilters();
  const navigate = useNavigate();
  const languageData = liveLanguages ?? mockLanguages;
  const total = languageData.reduce((s, l) => s + l.count, 0);
  const totalPublished = languageData.reduce((s, l) => s + (l.published ?? 0), 0);
  const conversionRate = total > 0 ? ((totalPublished / total) * 100).toFixed(1) : '—';

  useEffect(() => {
    if (!liveLanguages) console.warn('[LanguageAnalytics] Language data unavailable — showing mock fallback');
  }, [liveLanguages]);
  const pieData = languageData.map((l, i) => ({ ...l, color: LANG_COLORS[i] }));

  const topLang        = languageData[0];
  const multilingualTotal = languageData.slice(1).reduce((s, l) => s + l.count, 0);

  const groupedBarData = languageData.map((l) => ({
    language: l.language,
    Uploaded: l.count,
    Published: l.published ?? 0,
  }));

  return (
    <DashboardLayout title="Language Analytics" subtitle="Content output broken down by language">
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Language Analytics"
          subtitle="Multi-language content production insights"
          badge={{ label: 'GLOBAL', variant: 'blue' }}
          onDownload={() => downloadCsv('frammer-language-analytics', languageData.map(l => ({ language: l.language, clips_uploaded: l.count, clips_published: l.published ?? 0, conversion_pct: l.count > 0 ? ((l.published ?? 0) / l.count * 100).toFixed(1) : 0, share_pct: l.percentage, hours: l.hours ?? '' })))}
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatsCard
            title="Languages Supported"
            value={languageData.length || '—'}
            icon={<Globe2 size={16} />}
            accentColor="blue"
          />
          <StatsCard
            title="Top Language"
            value={topLang?.language ?? '—'}
            unit={topLang ? `${topLang.percentage.toFixed(1)}% share` : ''}
            accentColor="red"
          />
          <StatsCard
            title="Total Videos"
            value={total.toLocaleString()}
            unit="across all languages"
            accentColor="amber"
          />
          <StatsCard
            title="Non-primary Languages"
            value={multilingualTotal.toLocaleString()}
            unit="videos"
            accentColor="green"
          />
          <StatsCard
            title="Publish Conversion"
            value={conversionRate === '—' ? '—' : `${conversionRate}%`}
            unit={`${totalPublished.toLocaleString()} published`}
            accentColor="purple"
          />
        </div>

        {/* Language cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {pieData.map((lang, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="frammer-card p-4 flex flex-col gap-2 cursor-pointer hover:scale-[1.02] transition-transform"
              style={{ borderColor: `${lang.color}30` }}
              onClick={() => { updateFilters({ language: lang.language }); navigate('/videos'); }}
            >
              <p className="text-[11px] font-semibold" style={{ color: lang.color }}>{lang.language}</p>
              <p className="font-metric text-xl font-medium text-white">{lang.count.toLocaleString()}</p>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${lang.percentage}%`, background: lang.color }} />
                </div>
                <span className="text-[10px] text-[#71717A]">{lang.percentage}%</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Clips by Language" subtitle="Absolute volume per language" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="language" type="category" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="count" name="Clips" radius={[0, 4, 4, 0]} maxBarSize={18}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Language Share — Donut" subtitle="Proportional distribution" height={280}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="count" nameKey="language"
                  cx="45%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={2} strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} iconType="circle"
                  formatter={(v) => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Upload vs Published grouped bar */}
        <ChartCard title="Uploaded vs Published by Language" subtitle="Conversion funnel per language" height={280}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={groupedBarData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1C1C1C" vertical={false} />
              <XAxis dataKey="language" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<DarkTooltip />} />
              <Legend iconSize={8} iconType="circle"
                formatter={(v) => <span style={{ color: '#A1A1AA', fontSize: 11 }}>{v}</span>} />
              <Bar dataKey="Uploaded" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar dataKey="Published" fill={CHART_COLORS.green} radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Table */}
        <div className="frammer-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1C1C1C]">
            <h3 className="text-sm font-semibold text-white">Language Detail Table</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1C1C1C]">
                {['Language', 'Uploaded', 'Published', 'Conv. Rate', 'Share'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#52525B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pieData.map((lang, i) => {
                const conv = lang.count > 0 ? ((lang.published ?? 0) / lang.count * 100).toFixed(1) : '—';
                return (
                  <tr key={i} className="border-b border-[#0F0F0F] hover:bg-white/[0.04] cursor-pointer"
                    onClick={() => { updateFilters({ language: lang.language }); navigate('/videos'); }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: lang.color }} />
                        <span className="text-sm font-medium text-white">{lang.language}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{lang.count.toLocaleString()}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{(lang.published ?? 0).toLocaleString()}</td>
                    <td className="px-5 py-3 font-metric text-[#A1A1AA]">{conv === '—' ? '—' : `${conv}%`}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[#1C1C1C] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${lang.percentage}%`, background: lang.color }} />
                        </div>
                        <span className="font-metric text-xs text-[#A1A1AA]">{lang.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LanguageAnalytics;
