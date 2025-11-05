import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users } from 'lucide-react';

const data = [
  { name: 'Organic', users: 12203 },
  { name: 'Paid Search', users: 6234 },
  { name: 'Direct', users: 4102 },
  { name: 'Social', users: 3123 },
  { name: 'Referral', users: 1876 },
];

export default function TrafficSourceChart() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">Sessions by Source</CardTitle>
        <Users className="w-4 h-4 text-slate-400" />
      </CardHeader>
      <CardContent>
        <div className="h-[250px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} stroke="#64748b" fontSize={12} />
              <Tooltip 
                cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} 
                contentStyle={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="users" fill="#2E86AB" barSize={20} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}