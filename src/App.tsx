import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FilterProvider } from '@/contexts/FilterContext';
import { AuthProvider } from '@/contexts/AuthContext';
import LoginPage from '@/components/auth/LoginPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

import Overview from '@/pages/Index';
import ChannelAnalytics from '@/pages/channel-analytics';
import TeamProductivity from '@/pages/team-productivity';
import ClientPortal from '@/pages/client-portal';
import VideoExplorer from '@/pages/videos';
import Queries from '@/pages/queries';
import Dashboards from '@/pages/dashboards';
import DashboardBuilder from '@/pages/dashboard-builder';
import AIAnalytics from '@/pages/ai-analytics';
import Reports from '@/pages/reports';
import SettingsPage from '@/pages/settings';
import NotFound from '@/pages/NotFound';
import NotificationsPage from '@/pages/notifications';

// Merged pages
import ContentDimensionsPage from '@/pages/content-dimensions';
import AIInsightsPage from '@/pages/ai-insights';
import OperationsQualityPage from '@/pages/operations-quality';
import TrendsForecastingPage from '@/pages/trends-forecasting';
import ContentFunnelPage from '@/pages/content-funnel';
import DataManagementPage from '@/pages/data-management';

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
              <Route path="/channel-analytics" element={<ProtectedRoute><ChannelAnalytics /></ProtectedRoute>} />
              <Route path="/team-productivity" element={<ProtectedRoute><TeamProductivity /></ProtectedRoute>} />
              <Route path="/client-portal" element={<ProtectedRoute><ClientPortal /></ProtectedRoute>} />
              <Route path="/videos" element={<ProtectedRoute><VideoExplorer /></ProtectedRoute>} />
              <Route path="/queries" element={<ProtectedRoute><Queries /></ProtectedRoute>} />
              <Route path="/dashboards" element={<ProtectedRoute><Dashboards /></ProtectedRoute>} />
              <Route path="/dashboards/builder" element={<ProtectedRoute><DashboardBuilder /></ProtectedRoute>} />
              <Route path="/ai" element={<ProtectedRoute><AIAnalytics /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

              {/* Merged pages */}
              <Route path="/content-dimensions" element={<ProtectedRoute><ContentDimensionsPage /></ProtectedRoute>} />
              <Route path="/ai-insights" element={<ProtectedRoute><AIInsightsPage /></ProtectedRoute>} />
              <Route path="/operations-quality" element={<ProtectedRoute><OperationsQualityPage /></ProtectedRoute>} />
              <Route path="/trends-forecasting" element={<ProtectedRoute><TrendsForecastingPage /></ProtectedRoute>} />
              <Route path="/content-funnel" element={<ProtectedRoute><ContentFunnelPage /></ProtectedRoute>} />
              <Route path="/data-management" element={<ProtectedRoute><DataManagementPage /></ProtectedRoute>} />

              {/* Redirects from old routes to merged pages */}
              <Route path="/output-types" element={<Navigate to="/content-dimensions" replace />} />
              <Route path="/language-analytics" element={<Navigate to="/content-dimensions" replace />} />
              <Route path="/platform-analytics" element={<Navigate to="/content-dimensions" replace />} />
              <Route path="/multi-dimensional" element={<Navigate to="/content-dimensions" replace />} />
              <Route path="/content-performance" element={<Navigate to="/content-funnel" replace />} />
              <Route path="/billable-analytics" element={<Navigate to="/content-funnel" replace />} />
              <Route path="/insights" element={<Navigate to="/ai-insights" replace />} />
              <Route path="/scorecards" element={<Navigate to="/ai-insights" replace />} />
              <Route path="/processing-insights" element={<Navigate to="/operations-quality" replace />} />
              <Route path="/quality" element={<Navigate to="/operations-quality" replace />} />
              <Route path="/usage-trends" element={<Navigate to="/trends-forecasting" replace />} />
              <Route path="/forecasting" element={<Navigate to="/trends-forecasting" replace />} />
              <Route path="/datasets" element={<Navigate to="/data-management" replace />} />
              <Route path="/connectors" element={<Navigate to="/data-management" replace />} />
              <Route path="/metrics" element={<Navigate to="/data-management" replace />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </FilterProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
