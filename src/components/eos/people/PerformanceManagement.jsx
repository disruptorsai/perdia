import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Calendar, Award } from 'lucide-react';

export default function PerformanceManagement({ client }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Performance Management</h3>
        <p className="text-slate-600 mt-1">Track individual and team performance aligned with EOS principles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Individual Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">Track individual performance metrics, goals, and development progress.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Performance Reviews</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Goal Tracking</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Development Plans</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">Monitor team dynamics, collaboration, and collective performance.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Team Health Metrics</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Collaboration Analysis</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Team Development</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Review Cycles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">Manage performance review cycles and scheduling.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Quarterly Reviews</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Annual Reviews</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">360° Feedback</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Recognition & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-500 mb-4">Recognize and reward core values demonstration and performance.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Core Values Recognition</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Performance Awards</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">Peer Recognition</span>
                <span className="text-xs text-slate-500">Coming Soon</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}