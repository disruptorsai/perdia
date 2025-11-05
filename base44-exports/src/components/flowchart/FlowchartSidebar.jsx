import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RectangleHorizontal, Diamond, Circle, Text
} from 'lucide-react';

const shapeTypes = [
  { type: 'rectangle', label: 'Process', icon: <RectangleHorizontal className="w-8 h-8" /> },
  { type: 'diamond', label: 'Decision', icon: <Diamond className="w-8 h-8" /> },
  { type: 'oval', label: 'Start/End', icon: <Circle className="w-8 h-8" /> },
  { type: 'parallelogram', label: 'Data I/O', icon: <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M22 6H4.55l-2.3-4.14L4.55 6H22zm-2.3 12H2l2.3 4.14L2 18h17.7z"></path></svg> },
  { type: 'document', label: 'Document', icon: <svg width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h11.17l5 5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm10 6h4l-4-4v4z"></path></svg> },
  { type: 'textbox', label: 'Text', icon: <Text className="w-8 h-8" /> },
];

function DraggableShape({ type, label, icon, onAddShape, shapesCount }) {
  const handleClick = () => {
    // Generate a unique ID
    const id = Date.now() + Math.random();
    
    const offset = shapesCount * 25; // Create a cascading offset for each new shape

    const newShape = {
      id: id.toString(),
      type,
      x: 200 + offset, // Apply offset
      y: 200 + offset, // Apply offset
      width: 150,
      height: 80,
      text: `New ${label}`,
      fill: '#ffffff',
      stroke: '#000000',
      textColor: '#000000',
    };
    
    if (type === 'oval' || type === 'diamond') newShape.height = 100;
    if (type === 'textbox') newShape.fill = 'transparent';

    onAddShape(newShape);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col items-center justify-center p-2 m-1 cursor-pointer rounded-md hover:bg-slate-200 transition-colors"
      title={`Click to add ${label}`}
    >
      <div className="text-slate-600">{icon}</div>
      <p className="text-xs text-center text-slate-700 mt-1">{label}</p>
    </div>
  );
}

export default function FlowchartSidebar({ onAddShape, shapesCount = 0 }) {
  return (
    <aside className="w-48 bg-white border-r border-slate-200 shadow-lg z-10">
      <ScrollArea className="h-full">
        <div className="p-2">
          <h3 className="text-sm font-semibold text-slate-800 px-2 py-1">Flowchart Shapes</h3>
          <div className="grid grid-cols-2 gap-1">
            {shapeTypes.map(shape => (
              <DraggableShape 
                key={shape.type} 
                {...shape} 
                onAddShape={onAddShape} 
                shapesCount={shapesCount}
              />
            ))}
          </div>
          <div className="px-2 py-3">
             <div className="h-px bg-slate-200" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 px-2 py-1">Connectors</h3>
           <div className="p-4 text-center text-xs text-slate-500">
             Connectors coming soon!
           </div>
        </div>
      </ScrollArea>
    </aside>
  );
}