import React from "react";
import { Card } from "@/components/ui/card";
import { Timer } from "lucide-react";

export default function TimerDisplay({ seconds, isRunning }) {
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={`p-6 sm:p-8 text-center transition-all duration-500 ${
      isRunning 
        ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 shadow-lg shadow-emerald-500/20' 
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="flex items-center justify-center mb-4">
        <Timer className={`w-6 h-6 sm:w-8 sm:h-8 ${isRunning ? 'text-emerald-600' : 'text-slate-400'}`} />
      </div>
      <div className={`text-3xl sm:text-5xl font-mono font-bold ${
        isRunning ? 'text-emerald-700' : 'text-slate-700'
      }`}>
        {formatTime(seconds)}
      </div>
      {isRunning && (
        <div className="mt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Timer Running
          </div>
        </div>
      )}
    </Card>
  );
}