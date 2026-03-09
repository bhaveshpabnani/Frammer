import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Play,
  Users,
  Globe2,
  Layers,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Video,
  Database,
  GitBranch,
  BarChart3,
  Bot,
  FileText,
  TrendingDown,
  ShieldCheck,
  LayoutGrid,
  Plug,
  Calculator,
  Activity,
  Grid3X3,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Badge } from '@/components/ui/badge';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: string;
  badgeVariant?: 'red' | 'blue' | 'green';
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  href,
  icon,
  label,
  active,
  collapsed,
  badge,
  badgeVariant = 'red',
}) => {
  return (
    <Link
      to={href}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center gap-3 rounded-xl transition-all duration-150 group',
        collapsed ? 'justify-center px-0 py-3 mx-auto w-10' : 'px-3 py-2.5',
        active
          ? 'bg-frammer-red/15 text-white border border-frammer-red/30'
          : 'text-[#A1A1AA] hover:text-white hover:bg-white/5 border border-transparent'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-4.5 h-4.5 transition-colors',
          active ? 'text-frammer-red' : 'text-[#52525B] group-hover:text-white'
        )}
        style={{ width: 18, height: 18 }}
      >
        {icon}
      </div>
      {!collapsed && (
        <div className="flex flex-1 items-center justify-between overflow-hidden">
          <span className={cn('text-sm font-medium truncate', active && 'text-white')}>
            {label}
          </span>
          {badge && (
            <span
              className={cn(
                'ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0',
                badgeVariant === 'red' && 'badge-red',
                badgeVariant === 'blue' && 'badge-blue',
                badgeVariant === 'green' && 'badge-green'
              )}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};

const navGroups = [
  {
    label: 'Analytics',
    items: [
      { href: '/', icon: <LayoutDashboard size={18} />, label: 'Overview' },
      { href: '/dashboards', icon: <LayoutGrid size={18} />, label: 'Dashboards' },
      { href: '/content-performance', icon: <Play size={18} />, label: 'Content Performance', badge: 'LIVE', badgeVariant: 'red' as const },
      { href: '/channel-analytics', icon: <TrendingUp size={18} />, label: 'Channel Analytics' },
      { href: '/output-types', icon: <Layers size={18} />, label: 'Output Types' },
      { href: '/language-analytics', icon: <Globe2 size={18} />, label: 'Language Analytics' },
      { href: '/usage-trends', icon: <Activity size={18} />, label: 'Usage Trends' },
      { href: '/multi-dimensional', icon: <Grid3X3 size={18} />, label: 'Multi-Dimensional' },
    ],
  },
  {
    label: 'Explore',
    items: [
      { href: '/videos', icon: <Video size={18} />, label: 'Video Explorer' },
      { href: '/queries', icon: <GitBranch size={18} />, label: 'Query Builder' },
    ],
  },
  {
    label: 'Data',
    items: [
      { href: '/datasets', icon: <Database size={18} />, label: 'Datasets' },
      { href: '/connectors', icon: <Plug size={18} />, label: 'Connectors' },
      { href: '/metrics', icon: <Calculator size={18} />, label: 'Metrics' },
    ],
  },
  {
    label: 'AI & Insights',
    items: [
      { href: '/ai', icon: <Bot size={18} />, label: 'AI Analytics', badge: 'AI', badgeVariant: 'blue' as const },
      { href: '/forecasting', icon: <TrendingDown size={18} />, label: 'Forecasting' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { href: '/reports', icon: <FileText size={18} />, label: 'Reports' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/team-productivity', icon: <Users size={18} />, label: 'Team Productivity' },
      { href: '/client-portal', icon: <BookOpen size={18} />, label: 'Client Portal' },
      { href: '/processing-insights', icon: <Cpu size={18} />, label: 'Processing Insights' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/quality', icon: <ShieldCheck size={18} />, label: 'Data Quality' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('frammer_sidebar_collapsed');
    if (saved) setCollapsed(saved === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('frammer_sidebar_collapsed', collapsed.toString());
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '64px' : '256px');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
  }, [collapsed]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 flex flex-col overflow-hidden transition-all duration-200',
        'border-r border-[#1C1C1C]',
        collapsed ? 'w-16' : 'w-64'
      )}
      style={{ background: 'hsl(var(--sidebar-background))' }}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center border-b border-[#1C1C1C] shrink-0',
          collapsed ? 'justify-center py-5 px-3' : 'py-5 px-5'
        )}
      >
        <Logo collapsed={collapsed} />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#52525B]">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarItem
                  key={item.href}
                  {...item}
                  active={isActive(item.href)}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom — collapse toggle + settings */}
      <div className="border-t border-[#1C1C1C] p-3 space-y-1 shrink-0">
        <SidebarItem
          href="/settings"
          icon={<Settings size={18} />}
          label="Settings"
          active={pathname === '/settings'}
          collapsed={collapsed}
        />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150',
            'text-[#52525B] hover:text-white hover:bg-white/5',
            collapsed && 'justify-center px-0 w-10 mx-auto'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <div style={{ width: 18, height: 18 }} className="flex-shrink-0">
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </div>
          {!collapsed && <span className="text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
};
