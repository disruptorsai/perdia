import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Workflow, Library } from 'lucide-react';

export default function FlowchartBuilder({ client }) {
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Visual Flowchart Builder</h3>
          <p className="text-slate-600 mt-1">Create interactive process flowcharts with drag-and-drop</p>
        </div>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="py-16 text-center">
          <Workflow className="w-24 h-24 text-slate-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-slate-900 mb-4">Visualize Your Core Processes</h3>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            A flowchart is a visual representation of the steps in a process. To create or edit a flowchart, first select a process from your Process Library.
          </p>
          
          <div className="flex justify-center">
             <p className="text-slate-500">
                Please go to the <strong>Process Library</strong> tab to select or create a process, then build its flowchart.
            </p>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-lg font-semibold text-slate-700 mb-2">How it Works:</p>
            <p className="text-sm text-slate-500">1. Document a process in the Process Library.</p>
            <p className="text-sm text-slate-500">2. Click "Edit Flowchart" to open the builder.</p>
            <p className="text-sm text-slate-500">3. Drag, drop, and connect shapes to map your process.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}