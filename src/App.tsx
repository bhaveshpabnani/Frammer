import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterProvider } from '@/contexts/FilterContext';

import Overview from '@/pages/Index';
import ContentPerformance from '@/pages/content-performance';
import ChannelAnalytics from '@/pages/channel-analytics';
import OutputTypes from '@/pages/output-types';
import LanguageAnalytics from '@/pages/language-analytics';
import TeamProductivity from '@/pages/team-productivity';
import ClientPortal from '@/pages/client-portal';
import ProcessingInsights from '@/pages/processing-insights';
import VideoExplorer from '@/pages/videos';
import Datasets from '@/pages/datasets';
import Connectors from '@/pages/connectors';
import Metrics from '@/pages/metrics';
import Queries from '@/pages/queries';
import Dashboards from '@/pages/dashboards';
import DashboardBuilder from '@/pages/dashboard-builder';
import AIAnalytics from '@/pages/ai-analytics';
import Quality from '@/pages/quality';
import Reports from '@/pages/reports';
import Forecasting from '@/pages/forecasting';
import SettingsPage from '@/pages/settings';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FilterProvider>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/content-performance" element={<ContentPerformance />} />
            <Route path="/channel-analytics" element={<ChannelAnalytics />} />
            <Route path="/output-types" element={<OutputTypes />} />
            <Route path="/language-analytics" element={<LanguageAnalytics />} />
            <Route path="/team-productivity" element={<TeamProductivity />} />
            <Route path="/client-portal" element={<ClientPortal />} />
            <Route path="/processing-insights" element={<ProcessingInsights />} />
            <Route path="/videos" element={<VideoExplorer />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/connectors" element={<Connectors />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/queries" element={<Queries />} />
            <Route path="/dashboards" element={<Dashboards />} />
            <Route path="/dashboards/builder" element={<DashboardBuilder />} />
            <Route path="/ai" element={<AIAnalytics />} />
            <Route path="/quality" element={<Quality />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FilterProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
