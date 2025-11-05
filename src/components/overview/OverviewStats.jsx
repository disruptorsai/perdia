
import React from 'react';
import { Card } from "@/components/ui/card";
import { Clock, DollarSign, Target } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, bgColor, subtitle }) => (
  <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
    <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgColor} rounded-full opacity-10`} />
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold mt-2 text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${bgColor.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  </Card>
);

export default function OverviewStats({ stats }) {
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard
        title="Total Hours"
        value={`${stats.totalHours}h`}
        icon={Clock}
        bgColor="bg-blue-500"
        subtitle="Actual, un-rounded time spent"
      />
      <StatCard
        title="Billable Hours"
        value={`${stats.billableHours}h`}
        icon={Target}
        bgColor="bg-emerald-500"
        subtitle="Billable time including client rounding"
      />
      <StatCard
        title="Estimated Earnings"
        value={currencyFormatter.format(stats.estimatedEarnings)}
        icon={DollarSign}
        bgColor="bg-purple-500"
        subtitle="Based on rounded billable hours"
      />
    </div>
  );
}
