import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';

export default function FolderNavigation({ currentPath, onNavigate }) {
  const pathSegments = currentPath.split('/').filter(Boolean);
  
  const handleNavigate = (targetPath) => {
    onNavigate(targetPath);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleNavigate('/')}
        className="p-2 h-8"
      >
        <Home className="w-4 h-4" />
      </Button>
      
      {pathSegments.length > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
      
      {pathSegments.map((segment, index) => {
        const segmentPath = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        
        return (
          <React.Fragment key={segmentPath}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigate(segmentPath)}
              className={`p-2 h-8 ${isLast ? 'font-medium text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {segment}
            </Button>
            {!isLast && <ChevronRight className="w-4 h-4 text-slate-400" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}