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
import { ShieldAlert, Plus, Trash2, Pencil } from 'lucide-react';
import {
  useAlertRules, useCreateAlertRule, useUpdateAlertRule, useDeleteAlertRule,
} from '@/hooks/useApi';
import type { AlertRuleType, ComparisonOperator, AlertRuleResponse } from '@/api/types';

const RULE_TYPES: { value: AlertRuleType; label: string }[] = [
  { value: 'publish_conversion_drop', label: 'Publish Conversion Drop' },
  { value: 'processed_published_gap', label: 'Processed → Published Gap' },
  { value: 'backlog_high', label: 'Backlog High' },
  { value: 'dq_score_low', label: 'DQ Score Low' },
  { value: 'missing_metadata_spike', label: 'Missing Metadata Spike' },
];

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: 'lt', label: '< (less than)' },
  { value: 'gt', label: '> (greater than)' },
  { value: 'lte', label: '≤ (less or equal)' },
  { value: 'gte', label: '≥ (greater or equal)' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = {
  name: string;
  rule_type: AlertRuleType;
  threshold_value: string;
  comparison_operator: ComparisonOperator;
  recipients: string;
  cooldown_minutes: string;
};

const emptyForm: FormState = {
  name: '',
  rule_type: 'publish_conversion_drop',
  threshold_value: '',
  comparison_operator: 'lt',
  recipients: '',
  cooldown_minutes: '360',
};

export const AlertRuleModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: rules = [], isLoading } = useAlertRules();
  const createMut = useCreateAlertRule();
  const updateMut = useUpdateAlertRule();
  const deleteMut = useDeleteAlertRule();

  useEffect(() => {
    if (open) { setView('list'); setEditingId(null); setForm(emptyForm); }
  }, [open]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setView('form');
  };

  const openEdit = (rule: AlertRuleResponse) => {
    setForm({
      name: rule.name,
      rule_type: rule.rule_type,
      threshold_value: String(rule.threshold_value),
      comparison_operator: rule.comparison_operator,
      recipients: rule.recipients.join(', '),
      cooldown_minutes: String(rule.cooldown_minutes),
    });
    setEditingId(rule.id);
    setView('form');
  };

  const handleSave = () => {
    const emails = form.recipients.split(',').map((e) => e.trim()).filter(Boolean);
    const threshold = parseFloat(form.threshold_value);
    if (!form.name || emails.length === 0 || isNaN(threshold)) return;

    if (editingId) {
      updateMut.mutate(
        {
          id: editingId,
          body: {
            name: form.name,
            threshold_value: threshold,
            comparison_operator: form.comparison_operator,
            recipients: emails,
            cooldown_minutes: parseInt(form.cooldown_minutes) || 360,
          },
        },
        { onSuccess: () => setView('list') },
      );
    } else {
      createMut.mutate(
        {
          name: form.name,
          rule_type: form.rule_type,
          threshold_value: threshold,
          comparison_operator: form.comparison_operator,
          recipients: emails,
          cooldown_minutes: parseInt(form.cooldown_minutes) || 360,
        },
        { onSuccess: () => setView('list') },
      );
    }
  };

  const handleToggle = (rule: AlertRuleResponse) => {
    updateMut.mutate({ id: rule.id, body: { is_enabled: !rule.is_enabled } });
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#1C1C1C] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <ShieldAlert className="h-5 w-5" /> Alert Rules
          </DialogTitle>
        </DialogHeader>

        {view === 'list' ? (
          <>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {isLoading && <p className="text-[#71717A] text-sm">Loading…</p>}
              {!isLoading && rules.length === 0 && (
                <p className="text-[#71717A] text-sm text-center py-6">No alert rules configured</p>
              )}
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-[#1C1C1C] bg-[#0a0a0a]"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-medium text-white truncate">{rule.name}</p>
                    <p className="text-[10px] text-[#71717A]">
                      {RULE_TYPES.find((t) => t.value === rule.rule_type)?.label ?? rule.rule_type}
                      {' · '}
                      {OPERATORS.find((o) => o.value === rule.comparison_operator)?.label.charAt(0) ?? rule.comparison_operator}
                      {' '}{rule.threshold_value}
                      {' · '}{rule.recipients.length} recipient(s)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rule.is_enabled}
                      onCheckedChange={() => handleToggle(rule)}
                      className="data-[state=checked]:bg-[#e8212b]"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-white" onClick={() => openEdit(rule)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[#71717A] hover:text-red-400" onClick={() => deleteMut.mutate(rule.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={openCreate} className="bg-[#e8212b] hover:bg-[#c41c25] gap-2">
                <Plus className="h-4 w-4" /> New Alert Rule
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
                  placeholder="Publish rate below 50%"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              {!editingId && (
                <div>
                  <Label className="text-[#A1A1AA] text-xs">Rule Type</Label>
                  <Select value={form.rule_type} onValueChange={(v) => setForm((f) => ({ ...f, rule_type: v as AlertRuleType }))}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
                      {RULE_TYPES.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[#A1A1AA] text-xs">Operator</Label>
                  <Select value={form.comparison_operator} onValueChange={(v) => setForm((f) => ({ ...f, comparison_operator: v as ComparisonOperator }))}>
                    <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
                      {OPERATORS.map((o) => (
                        <SelectItem key={o.value} value={o.value} className="text-white">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#A1A1AA] text-xs">Threshold</Label>
                  <Input
                    type="number"
                    className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                    placeholder="50"
                    value={form.threshold_value}
                    onChange={(e) => setForm((f) => ({ ...f, threshold_value: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs">Cooldown (minutes)</Label>
                <Input
                  type="number"
                  className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                  placeholder="360"
                  value={form.cooldown_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, cooldown_minutes: e.target.value }))}
                />
              </div>
              <div>
                <Label className="text-[#A1A1AA] text-xs">Recipients (comma-separated)</Label>
                <Input
                  className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                  placeholder="user@example.com"
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
