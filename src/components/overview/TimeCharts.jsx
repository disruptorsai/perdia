
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { Clock, Users, Calendar, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { applyTimeRounding } from '@/components/lib/rounding';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

export default function TimeCharts({ entries }) {
  const timeByClient = useMemo(() => {
    const timeData = {};
    entries.forEach(entry => {
      if (entry.client) {
        const clientName = entry.client.name;
        const minutes = entry.duration_minutes || 0;
        timeData[clientName] = (timeData[clientName] || 0) + minutes;
      }
    });
    
    return Object.entries(timeData)
      .map(([name, minutes]) => ({
        name,
        hours: Math.round((minutes / 60) * 10) / 10,
        value: Math.round((minutes / 60) * 10) / 10
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [entries]);

  const dailyTime = useMemo(() => {
    const dailyData = {};
    entries.forEach(entry => {
      const day = format(parseISO(entry.start_time), 'MMM d');
      const minutes = entry.duration_minutes || 0;
      dailyData[day] = (dailyData[day] || 0) + minutes;
    });
    
    return Object.entries(dailyData)
      .map(([day, minutes]) => ({
        day,
        hours: Math.round((minutes / 60) * 10) / 10
      }))
      .sort((a, b) => {
        // Sort by date, assuming 'MMM d' can be parsed by Date constructor
        const dateA = new Date(a.day + ', ' + new Date().getFullYear()); // Add current year for correct parsing
        const dateB = new Date(b.day + ', ' + new Date().getFullYear());
        return dateA.getTime() - dateB.getTime();
      });
  }, [entries]);

  const billableVsNonBillable = useMemo(() => {
    let billableMinutes = 0;
    let nonBillableMinutes = 0;
    
    entries.forEach(entry => {
      const minutes = entry.duration_minutes || 0;
      if (entry.billable) {
        billableMinutes += minutes;
      } else {
        nonBillableMinutes += minutes;
      }
    });
    
    return [
      { name: 'Billable', hours: Math.round((billableMinutes / 60) * 10) / 10, value: Math.round((billableMinutes / 60) * 10) / 10 },
      { name: 'Non-billable', hours: Math.round((nonBillableMinutes / 60) * 10) / 10, value: Math.round((nonBillableMinutes / 60) * 10) / 10 }
    ];
  }, [entries]);

  const totalHours = Math.round((timeByClient.reduce((sum, client) => sum + client.hours, 0)) * 10) / 10;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalHours}h</div>
            <div className="text-xs text-blue-600 mt-1">All tracked time</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Most Active Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-900">
              {timeByClient[0]?.name || 'No data'}
            </div>
            <div className="text-xs text-emerald-600 mt-1">
              {timeByClient[0]?.hours || 0}h tracked
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Avg per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-900">
              {dailyTime.length > 0 ? (totalHours / dailyTime.length).toFixed(1) : '0.0'}h
            </div>
            <div className="text-xs text-purple-600 mt-1">Based on work days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Time by Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeByClient.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
                  <Bar dataKey="hours" fill="#3B82F6" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Daily Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#3B82F6" 
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              Billable vs Non-billable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billableVsNonBillable}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {billableVsNonBillable.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#94A3B8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}h`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Client Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={timeByClient.slice(0, 6)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}h`}
                  >
                    {timeByClient.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}h`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
