import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Share2 } from 'lucide-react';

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Marketing Dashboard</h1>
        <p className="text-slate-600 mt-1">Real-time overview of your marketing performance.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <Calendar className="w-4 h-4 mr-2" />
          Last 30 Days
        </Button>
        <Button variant="outline">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button disabled>
          <Plus className="w-4 h-4 mr-2" />
          Add Widget
        </Button>
      </div>
    </div>
  );
}