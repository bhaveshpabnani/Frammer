import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layers, MonitorSmartphone, Globe2, Grid3X3 } from 'lucide-react';
import { OutputTypesContent } from '@/pages/output-types';
import { PlatformAnalyticsContent } from '@/pages/platform-analytics';
import { LanguageAnalyticsContent } from '@/pages/language-analytics';
import { MultiDimensionalContent } from '@/pages/multi-dimensional';

const ContentDimensionsPage: React.FC = () => (
  <DashboardLayout title="Content Dimensions" subtitle="Output types, platforms, languages and multi-dimensional explorer">
    <PageHeader
      title="Content Dimensions"
      subtitle="Deep-dive into output types, platform analytics, language breakdown, and multi-dimensional exploration"
    />

    <Tabs defaultValue="output-types" className="mt-4">
      <TabsList className="bg-[#141414] border border-[#27272A] p-1 rounded-xl mb-6">
        <TabsTrigger value="output-types" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Layers size={13} /> Output Types
        </TabsTrigger>
        <TabsTrigger value="platforms" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <MonitorSmartphone size={13} /> Platforms
        </TabsTrigger>
        <TabsTrigger value="languages" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Globe2 size={13} /> Languages
        </TabsTrigger>
        <TabsTrigger value="explorer" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Grid3X3 size={13} /> Explorer
        </TabsTrigger>
      </TabsList>

      <TabsContent value="output-types">
        <OutputTypesContent />
      </TabsContent>
      <TabsContent value="platforms">
        <PlatformAnalyticsContent />
      </TabsContent>
      <TabsContent value="languages">
        <LanguageAnalyticsContent />
      </TabsContent>
      <TabsContent value="explorer">
        <MultiDimensionalContent />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default ContentDimensionsPage;
