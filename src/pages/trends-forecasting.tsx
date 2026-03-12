import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, TrendingDown } from 'lucide-react';
import { UsageTrendsContent } from '@/pages/usage-trends';
import { ForecastingContent } from '@/pages/forecasting';

const TrendsForecastingPage: React.FC = () => (
  <DashboardLayout title="Trends & Forecasting" subtitle="Volume trends, growth diagnostics and AI forecasting">
    <PageHeader
      title="Trends & Forecasting"
      subtitle="Upload, processing and publish volume trends with AI-powered metric forecasting"
    />

    <Tabs defaultValue="trends" className="mt-4">
      <TabsList className="bg-[#141414] border border-[#27272A] p-1 rounded-xl mb-6">
        <TabsTrigger value="trends" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Activity size={13} /> Usage Trends
        </TabsTrigger>
        <TabsTrigger value="forecasting" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <TrendingDown size={13} /> Forecasting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trends">
        <UsageTrendsContent />
      </TabsContent>
      <TabsContent value="forecasting">
        <ForecastingContent />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default TrendsForecastingPage;
