import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { applyTimeRounding } from '@/components/lib/rounding';

const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16'];

export default function EarningsCharts({ entries }) {
  const earningsByClient = useMemo(() => {
    const earnings = {};
    entries.forEach(entry => {
      if (entry.billable && entry.client) {
        const clientName = entry.client.name;
        const roundedMinutes = applyTimeRounding(entry.duration_minutes || 0, entry.client);
        const hours = roundedMinutes / 60;
        const earning = hours * (entry.client.hourly_rate || 0);
        earnings[clientName] = (earnings[clientName] || 0) + earning;
      }
    });
    
    return Object.entries(earnings)
      .map(([name, amount]) => ({
        name,
        amount: Math.round(amount * 100) / 100,
        value: Math.round(amount * 100) / 100
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [entries]);

  const earningsByDay = useMemo(() => {
    const dailyEarnings = {};
    entries.forEach(entry => {
      if (entry.billable && entry.client) {
        const day = format(parseISO(entry.start_time), 'MMM d');
        const roundedMinutes = applyTimeRounding(entry.duration_minutes || 0, entry.client);
        const hours = roundedMinutes / 60;
        const earning = hours * (entry.client.hourly_rate || 0);
        dailyEarnings[day] = (dailyEarnings[day] || 0) + earning;
      }
    });
    
    return Object.entries(dailyEarnings)
      .map(([day, amount]) => ({
        day,
        amount: Math.round(amount * 100) / 100
      }))
      .sort((a, b) => new Date(a.day) - new Date(b.day));
  }, [entries]);

  const totalEarnings = earningsByClient.reduce((sum, client) => sum + client.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">${totalEarnings.toFixed(2)}</div>
            <div className="text-xs text-emerald-600 mt-1">All billable work</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Top Client</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-900">
              {earningsByClient[0]?.name || 'No data'}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              ${earningsByClient[0]?.amount.toFixed(2) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Avg per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-900">
              ${earningsByDay.length > 0 ? (totalEarnings / earningsByDay.length).toFixed(2) : '0.00'}
            </div>
            <div className="text-xs text-purple-600 mt-1">Based on work days</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Earnings by Client
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={earningsByClient.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                  <Bar dataKey="amount" fill="#10B981" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Daily Earnings Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={earningsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Earnings']} />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Earnings Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={earningsByClient.slice(0, 6)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: $${value}`}
                >
                  {earningsByClient.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}