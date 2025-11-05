import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart3, MessageSquare, CheckCircle, Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import IssuesHealthDashboard from './issues/IssuesHealthDashboard';
import IssuesList from './issues/IssuesList';
import IDSWorkflow from './issues/IDSWorkflow';
import IssuesAnalytics from './issues/IssuesAnalytics';

export default function IssuesComponent({ client }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!client) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Issues Component
          </h2>
          <p className="text-slate-600 mt-1">Identify, Discuss, and Solve Issues Permanently</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 backdrop-blur-sm h-auto p-2 rounded-xl border border-slate-200">
          <TabsTrigger value="dashboard" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-700 flex items-center justify-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-700 flex items-center justify-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden md:inline">Issues List</span>
          </TabsTrigger>
          <TabsTrigger value="ids" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-700 flex items-center justify-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden md:inline">IDS Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-red-700 flex items-center justify-center gap-1">
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <IssuesHealthDashboard client={client} />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <IssuesList client={client} />
        </TabsContent>

        <TabsContent value="ids" className="mt-6">
          <IDSWorkflow client={client} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <IssuesAnalytics client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}