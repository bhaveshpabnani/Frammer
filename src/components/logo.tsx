import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ collapsed, className }) => {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Frammer "F" icon mark */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-frammer-red flex items-center justify-center shadow-lg"
           style={{ boxShadow: '0 0 16px rgba(232,33,43,0.4)' }}>
        <span className="text-white font-bold text-sm font-mono">F</span>
      </div>
      {!collapsed && (
        <div className="flex flex-col leading-tight">
          <span className="text-white font-semibold text-sm tracking-wide">Frammer</span>
          <span className="text-frammer-red text-[10px] font-medium tracking-widest uppercase">AI Dashboard</span>
        </div>
      )}
    </div>
  );
};
