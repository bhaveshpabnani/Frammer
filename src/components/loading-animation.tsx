import React from 'react';
import { Play, Scissors, Video, TrendingUp } from 'lucide-react';

export const LoadingAnimation: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-4">
      <div className="relative w-16 h-16">
        {[Play, Scissors, Video, TrendingUp].map((Icon, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center animate-pulse-opacity"
            style={{ animationDelay: `${i * 450}ms` }}
          >
            <Icon className="w-8 h-8 text-frammer-red" />
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-white">Loading analytics...</p>
        <p className="text-xs text-[#71717A] mt-1">Crunching the numbers</p>
      </div>
      <div className="w-48 h-1 bg-[#1C1C1C] rounded-full overflow-hidden">
        <div
          className="h-full bg-frammer-red rounded-full shimmer-bar"
          style={{ width: '65%' }}
        />
      </div>
    </div>
  );
};
