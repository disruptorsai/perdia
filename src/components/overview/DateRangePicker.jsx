
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

export default function DateRangePicker({ view, setView, currentDate, setCurrentDate, rangeText }) {
  const handlePrevious = () => {
    switch (view) {
      case 'daily': setCurrentDate(subDays(currentDate, 1)); break;
      case 'weekly': setCurrentDate(subWeeks(currentDate, 1)); break;
      case 'monthly': setCurrentDate(subMonths(currentDate, 1)); break;
      default: break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'daily': setCurrentDate(addDays(currentDate, 1)); break;
      case 'weekly': setCurrentDate(addWeeks(currentDate, 1)); break;
      case 'monthly': setCurrentDate(addMonths(currentDate, 1)); break;
      default: break;
    }
  };
  
  const handleToday = () => {
    setCurrentDate(new Date());
  }

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="flex flex-col gap-3 bg-white/80 border border-slate-200 p-3 rounded-xl shadow-sm">
        <Tabs value={view} onValueChange={setView} className="w-full">
          <TabsList className="bg-slate-100 w-full grid grid-cols-3">
            <TabsTrigger value="daily" className="text-xs sm:text-sm">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs sm:text-sm">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-2 w-full">
          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={handlePrevious}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-center font-semibold text-slate-700 h-9 min-w-0 text-xs sm:text-sm">
                <span className="truncate">{rangeText}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={setCurrentDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" className="h-9 flex-shrink-0 text-xs px-3" onClick={handleToday}>
            Today
          </Button>
        </div>
      </div>
    </div>
  );
}
