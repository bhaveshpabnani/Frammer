import React, { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { Sparkles } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, subtitle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const showFab  = location.pathname !== '/ai';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      {/* Main content shifts by sidebar width via CSS variable */}
      <div
        className="flex flex-col min-h-screen transition-all duration-200"
        style={{ marginLeft: 'var(--sidebar-width, 256px)' }}
      >
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Floating AI button — hidden on the /ai page itself */}
      {showFab && (
        <button
          type="button"
          onClick={() => navigate('/ai')}
          title="Open AI Chat"
          className="fixed bottom-8 right-8 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#E8212B] shadow-[0_8px_30px_rgba(232,33,43,0.40)] transition hover:scale-105 hover:bg-[#cc1c25] active:scale-95"
          style={{ height: '3.25rem', width: '3.25rem' }}
        >
          <Sparkles className="h-6 w-6 text-white" />
        </button>
      )}
    </div>
  );
};
