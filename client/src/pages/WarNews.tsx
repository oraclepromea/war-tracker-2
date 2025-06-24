import React from 'react';
import { LiveNews } from '../components/LiveNews';
import { WarEvents } from '../components/WarEvents';

export function WarNews() {
  return (
    <div className="min-h-screen bg-tactical-bg">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">War News & Events</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <LiveNews />
          </div>
          <div>
            <WarEvents />
          </div>
        </div>
      </div>
    </div>
  );
}
