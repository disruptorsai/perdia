
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Palette, Type, Square, Link2 } from 'lucide-react';

export default function FlowchartPropertiesPanel({ shape, connection, onUpdate, onDelete }) {
  const handleUpdate = (prop, value) => {
    onUpdate(shape.id, { [prop]: value });
  };

  if (connection) {
    return (
      <aside className="w-64 bg-white border-l border-slate-200 shadow-lg z-10 flex flex-col">
        <h3 className="text-sm font-semibold text-slate-800 p-3 border-b border-slate-200 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Connection Properties
        </h3>
        <div className="p-4 flex-1">
            <p className="text-sm text-slate-500">Connection properties coming soon.</p>
        </div>
        <div className="p-4 border-t border-slate-200">
            <Button variant="destructive" className="w-full" onClick={onDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Connection
            </Button>
        </div>
      </aside>
    );
  }
  
  if (!shape) return null;

  return (
    <aside className="w-64 bg-white border-l border-slate-200 shadow-lg z-10 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-800 p-3 border-b border-slate-200">
        Properties
      </h3>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Style Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2"><Palette className="w-4 h-4"/> Style</h4>
            <div className="space-y-2">
              <Label htmlFor="fillColor">Fill Color</Label>
              <Input 
                type="color" 
                id="fillColor" 
                value={shape.fill}
                onChange={(e) => handleUpdate('fill', e.target.value)}
                className="p-1 h-8"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="strokeColor">Border Color</Label>
              <Input 
                type="color" 
                id="strokeColor" 
                value={shape.stroke}
                onChange={(e) => handleUpdate('stroke', e.target.value)}
                className="p-1 h-8"
              />
            </div>
          </div>
          
          <div className="h-px bg-slate-200" />

          {/* Text Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2"><Type className="w-4 h-4"/> Text</h4>
             <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <Input 
                type="color" 
                id="textColor" 
                value={shape.textColor}
                onChange={(e) => handleUpdate('textColor', e.target.value)}
                className="p-1 h-8"
              />
            </div>
          </div>
          
          <div className="h-px bg-slate-200" />
          
          {/* Arrange Section */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-700 flex items-center gap-2"><Square className="w-4 h-4"/> Arrange</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="width" className="text-xs">Width</Label>
                <Input type="number" id="width" value={Math.round(shape.width)} onChange={(e) => handleUpdate('width', parseInt(e.target.value))}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="height" className="text-xs">Height</Label>
                <Input type="number" id="height" value={Math.round(shape.height)} onChange={(e) => handleUpdate('height', parseInt(e.target.value))}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="x" className="text-xs">X</Label>
                <Input type="number" id="x" value={Math.round(shape.x)} onChange={(e) => handleUpdate('x', parseInt(e.target.value))}/>
              </div>
              <div className="space-y-1">
                <Label htmlFor="y" className="text-xs">Y</Label>
                <Input type="number" id="y" value={Math.round(shape.y)} onChange={(e) => handleUpdate('y', parseInt(e.target.value))}/>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-slate-200">
        <Button variant="destructive" className="w-full" onClick={onDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Shape
        </Button>
      </div>
    </aside>
  );
}
