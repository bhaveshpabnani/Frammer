import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterProvider } from '@/contexts/FilterContext';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

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
import UsageTrends from '@/pages/usage-trends';
import MultiDimensional from '@/pages/multi-dimensional';
// client-performance merged into client-portal

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FilterProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected */}
              <Route path="/" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
              <Route path="/content-performance" element={<ProtectedRoute><ContentPerformance /></ProtectedRoute>} />
              <Route path="/channel-analytics" element={<ProtectedRoute><ChannelAnalytics /></ProtectedRoute>} />
              <Route path="/output-types" element={<ProtectedRoute><OutputTypes /></ProtectedRoute>} />
              <Route path="/language-analytics" element={<ProtectedRoute><LanguageAnalytics /></ProtectedRoute>} />
              <Route path="/team-productivity" element={<ProtectedRoute><TeamProductivity /></ProtectedRoute>} />
              <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
              <Route path="/processing-insights" element={<ProtectedRoute><ProcessingInsights /></ProtectedRoute>} />
              <Route path="/videos" element={<ProtectedRoute><VideoExplorer /></ProtectedRoute>} />
              <Route path="/datasets" element={<ProtectedRoute><Datasets /></ProtectedRoute>} />
              <Route path="/connectors" element={<ProtectedRoute><Connectors /></ProtectedRoute>} />
              <Route path="/metrics" element={<ProtectedRoute><Metrics /></ProtectedRoute>} />
              <Route path="/queries" element={<ProtectedRoute><Queries /></ProtectedRoute>} />
              <Route path="/dashboards" element={<ProtectedRoute><Dashboards /></ProtectedRoute>} />
              <Route path="/dashboards/builder" element={<ProtectedRoute><DashboardBuilder /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><AIAnalytics /></ProtectedRoute>} />
              <Route path="/quality" element={<ProtectedRoute><Quality /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/forecasting" element={<ProtectedRoute><Forecasting /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/usage-trends" element={<ProtectedRoute><UsageTrends /></ProtectedRoute>} />
              <Route path="/multi-dimensional" element={<ProtectedRoute><MultiDimensional /></ProtectedRoute>} />
              {/* /client-performance removed — merged into /client-portal */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </FilterProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
