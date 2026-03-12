import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cpu, ShieldCheck } from 'lucide-react';
import { ProcessingInsightsContent } from '@/pages/processing-insights';
import { QualityContent } from '@/pages/quality';

const OperationsQualityPage: React.FC = () => (
  <DashboardLayout title="Operations & Quality" subtitle="Processing pipeline and data quality diagnostics">
    <PageHeader
      title="Operations & Quality"
      subtitle="Pipeline throughput, processing lag, SLA monitoring, and comprehensive data quality analysis"
    />

    <Tabs defaultValue="processing" className="mt-4">
      <TabsList className="bg-[#141414] border border-[#27272A] p-1 rounded-xl mb-6">
        <TabsTrigger value="processing" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Cpu size={13} /> Processing
        </TabsTrigger>
        <TabsTrigger value="quality" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <ShieldCheck size={13} /> Data Quality
        </TabsTrigger>
      </TabsList>

      <TabsContent value="processing">
        <ProcessingInsightsContent />
      </TabsContent>
      <TabsContent value="quality">
        <QualityContent />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default OperationsQualityPage;
