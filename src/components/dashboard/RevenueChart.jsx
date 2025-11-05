import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign } from 'lucide-react';

const data = [
  { name: 'Jan', revenue: 4000, previous: 2400 },
  { name: 'Feb', revenue: 3000, previous: 1398 },
  { name: 'Mar', revenue: 5000, previous: 9800 },
  { name: 'Apr', revenue: 4780, previous: 3908 },
  { name: 'May', revenue: 5890, previous: 4800 },
  { name: 'Jun', revenue: 4390, previous: 3800 },
  { name: 'Jul', revenue: 5490, previous: 4300 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/80 backdrop-blur-sm p-2 shadow-lg rounded-lg border border-slate-200">
          <p className="label font-bold">{`${label}`}</p>
          <p className="text-blue-600">{`This Year: $${payload[0].value.toLocaleString()}`}</p>
          <p className="text-slate-500">{`Last Year: $${payload[1].value.toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
};

export default function RevenueChart() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">Revenue (YoY)</CardTitle>
        <DollarSign className="w-4 h-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">$35,231</div>
        <p className="text-xs text-slate-500">+15.1% from last month</p>
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="revenue" stroke="#2E86AB" strokeWidth={2} name="This Year" />
              <Line type="monotone" dataKey="previous" stroke="#A23B72" strokeWidth={2} strokeDasharray="5 5" name="Last Year" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}