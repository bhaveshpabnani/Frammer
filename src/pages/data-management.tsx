import React from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Plug, Calculator } from 'lucide-react';
import { DatasetsContent } from '@/pages/datasets';
import { ConnectorsContent } from '@/pages/connectors';
import { MetricsContent } from '@/pages/metrics';

const DataManagementPage: React.FC = () => (
  <DashboardLayout title="Data Management" subtitle="Datasets, connectors and metric definitions">
    <PageHeader
      title="Data Management"
      subtitle="Upload datasets, manage data connectors, and define reusable business metrics"
    />

    <Tabs defaultValue="datasets" className="mt-4">
      <TabsList className="bg-[#141414] border border-[#27272A] p-1 rounded-xl mb-6">
        <TabsTrigger value="datasets" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Database size={13} /> Datasets
        </TabsTrigger>
        <TabsTrigger value="connectors" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Plug size={13} /> Connectors
        </TabsTrigger>
        <TabsTrigger value="metrics" className="data-[state=active]:bg-[#27272A] data-[state=active]:text-white text-[#71717A] text-xs gap-1.5 rounded-lg px-4 py-2">
          <Calculator size={13} /> Metrics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="datasets">
        <DatasetsContent />
      </TabsContent>
      <TabsContent value="connectors">
        <ConnectorsContent />
      </TabsContent>
      <TabsContent value="metrics">
        <MetricsContent />
      </TabsContent>
    </Tabs>
  </DashboardLayout>
);

export default DataManagementPage;
