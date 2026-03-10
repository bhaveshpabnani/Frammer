import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Bell, Plus, Trash2, Pencil, History } from 'lucide-react';
import {
  useSubscriptions, useCreateSubscription, useUpdateSubscription, useDeleteSubscription, useDeliveryLogs,
} from '@/hooks/useApi';
import type { DigestType, Frequency, SubscriptionResponse } from '@/api/types';

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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = {
  name: string;
  report_type: DigestType;
  recipients: string;
  frequency: Frequency;
};

const emptyForm: FormState = {
  name: '',
  report_type: 'leadership',
  recipients: '',
  frequency: 'weekly',
};

export const SubscriptionModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [view, setView] = useState<'list' | 'form' | 'history'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historySubId, setHistorySubId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const createMut = useCreateSubscription();
  const updateMut = useUpdateSubscription();
  const deleteMut = useDeleteSubscription();

  const { data: historyData, isLoading: historyLoading } = useDeliveryLogs(1, 10, historySubId ?? undefined);

  useEffect(() => {
    if (open) { setView('list'); setEditingId(null); setHistorySubId(null); setForm(emptyForm); }
  }, [open]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setView('form');
  };

  const openEdit = (sub: SubscriptionResponse) => {
    setForm({
      name: sub.name,
      report_type: sub.report_type,
      recipients: sub.recipients.join(', '),
      frequency: sub.frequency,
    });
    setEditingId(sub.id);
    setView('form');
  };

  const handleSave = () => {
    const emails = form.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    if (!form.name || emails.length === 0) return;

    if (editingId) {
      updateMut.mutate(
        { id: editingId, body: { name: form.name, recipients: emails, frequency: form.frequency } },
        { onSuccess: () => setView('list') },
      );
    } else {
      createMut.mutate(
        { name: form.name, report_type: form.report_type, recipients: emails, frequency: form.frequency },
        { onSuccess: () => setView('list') },
      );
    }
  };

  const handleToggle = (sub: SubscriptionResponse) => {
    updateMut.mutate({ id: sub.id, body: { is_enabled: !sub.is_enabled } });
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#1C1C1C] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Bell className="h-5 w-5" /> Email Subscriptions
          </DialogTitle>
        </DialogHeader>

        {view === 'list' ? (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {isLoading && <p className="text-[#71717A] text-sm">Loading…</p>}
              {!isLoading && subscriptions.length === 0 && (
                <p className="text-[#71717A] text-sm text-center py-6">No subscriptions yet</p>
              )}
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#1C1C1C] bg-[#0a0a0a]"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-white truncate">{sub.name}</p>
                    <p className="text-[10px] text-[#71717A]">
                      {sub.report_type} · {sub.frequency} · {sub.recipients.length} recipient(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={sub.is_enabled}
                      onCheckedChange={() => handleToggle(sub)}
                      className="data-[state=checked]:bg-[#e8212b]"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => { setHistorySubId(sub.id); setView('history'); }}>
                      <History className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => openEdit(sub)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-red-400" onClick={() => deleteMut.mutate(sub.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={openCreate} className="bg-[#e8212b] hover:bg-[#c41c25] gap-2">
                <Plus className="h-4 w-4" /> New Subscription
              </Button>
            </DialogFooter>
          </>
        ) : view === 'history' ? (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {historyLoading && <p className="text-[#71717A] text-sm">Loading…</p>}
              {!historyLoading && (!historyData?.items.length) && (
                <p className="text-[#71717A] text-sm text-center py-6">No delivery history yet</p>
              )}
              {historyData?.items.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-[#1C1C1C] bg-[#0a0a0a]">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-white truncate">{log.report_type}</p>
                    <p className="text-[10px] text-[#71717A]">{new Date(log.created_at * 1000).toLocaleString()}</p>
                    {log.error_text && <p className="text-[10px] text-red-400 truncate">{log.error_text}</p>}
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    log.status === 'sent' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>{log.status}</span>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-[#27272A] text-[#A1A1AA]" onClick={() => setView('list')}>
                Back
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <Label className="text-[#A1A1AA] text-xs">Name</Label>
                <Input
                  className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                  placeholder="Weekly Leadership Report"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              {!editingId && (
                <div>
                  <Label className="text-[#A1A1AA] text-xs">Report Type</Label>
                  <Select value={form.report_type} onValueChange={(v) => setForm((f) => ({ ...f, report_type: v as DigestType }))}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
                      {REPORT_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-[#A1A1AA] text-xs">Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as Frequency }))}>
                  <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
                    {FREQUENCIES.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs">Recipients (comma-separated)</Label>
                <Input
                  className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                  placeholder="user@example.com, team@example.com"
                  value={form.recipients}
                  onChange={(e) => setForm((f) => ({ ...f, recipients: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" className="border-[#27272A] text-[#A1A1AA]" onClick={() => setView('list')}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-[#e8212b] hover:bg-[#c41c25]">
                {isSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
