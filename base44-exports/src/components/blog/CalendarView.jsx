import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarView({ events, onEventSelect }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days = eachDayOfInterval({ start, end });
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const getStatusColor = (status) => {
        switch (status) {
          case 'Draft': return 'bg-slate-200 text-slate-800';
          case 'Needs Review': return 'bg-yellow-200 text-yellow-800';
          case 'Approved': return 'bg-blue-200 text-blue-800';
          case 'Scheduled': return 'bg-purple-200 text-purple-800';
          case 'Published': return 'bg-emerald-200 text-emerald-800';
          default: return 'bg-slate-200 text-slate-800';
        }
    };

    const getEventTypeStyle = (type) => {
        switch (type) {
            case 'blog': return { icon: <FileText className="w-3 h-3 text-blue-600"/>, color: 'border-blue-500'};
            case 'social': return { icon: <Share2 className="w-3 h-3 text-sky-600"/>, color: 'border-sky-500'};
            default: return { icon: null, color: 'border-slate-300' };
        }
    };

    const eventsByDate = events.reduce((acc, event) => {
        if (event.date) {
            const dateStr = format(new Date(event.date), 'yyyy-MM-dd');
            if (!acc[dateStr]) {
                acc[dateStr] = [];
            }
            acc[dateStr].push(event);
        }
        return acc;
    }, {});

    return (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-600" />
                    Content Calendar
                </CardTitle>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-32 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                    <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-7 border-t border-l border-slate-200">
                    {weekDays.map(day => (
                        <div key={day} className="text-center font-medium p-2 border-b border-r border-slate-200 bg-slate-50 text-sm">
                            {day}
                        </div>
                    ))}
                    {days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const scheduledEvents = eventsByDate[dateStr] || [];
                        return (
                            <div
                                key={day.toString()}
                                className={cn(
                                    "h-40 p-2 border-b border-r border-slate-200 relative overflow-y-auto",
                                    !isSameMonth(day, currentMonth) ? 'bg-slate-50/50 text-slate-400' : 'bg-white'
                                )}
                            >
                                <span className="font-semibold">{format(day, 'd')}</span>
                                <div className="space-y-1 mt-1">
                                    {scheduledEvents.map(event => {
                                        const { icon, color } = getEventTypeStyle(event.type);
                                        return (
                                            <div 
                                                key={event.id} 
                                                className={cn("p-1.5 rounded-md cursor-pointer hover:bg-slate-100 border-l-4", color)}
                                                onClick={() => onEventSelect(event)}
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    {icon}
                                                    <p className="text-xs font-medium text-slate-800 truncate">
                                                        {event.type === 'blog' ? event.title : `Post for ${event.title}`}
                                                    </p>
                                                </div>
                                                <Badge className={`mt-1 text-xs px-1 py-0 ${getStatusColor(event.status)}`}>{event.status}</Badge>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}