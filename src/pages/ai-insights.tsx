import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, ShieldCheck } from 'lucide-react';
import { InsightsContent } from '@/pages/insights';
import { ScorecardsContent } from '@/pages/scorecards';

const AIInsightsPage: React.FC = () => (
  <DashboardLayout title="AI Insights" subtitle="LLM-powered insights and health scorecards">
    <PageHeader
      title="AI Insights & Scorecards"
      subtitle="Executive summary, anomaly detection, waterfall analysis, and dimension health scores"
    />

    <Tabs defaultValue="insights" className="mt-4">
      <TabsList className="bg-[#141414] border border-[#27272A] p-1 rounded-xl mb-6">
        <TabsTrigger value="insights" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Brain size={13} /> AI Insights
        </TabsTrigger>
        <TabsTrigger value="scorecards" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <ShieldCheck size={13} /> Scorecards
        </TabsTrigger>
      </TabsList>

      <TabsContent value="insights">
        <InsightsContent />
      </TabsContent>
      <TabsContent value="scorecards">
        <ScorecardsContent />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default AIInsightsPage;
