import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, DollarSign } from 'lucide-react';
import { ContentPerformanceContent } from '@/pages/content-performance';
import { BillableAnalyticsContent } from '@/pages/billable-analytics';

const ContentFunnelPage: React.FC = () => (
  <DashboardLayout title="Content & Funnel" subtitle="Content pipeline and billable analysis">
    <PageHeader
      title="Content & Funnel"
      subtitle="Content pipeline funnel, input/output type breakdown, and billable vs non-billable analysis"
    />

    <Tabs defaultValue="content" className="mt-4">
      <TabsList className="bg-[#141414] border border-[#27272A] p-1 rounded-xl mb-6">
        <TabsTrigger value="content" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Play size={13} /> Content Pipeline
        </TabsTrigger>
        <TabsTrigger value="billable" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <DollarSign size={13} /> Billable Analysis
        </TabsTrigger>
      </TabsList>

      <TabsContent value="content">
        <ContentPerformanceContent />
      </TabsContent>
      <TabsContent value="billable">
        <BillableAnalyticsContent />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default ContentFunnelPage;
