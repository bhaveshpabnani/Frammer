import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-6 text-center px-4">
      <div className="space-y-2">
        <p
          className="text-8xl font-bold font-mono"
          style={{ color: '#E8212B', textShadow: '0 0 40px rgba(232,33,43,0.4)' }}
        >
          404
        </p>
        <h1 className="text-2xl font-semibold text-white">Page not found</h1>
        <p className="text-sm text-[#71717A] max-w-sm">
          The analytics view you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-frammer-red text-white text-sm font-medium hover:bg-frammer-red-dim transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Overview
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#27272A] text-[#A1A1AA] text-sm font-medium hover:border-[#3F3F46] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
      </div>
    </div>
  );
};

export default NotFound;
