import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Bell, ShieldAlert, Plus, Pencil, Trash2, Clock, CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useSubscriptions, useCreateSubscription, useUpdateSubscription, useDeleteSubscription,
  useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule,
  useDeliveryLogs,
} from '@/hooks/useApi';
import type {
  DigestType, Frequency, SubscriptionResponse,
  AlertRuleType, ComparisonOperator, AlertRuleResponse,
} from '@/api/types';

// ── Static data ────────────────────────────────────────────────────────────────

const REPORT_TYPES: { value: DigestType; label: string }[] = [
  { value: 'leadership', label: 'Leadership Digest' },
  { value: 'ops', label: 'Ops Digest' },
  { value: 'dq', label: 'DQ Digest' },
  { value: 'client_health', label: 'Client Health' },
];

const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const RULE_TYPES: { value: AlertRuleType; label: string }[] = [
  { value: 'publish_conversion_drop', label: 'Publish Conversion Drop' },
  { value: 'gap_too_high', label: 'Processed → Published Gap' },
  { value: 'backlog_high', label: 'Backlog High' },
  { value: 'dq_low', label: 'DQ Score Low' },
  { value: 'missing_metadata_spike', label: 'Missing Metadata Spike' },
];

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: 'lt', label: '< less than' },
  { value: 'gt', label: '> greater than' },
  { value: 'lte', label: '≤ less or equal' },
  { value: 'gte', label: '≥ greater or equal' },
];

type Tab = 'subscriptions' | 'alerts' | 'history';

const NAV: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'subscriptions', label: 'Subscriptions', icon: <Bell size={14} /> },
  { key: 'alerts', label: 'Alert Rules', icon: <ShieldAlert size={14} /> },
  { key: 'history', label: 'Delivery History', icon: <Clock size={14} /> },
];

// ── Subscriptions tab ─────────────────────────────────────────────────────────

type SubForm = { name: string; report_type: DigestType; recipients: string; frequency: Frequency };
const emptySubForm: SubForm = { name: '', report_type: 'leadership', recipients: '', frequency: 'weekly' };

const SubscriptionsTab: React.FC = () => {
  const [panel, setPanel] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SubForm>(emptySubForm);

  const { data: subs = [], isLoading } = useSubscriptions();
  const createMut = useCreateSubscription();
  const updateMut = useUpdateSubscription();
  const deleteMut = useDeleteSubscription();

  const openCreate = () => { setForm(emptySubForm); setEditingId(null); setPanel('form'); };
  const openEdit = (s: SubscriptionResponse) => {
    setForm({ name: s.name, report_type: s.report_type, recipients: s.recipients.join(', '), frequency: s.frequency });
    setEditingId(s.id); setPanel('form');
  };
  const handleToggle = (s: SubscriptionResponse) =>
    updateMut.mutate({ id: s.id, body: { is_enabled: !s.is_enabled } });
  const handleSave = () => {
    const emails = form.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    if (!form.name || !emails.length) return;
    if (editingId) {
      updateMut.mutate({ id: editingId, body: { name: form.name, recipients: emails, frequency: form.frequency } }, { onSuccess: () => setPanel('list') });
    } else {
      createMut.mutate({ name: form.name, report_type: form.report_type, recipients: emails, frequency: form.frequency }, { onSuccess: () => setPanel('list') });
    }
  };
  const isSaving = createMut.isPending || updateMut.isPending;

  if (panel === 'form') return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => setPanel('list')}>
          <ChevronLeft size={16} />
        </Button>
        <h2 className="text-base font-semibold text-white">{editingId ? 'Edit Subscription' : 'New Subscription'}</h2>
      </div>
      <div>
        <Label className="text-[#A1A1AA] text-xs">Name</Label>
        <Input className="bg-[#0a0a0a] border-[#27272A] text-white mt-1" placeholder="Weekly Leadership Report" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      {!editingId && (
        <div>
          <Label className="text-[#A1A1AA] text-xs">Report Type</Label>
          <Select value={form.report_type} onValueChange={(v) => setForm((f) => ({ ...f, report_type: v as DigestType }))}>
            <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
              {REPORT_TYPES.map((o) => <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label className="text-[#A1A1AA] text-xs">Frequency</Label>
        <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as Frequency }))}>
          <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
            {FREQUENCIES.map((o) => <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-[#A1A1AA] text-xs">Recipients (comma-separated)</Label>
        <Input className="bg-[#0a0a0a] border-[#27272A] text-white mt-1" placeholder="user@example.com, team@example.com" value={form.recipients} onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="border-[#27272A] text-[#A1A1AA]" onClick={() => setPanel('list')}>Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#e8212b] hover:bg-[#c41c25]">
          {isSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#71717A]">Recurring digest emails sent on a schedule.</p>
        <Button onClick={openCreate} className="bg-[#e8212b] hover:bg-[#c41c25] gap-2 h-8 text-sm">
          <Plus size={14} /> New Subscription
        </Button>
      </div>
      {isLoading && <p className="text-[#71717A] text-sm">Loading…</p>}
      {!isLoading && subs.length === 0 && (
        <div className="text-center py-16 text-[#52525B]">
          <Bell size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No subscriptions yet. Create one to start receiving digest emails.</p>
        </div>
      )}
      <div className="space-y-2">
        {subs.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4 rounded-xl border border-[#1C1C1C] bg-[#0a0a0a]">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-medium text-white">{s.name}</p>
              <p className="text-xs text-[#71717A] mt-0.5">
                {REPORT_TYPES.find((t) => t.value === s.report_type)?.label ?? s.report_type}
                {' · '}
                {FREQUENCIES.find((f) => f.value === s.frequency)?.label ?? s.frequency}
                {' · '}
                {s.recipients.length} recipient{s.recipients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Switch checked={s.is_enabled} onCheckedChange={() => handleToggle(s)} className="data-[state=checked]:bg-[#e8212b]" />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => openEdit(s)}><Pencil size={14} /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-red-400" onClick={() => deleteMut.mutate(s.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Alert Rules tab ───────────────────────────────────────────────────────────

type AlertForm = { name: string; rule_type: AlertRuleType; threshold_value: string; comparison_operator: ComparisonOperator; recipients: string; cooldown_minutes: string };
const emptyAlertForm: AlertForm = { name: '', rule_type: 'backlog_high', threshold_value: '', comparison_operator: 'gt', recipients: '', cooldown_minutes: '360' };

const AlertRulesTab: React.FC = () => {
  const [panel, setPanel] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AlertForm>(emptyAlertForm);

  const { data: rules = [], isLoading } = useAlertRules();
  const createMut = useCreateAlertRule();
  const updateMut = useUpdateAlertRule();
  const deleteMut = useDeleteAlertRule();

  const openCreate = () => { setForm(emptyAlertForm); setEditingId(null); setPanel('form'); };
  const openEdit = (r: AlertRuleResponse) => {
    setForm({ name: r.name, rule_type: r.rule_type, threshold_value: String(r.threshold_value), comparison_operator: r.comparison_operator, recipients: r.recipients.join(', '), cooldown_minutes: String(r.cooldown_minutes) });
    setEditingId(r.id); setPanel('form');
  };
  const handleToggle = (r: AlertRuleResponse) =>
    updateMut.mutate({ id: r.id, body: { is_enabled: !r.is_enabled } });
  const handleSave = () => {
    const emails = form.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    const threshold = parseFloat(form.threshold_value);
    if (!form.name || !emails.length || isNaN(threshold)) return;
    if (editingId) {
      updateMut.mutate({ id: editingId, body: { name: form.name, threshold_value: threshold, comparison_operator: form.comparison_operator, recipients: emails, cooldown_minutes: parseInt(form.cooldown_minutes) || 360 } }, { onSuccess: () => setPanel('list') });
    } else {
      createMut.mutate({ name: form.name, rule_type: form.rule_type, threshold_value: threshold, comparison_operator: form.comparison_operator, recipients: emails, cooldown_minutes: parseInt(form.cooldown_minutes) || 360 }, { onSuccess: () => setPanel('list') });
    }
  };
  const isSaving = createMut.isPending || updateMut.isPending;

  if (panel === 'form') return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => setPanel('list')}>
          <ChevronLeft size={16} />
        </Button>
        <h2 className="text-base font-semibold text-white">{editingId ? 'Edit Alert Rule' : 'New Alert Rule'}</h2>
      </div>
      <div>
        <Label className="text-[#A1A1AA] text-xs">Name</Label>
        <Input className="bg-[#0a0a0a] border-[#27272A] text-white mt-1" placeholder="High backlog alert" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      {!editingId && (
        <div>
          <Label className="text-[#A1A1AA] text-xs">Rule Type</Label>
          <Select value={form.rule_type} onValueChange={(v) => setForm((f) => ({ ...f, rule_type: v as AlertRuleType }))}>
            <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
              {RULE_TYPES.map((o) => <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[#A1A1AA] text-xs">Operator</Label>
          <Select value={form.comparison_operator} onValueChange={(v) => setForm((f) => ({ ...f, comparison_operator: v as ComparisonOperator }))}>
            <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
              {OPERATORS.map((o) => <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[#A1A1AA] text-xs">Threshold</Label>
          <Input type="number" className="bg-[#0a0a0a] border-[#27272A] text-white mt-1" placeholder="50" value={form.threshold_value} onChange={(e) => setForm((f) => ({ ...f, threshold_value: e.target.value }))} />
        </div>
      </div>
      <div>
        <Label className="text-[#A1A1AA] text-xs">Cooldown (minutes)</Label>
        <Input type="number" className="bg-[#0a0a0a] border-[#27272A] text-white mt-1" placeholder="360" value={form.cooldown_minutes} onChange={(e) => setForm((f) => ({ ...f, cooldown_minutes: e.target.value }))} />
      </div>
      <div>
        <Label className="text-[#A1A1AA] text-xs">Recipients (comma-separated)</Label>
        <Input className="bg-[#0a0a0a] border-[#27272A] text-white mt-1" placeholder="user@example.com" value={form.recipients} onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="border-[#27272A] text-[#A1A1AA]" onClick={() => setPanel('list')}>Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#e8212b] hover:bg-[#c41c25]">
          {isSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#71717A]">Trigger email alerts when metrics cross thresholds.</p>
        <Button onClick={openCreate} className="bg-[#e8212b] hover:bg-[#c41c25] gap-2 h-8 text-sm">
          <Plus size={14} /> New Alert Rule
        </Button>
      </div>
      {isLoading && <p className="text-[#71717A] text-sm">Loading…</p>}
      {!isLoading && rules.length === 0 && (
        <div className="text-center py-16 text-[#52525B]">
          <ShieldAlert size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No alert rules configured. Create one to get notified when metrics go out of range.</p>
        </div>
      )}
      <div className="space-y-2">
        {rules.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border border-[#1C1C1C] bg-[#0a0a0a]">
            <div className="flex-1 min-w-0 mr-4">
              <p className="text-sm font-medium text-white">{r.name}</p>
              <p className="text-xs text-[#71717A] mt-0.5">
                {RULE_TYPES.find((t) => t.value === r.rule_type)?.label ?? r.rule_type}
                {' · '}
                {OPERATORS.find((o) => o.value === r.comparison_operator)?.label ?? r.comparison_operator}
                {' '}
                {r.threshold_value}
                {' · '}
                cooldown {r.cooldown_minutes}m
                {' · '}
                {r.recipients.length} recipient{r.recipients.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Switch checked={r.is_enabled} onCheckedChange={() => handleToggle(r)} className="data-[state=checked]:bg-[#e8212b]" />
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-red-400" onClick={() => deleteMut.mutate(r.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Delivery History tab ──────────────────────────────────────────────────────

const HistoryTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDeliveryLogs(page, 20);

  return (
    <div>
      <p className="text-sm text-[#71717A] mb-4">Log of all email sends — digests and alerts.</p>
      {isLoading && <p className="text-[#71717A] text-sm">Loading…</p>}
      {!isLoading && !data?.items.length && (
        <div className="text-center py-16 text-[#52525B]">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No delivery history yet.</p>
        </div>
      )}
      <div className="space-y-2">
        {data?.items.map((log) => (
          <div key={log.id} className="flex items-center justify-between p-4 rounded-xl border border-[#1C1C1C] bg-[#0a0a0a]">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {log.status === 'sent'
                ? <CheckCircle2 size={16} className="text-green-400 shrink-0" />
                : <XCircle size={16} className="text-red-400 shrink-0" />}
              <div className="min-w-0">
                <p className="text-sm font-medium text-white capitalize">{log.report_type.replace('_', ' ')}</p>
                {log.error_text && <p className="text-xs text-red-400 truncate">{log.error_text}</p>}
              </div>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-xs text-[#71717A]">{new Date(log.created_at * 1000).toLocaleString()}</p>
              <p className="text-[10px] text-[#52525B]">
                {JSON.parse(log.recipients_json || '[]').join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" className="border-[#27272A] text-[#A1A1AA]" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-xs text-[#71717A]">{page} / {data.total_pages}</span>
          <Button variant="outline" size="sm" className="border-[#27272A] text-[#A1A1AA]" disabled={page >= data.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

const NotificationsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('subscriptions');

  return (
    <DashboardLayout title="Email Notifications" subtitle="Manage subscriptions, alert rules, and delivery history">
      <PageHeader title="Email Notifications" subtitle="Configure digest subscriptions, threshold alerts, and review delivery history" />

      <div className="flex gap-6">
        {/* Left nav */}
        <aside className="w-44 shrink-0">
          <nav className="space-y-1">
            {NAV.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-left',
                  tab === item.key
                    ? 'bg-frammer-red/15 text-white border border-frammer-red/30'
                    : 'text-[#A1A1AA] hover:text-white hover:bg-white/5 border border-transparent',
                )}
              >
                <span className={cn('shrink-0', tab === item.key ? 'text-[#e8212b]' : 'text-[#52525B]')}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0 bg-[#0a0a0a] border border-[#1C1C1C] rounded-2xl p-6">
          {tab === 'subscriptions' && <SubscriptionsTab />}
          {tab === 'alerts' && <AlertRulesTab />}
          {tab === 'history' && <HistoryTab />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
