import React, { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, subtitle }) => {
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
    </div>
  );
};
