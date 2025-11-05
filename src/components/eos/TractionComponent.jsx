import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, BarChart3, Calendar, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RocksDashboard from './traction/RocksDashboard';
import ScorecardDashboard from './traction/ScorecardDashboard';
import QuarterlyPlanning from './traction/QuarterlyPlanning';
import TractionMeeting from './traction/TractionMeeting';

export default function TractionComponent({ client }) {
  const [activeTab, setActiveTab] = useState('rocks');

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            Traction Component
          </h2>
          <p className="text-slate-600 mt-1">Execute with Discipline and Accountability</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 backdrop-blur-sm h-auto p-2 rounded-xl border border-slate-200">
          <TabsTrigger value="rocks" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 flex items-center justify-center gap-1">
            <Target className="w-4 h-4" />
            <span className="hidden md:inline">Rocks</span>
          </TabsTrigger>
          <TabsTrigger value="scorecard" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 flex items-center justify-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Scorecard</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4" />
            <span className="hidden md:inline">Planning</span>
          </TabsTrigger>
          <TabsTrigger value="meetings" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 flex items-center justify-center gap-1">
            <Trophy className="w-4 h-4" />
            <span className="hidden md:inline">Meetings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rocks" className="mt-6">
          <RocksDashboard client={client} />
        </TabsContent>

        <TabsContent value="scorecard" className="mt-6">
          <ScorecardDashboard client={client} />
        </TabsContent>

        <TabsContent value="planning" className="mt-6">
          <QuarterlyPlanning client={client} />
        </TabsContent>

        <TabsContent value="meetings" className="mt-6">
          <TractionMeeting client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}