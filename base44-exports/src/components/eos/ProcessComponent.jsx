
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BarChart3, FileText, TrendingUp, Workflow, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProcessHealthDashboard from './process/ProcessHealthDashboard';
import ProcessLibrary from './process/ProcessLibrary';
import FlowchartBuilder from './process/FlowchartBuilder';
import ProcessImprovement from './process/ProcessImprovement';

export default function ProcessComponent({ client }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const [activeTab, setActiveTab] = useState(queryParams.get('subtab') || 'dashboard');

  if (!client) return null;

  const handleSubTabChange = (subtab) => {
    setActiveTab(subtab);
    navigate(createPageUrl(`EOS?tab=process&subtab=${subtab}`), { replace: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-500" />
            Process Component
          </h2>
          <p className="text-slate-600 mt-1">Document, Visualize, and Optimize Your Business Processes</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleSubTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 backdrop-blur-sm h-auto p-2 rounded-xl border border-slate-200">
          <TabsTrigger value="dashboard" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 flex items-center justify-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 flex items-center justify-center gap-1">
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Process Library</span>
          </TabsTrigger>
          <TabsTrigger value="flowchart" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 flex items-center justify-center gap-1">
            <Workflow className="w-4 h-4" />
            <span className="hidden md:inline">Flowchart Builder</span>
          </TabsTrigger>
          <TabsTrigger value="improvement" className="h-full py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-orange-700 flex items-center justify-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden md:inline">Improvements</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <ProcessHealthDashboard client={client} />
        </TabsContent>

        <TabsContent value="library" className="mt-6">
          <ProcessLibrary client={client} />
        </TabsContent>

        <TabsContent value="flowchart" className="mt-6">
          <FlowchartBuilder client={client} />
        </TabsContent>

        <TabsContent value="improvement" className="mt-6">
          <ProcessImprovement client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
