import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import {
  Save, Workflow, ArrowLeft, ZoomIn, ZoomOut, Search, Redo, Undo
} from 'lucide-react';

export default function FlowchartToolbar({ processName, onSave, isSaving, onZoomChange, zoom }) {
  return (
    <header className="bg-white border-b border-slate-200 p-2 flex items-center justify-between shadow-sm z-20">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('EOS')}>
          <Button variant="ghost" size="icon" className="w-10 h-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Workflow className="w-6 h-6 text-slate-500" />
          <div>
            <h1 className="text-base font-semibold text-slate-900">{processName}</h1>
            <p className="text-xs text-slate-500">Flowchart Editor</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Placeholder icons for more functionality */}
        <Button variant="ghost" size="icon"><Undo className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon"><Redo className="w-4 h-4" /></Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => onZoomChange(z => Math.max(0.1, z - 0.1))}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="text-sm font-medium w-12 text-center">{(zoom * 100).toFixed(0)}%</div>
          <Button variant="ghost" size="icon" onClick={() => onZoomChange(z => Math.min(2, z + 0.1))}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={onSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </header>
  );
}