import React from 'react';
import { cn } from '@/lib/utils';

export default function DashboardGrid({ children, className }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {children}
    </div>
  );
}