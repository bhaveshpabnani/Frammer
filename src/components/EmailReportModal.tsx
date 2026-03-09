import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useSendReport, useSendTestEmail } from '@/hooks/useApi';
import { useFilters } from '@/contexts/FilterContext';
import type { DigestType } from '@/api/types';

const DIGEST_OPTIONS: { value: DigestType; label: string }[] = [
  { value: 'leadership', label: 'Leadership Digest' },
  { value: 'ops', label: 'Ops Digest' },
  { value: 'dq', label: 'Data Quality Digest' },
  { value: 'client_health', label: 'Client Health Digest' },
  { value: 'manual_report', label: 'Manual Report (current filters)' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EmailReportModal: React.FC<Props> = ({ open, onOpenChange }) => {
  const [recipients, setRecipients] = useState('');
  const [reportType, setReportType] = useState<DigestType>('leadership');
  const [subject, setSubject] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [mode, setMode] = useState<'send' | 'test'>('send');

  const { filters } = useFilters();
  const sendMutation = useSendReport();
  const testMutation = useSendTestEmail();

  const handleSend = () => {
    const emails = recipients.split(',').map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    sendMutation.mutate(
      {
        report_type: reportType,
        recipients: emails,
        filters: reportType === 'manual_report' ? (filters as unknown as Record<string, unknown>) : null,
        subject: subject || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      },
    );
  };

  const handleTest = () => {
    if (!testEmail.trim()) return;
    testMutation.mutate({ recipient: testEmail.trim() }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setRecipients('');
    setSubject('');
    setTestEmail('');
  };

  const isLoading = sendMutation.isPending || testMutation.isPending;
  const error = sendMutation.error || testMutation.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#1C1C1C] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Mail className="h-5 w-5" /> Send Email Report
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={mode === 'send' ? 'default' : 'outline'}
            onClick={() => setMode('send')}
            className={mode === 'send' ? 'bg-[#e8212b]' : 'bg-transparent border-[#27272A] text-[#A1A1AA]'}
          >
            Send Report
          </Button>
          <Button
            size="sm"
            variant={mode === 'test' ? 'default' : 'outline'}
            onClick={() => setMode('test')}
            className={mode === 'test' ? 'bg-[#e8212b]' : 'bg-transparent border-[#27272A] text-[#A1A1AA]'}
          >
            Test Email
          </Button>
        </div>

        {mode === 'send' ? (
          <div className="space-y-4">
            <div>
              <Label className="text-[#A1A1AA] text-xs">Report Type</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as DigestType)}>
                <SelectTrigger className="bg-[#0a0a0a] border-[#27272A] text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1C1C1C] border-[#27272A]">
                  {DIGEST_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="text-white">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#A1A1AA] text-xs">Recipients (comma-separated)</Label>
              <Input
                className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                placeholder="user@example.com, team@example.com"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[#A1A1AA] text-xs">Subject (optional)</Label>
              <Input
                className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
                placeholder="Auto-generated if blank"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-[#A1A1AA] text-xs">Test Recipient</Label>
            <Input
              className="bg-[#0a0a0a] border-[#27272A] text-white mt-1"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{(error as Error).message}</span>
          </div>
        )}

        {(sendMutation.isSuccess || testMutation.isSuccess) && (
          <div className="flex items-center gap-2 text-green-400 text-xs mt-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Email sent successfully</span>
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={mode === 'send' ? handleSend : handleTest}
            disabled={isLoading}
            className="bg-[#e8212b] hover:bg-[#c41c25] gap-2"
          >
            <Send className="h-4 w-4" />
            {isLoading ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
