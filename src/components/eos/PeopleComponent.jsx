import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Target, BarChart3, UserCheck, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PeopleHealthDashboard from './people/PeopleHealthDashboard';
import AccountabilityChart from './people/AccountabilityChart';
import PeopleAnalyzer from './people/PeopleAnalyzer';
import PerformanceManagement from './people/PerformanceManagement';

export default function PeopleComponent({ client }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-green-500" />
            People Component
          </h2>
          <p className="text-slate-600 mt-1">Right People in the Right Seats</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 backdrop-blur-sm h-auto p-2 rounded-xl border border-slate-200">
          <TabsTrigger value="dashboard" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 flex items-center justify-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="accountability" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 flex items-center justify-center gap-1">
            <Target className="w-4 h-4" />
            <span className="hidden md:inline">Accountability</span>
          </TabsTrigger>
          <TabsTrigger value="analyzer" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 flex items-center justify-center gap-1">
            <UserCheck className="w-4 h-4" />
            <span className="hidden md:inline">People Analyzer</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-green-700 flex items-center justify-center gap-1">
            <Users className="w-4 h-4" />
            <span className="hidden md:inline">Performance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <PeopleHealthDashboard client={client} />
        </TabsContent>

        <TabsContent value="accountability" className="mt-6">
          <AccountabilityChart client={client} />
        </TabsContent>

        <TabsContent value="analyzer" className="mt-6">
          <PeopleAnalyzer client={client} />
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <PerformanceManagement client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}