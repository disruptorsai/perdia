import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Play, Calendar, Clock } from 'lucide-react';
import LiveL10Meeting from './LiveL10Meeting';

export default function TractionMeeting({ client }) {
  const [isMeetingLive, setIsMeetingLive] = useState(false);

  if (!client) return null;

  if (isMeetingLive) {
    return <LiveL10Meeting client={client} onEndMeeting={() => setIsMeetingLive(false)} />;
  }

  return (
    <div className="space-y-6">
       <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-600" />
                Weekly Level 10 Meeting
              </h3>
              <p className="text-slate-600 mt-2 max-w-lg">
                The L10 Meeting is a powerful tool to keep your team focused, aligned, and accountable. It follows a strict agenda to solve problems and ensure traction.
              </p>
            </div>
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700 text-lg py-6 px-8 shadow-lg"
              onClick={() => setIsMeetingLive(true)}
            >
              <Play className="w-5 h-5 mr-3" />
              Start Meeting
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for past meeting history */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Past Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-slate-500 py-8">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>Meeting history will be displayed here.</p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}