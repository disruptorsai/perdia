import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, CheckSquare, BarChart2, Star, Users, AlertTriangle, MessageSquare, Flag } from 'lucide-react';

const AGENDA_ITEMS = [
  { name: 'Segue', duration: 5, icon: MessageSquare },
  { name: 'Scorecard', duration: 5, icon: BarChart2 },
  { name: 'Rock Review', duration: 5, icon: Star },
  { name: 'Headlines', duration: 5, icon: Users },
  { name: 'To-Do List', duration: 5, icon: CheckSquare },
  { name: 'IDS', duration: 60, icon: AlertTriangle },
  { name: 'Conclude', duration: 5, icon: Flag },
];

function MeetingTimer({ duration, onComplete }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
        onComplete();
        return;
    }
    const intervalId = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="font-mono text-5xl font-bold text-slate-800">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}

export default function LiveL10Meeting({ client, onEndMeeting }) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const currentSection = AGENDA_ITEMS[currentSectionIndex];

  const goToNextSection = () => {
    if (currentSectionIndex < AGENDA_ITEMS.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    } else {
      // Handle meeting end
      onEndMeeting();
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg border shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Agenda Sidebar */}
            <div className="md:col-span-1 space-y-2">
                <h3 className="text-lg font-semibold px-3 mb-2">L-10 Agenda</h3>
                {AGENDA_ITEMS.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = index === currentSectionIndex;
                    return (
                        <div
                            key={item.name}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                isActive ? 'bg-purple-100 text-purple-800 font-bold' : 'text-slate-600'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                            <span>{item.name}</span>
                            <span className="ml-auto text-xs text-slate-500">{item.duration} min</span>
                        </div>
                    );
                })}
                 <Button onClick={onEndMeeting} variant="outline" className="w-full mt-4">
                    End Meeting
                </Button>
            </div>

            {/* Main Content */}
            <div className="md:col-span-3">
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl min-h-[60vh]">
                    <CardContent className="p-6 flex flex-col items-center justify-center h-full">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                <Timer className="w-10 h-10 text-slate-400"/>
                                <MeetingTimer 
                                    key={currentSectionIndex}
                                    duration={currentSection.duration}
                                    onComplete={goToNextSection}
                                />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">
                                {currentSection.name}
                            </h2>
                            <p className="text-slate-600 mb-8">
                                This is a placeholder for the {currentSection.name} section.
                                <br/>
                                Functionality for reviewing data and creating tasks will be built here.
                            </p>
                            <Button 
                                onClick={goToNextSection}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                {currentSection.name === 'Conclude' ? 'Finish Meeting' : 'Next Section'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}