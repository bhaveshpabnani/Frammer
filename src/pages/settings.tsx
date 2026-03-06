import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Users,
  Key,
  Bell,
  Shield,
  Palette,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SettingsTab = 'workspace' | 'members' | 'api-keys' | 'notifications' | 'security' | 'appearance';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending';
  joinedAt: string;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  visible: boolean;
}

const INITIAL_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Priya Sharma', email: 'priya@frammer.io', role: 'Admin', status: 'Active', joinedAt: '2025-01-10' },
  { id: 'm-2', name: 'Arjun Mehta', email: 'arjun@frammer.io', role: 'Editor', status: 'Active', joinedAt: '2025-02-15' },
  { id: 'm-3', name: 'Zara Khan', email: 'zara@frammer.io', role: 'Editor', status: 'Active', joinedAt: '2025-03-01' },
  { id: 'm-4', name: 'Arnav Rao', email: 'arnav@frammer.io', role: 'Viewer', status: 'Active', joinedAt: '2025-04-20' },
  { id: 'm-5', name: 'Divya Pillai', email: 'divya@frammer.io', role: 'Editor', status: 'Pending', joinedAt: '2026-02-25' },
];

const INITIAL_KEYS: ApiKey[] = [
  { id: 'k-1', name: 'Production', key: 'frm_prod_sk_••••••••••••••••••••••••', created: '2025-01-10', lastUsed: '2026-02-28', visible: false },
  { id: 'k-2', name: 'Staging', key: 'frm_stag_sk_••••••••••••••••••••••••', created: '2025-06-01', lastUsed: '2026-01-15', visible: false },
];

const ROLE_COLORS: Record<Member['role'], string> = {
  Admin: 'bg-frammer-red/15 text-frammer-red border-frammer-red/30',
  Editor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Viewer: 'bg-[#27272A] text-[#A1A1AA] border-[#3F3F46]',
};

const NAV_ITEMS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'workspace', label: 'Workspace', icon: <Building2 size={14} /> },
  { key: 'members', label: 'Members', icon: <Users size={14} /> },
  { key: 'api-keys', label: 'API Keys', icon: <Key size={14} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={14} /> },
  { key: 'security', label: 'Security', icon: <Shield size={14} /> },
  { key: 'appearance', label: 'Appearance', icon: <Palette size={14} /> },
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('workspace');
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(INITIAL_KEYS);
  const [workspaceName, setWorkspaceName] = useState('Frammer Workspace');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [fiscalMonth, setFiscalMonth] = useState('March');

  const [notifs, setNotifs] = useState({
    weeklyDigest: true,
    qualityAlerts: true,
    processingComplete: false,
    teamActivity: false,
  });

  const [security, setSecurity] = useState({
    mfa: true,
    sessionTimeout: '4h',
    ssoEnabled: false,
  });

  const [inviteEmail, setInviteEmail] = useState('');

  const handleSaveWorkspace = () => toast({ title: 'Workspace settings saved' });

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    toast({ title: 'Invite sent', description: `${inviteEmail} has been invited.` });
    setInviteEmail('');
  };

  const toggleKeyVisibility = (id: string) =>
    setApiKeys((p) => p.map((k) => k.id === id ? { ...k, visible: !k.visible } : k));

  const deleteKey = (id: string) => {
    setApiKeys((p) => p.filter((k) => k.id !== id));
    toast({ title: 'API key revoked' });
  };

  const generateKey = () => {
    const newKey: ApiKey = {
      id: `k-${Date.now()}`,
      name: 'New Key',
      key: `frm_new_sk_${Math.random().toString(36).slice(2, 26)}`,
      created: new Date().toISOString().slice(0, 10),
      lastUsed: '—',
      visible: true,
    };
    setApiKeys((p) => [...p, newKey]);
    toast({ title: 'New API key generated', description: 'Copy it now — it will not be shown again.' });
  };

  return (
    <DashboardLayout title="Settings" subtitle="Workspace configuration and preferences">
      <div className="space-y-5">
        <PageHeader title="Settings" subtitle="Manage your workspace, team, and preferences" />

        <div className="grid grid-cols-12 gap-5">
          {/* Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left',
                    activeTab === item.key
                      ? 'bg-frammer-red/10 text-white border border-frammer-red/20'
                      : 'text-[#71717A] hover:text-white hover:bg-white/4'
                  )}
                >
                  <span className={activeTab === item.key ? 'text-frammer-red' : ''}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-9 space-y-4">

            {activeTab === 'workspace' && (
              <div className="frammer-card p-5 space-y-4">
                <p className="text-sm font-semibold text-white">Workspace Settings</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#71717A]">Workspace Name</label>
                    <Input value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#71717A]">Timezone</label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#161616] border-[#27272A]">
                        {['Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London'].map((tz) => (
                          <SelectItem key={tz} value={tz} className="text-sm text-[#A1A1AA]">{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#71717A]">Fiscal Year Start</label>
                    <Select value={fiscalMonth} onValueChange={setFiscalMonth}>
                      <SelectTrigger className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-[#161616] border-[#27272A]">
                        {['January', 'February', 'March', 'April', 'July', 'October'].map((m) => (
                          <SelectItem key={m} value={m} className="text-sm text-[#A1A1AA]">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSaveWorkspace} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">Save Changes</Button>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-3">
                {/* Invite */}
                <div className="frammer-card p-4 flex gap-2">
                  <Input placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} className="bg-[#1C1C1C] border-[#3F3F46] text-white text-sm flex-1" />
                  <Button onClick={handleInvite} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">
                    <Plus size={12} className="mr-1.5" /> Invite
                  </Button>
                </div>
                {/* Table */}
                <div className="frammer-card overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[#1C1C1C] bg-[#0D0D0D]">
                        {['Name', 'Email', 'Role', 'Status', 'Joined', ''].map((h) => <th key={h} className="text-left text-[#52525B] uppercase tracking-wider py-2 px-4 font-semibold">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id} className="border-b border-[#1C1C1C] hover:bg-white/2">
                          <td className="px-4 py-2.5 text-white">{m.name}</td>
                          <td className="px-4 py-2.5 text-[#71717A]">{m.email}</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className={cn('text-[10px] border px-1.5', ROLE_COLORS[m.role])}>{m.role}</Badge>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn('text-[10px]', m.status === 'Active' ? 'text-green-400' : 'text-amber-400')}>
                              {m.status === 'Active' ? <CheckCircle2 size={11} className="inline mr-1" /> : null}{m.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[#52525B]">{m.joinedAt}</td>
                          <td className="px-4 py-2.5">
                            <button onClick={() => setMembers((p) => p.filter((x) => x.id !== m.id))} className="text-[#3F3F46] hover:text-red-400 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'api-keys' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button onClick={generateKey} size="sm" className="bg-frammer-red hover:bg-frammer-red/90 text-white text-xs">
                    <RefreshCw size={12} className="mr-1.5" /> Generate New Key
                  </Button>
                </div>
                {apiKeys.map((k) => (
                  <div key={k.id} className="frammer-card p-4 flex items-center gap-3">
                    <Key size={14} className="text-[#52525B] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-medium">{k.name}</p>
                      <p className="text-[11px] text-[#52525B] font-mono mt-0.5">
                        {k.visible ? k.key.replace(/••+/, Math.random().toString(36).slice(2, 26)) : k.key}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-[#52525B]">Created {k.created}</p>
                      <p className="text-[10px] text-[#52525B]">Last used {k.lastUsed}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => toggleKeyVisibility(k.id)} className="text-[#52525B] hover:text-white">
                        {k.visible ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(k.key); toast({ title: 'Key copied' }); }} className="text-[#52525B] hover:text-white">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => deleteKey(k.id)} className="text-[#52525B] hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="frammer-card p-5 space-y-4">
                <p className="text-sm font-semibold text-white">Notification Preferences</p>
                {[
                  { key: 'weeklyDigest' as const, label: 'Weekly Digest', desc: 'Weekly summary of processing metrics and team activity' },
                  { key: 'qualityAlerts' as const, label: 'Data Quality Alerts', desc: 'Alerts when column null rate exceeds threshold' },
                  { key: 'processingComplete' as const, label: 'Processing Complete', desc: 'Notify when a video batch finishes processing' },
                  { key: 'teamActivity' as const, label: 'Team Activity', desc: 'Updates when team members upload or publish content' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white">{item.label}</p>
                      <p className="text-xs text-[#52525B] mt-0.5">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notifs[item.key]}
                      onCheckedChange={(v) => setNotifs((p) => ({ ...p, [item.key]: v }))}
                      className="data-[state=checked]:bg-frammer-red"
                    />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="frammer-card p-5 space-y-4">
                <p className="text-sm font-semibold text-white">Security Settings</p>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-[#52525B] mt-0.5">Require 2FA for all workspace members</p>
                  </div>
                  <Switch checked={security.mfa} onCheckedChange={(v) => setSecurity((p) => ({ ...p, mfa: v }))} className="data-[state=checked]:bg-frammer-red" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-white">SSO / SAML</p>
                    <p className="text-xs text-[#52525B] mt-0.5">Enterprise single sign-on integration</p>
                  </div>
                  <Switch checked={security.ssoEnabled} onCheckedChange={(v) => setSecurity((p) => ({ ...p, ssoEnabled: v }))} className="data-[state=checked]:bg-frammer-red" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#71717A]">Session Timeout</label>
                  <Select value={security.sessionTimeout} onValueChange={(v) => setSecurity((p) => ({ ...p, sessionTimeout: v }))}>
                    <SelectTrigger className="w-48 bg-[#1C1C1C] border-[#3F3F46] text-white text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#27272A]">
                      {['1h', '4h', '8h', '24h', '7d'].map((t) => <SelectItem key={t} value={t} className="text-sm text-[#A1A1AA]">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="frammer-card p-5 space-y-4">
                <p className="text-sm font-semibold text-white">Appearance</p>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#71717A]">Theme</label>
                  <div className="flex gap-2">
                    {['Dark (Default)', 'Dark Dimmed', 'High Contrast'].map((theme) => (
                      <button
                        key={theme}
                        className={cn('px-3 py-2 rounded-lg border text-xs transition-all', theme === 'Dark (Default)' ? 'border-frammer-red/40 bg-frammer-red/10 text-white' : 'border-[#27272A] text-[#52525B] hover:text-white')}
                      >
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#71717A]">Accent Color</label>
                  <div className="flex gap-2">
                    {['#E8212B', '#3B82F6', '#22C55E', '#F59E0B', '#8B5CF6'].map((color) => (
                      <button
                        key={color}
                        className={cn('w-7 h-7 rounded-full border-2 transition-transform hover:scale-110', color === '#E8212B' ? 'border-white' : 'border-transparent')}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
