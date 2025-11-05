import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function KPIWidget({ title, icon: Icon, value, previousValue, unit, iconBgColor, iconColor, invertTrendColor = false }) {
  const formatValue = (val) => {
    if (unit === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    }
    if (unit === '%') {
      return `${val.toFixed(1)}%`;
    }
    if (unit === 'x') {
        return `${val.toFixed(1)}x`;
    }
    return new Intl.NumberFormat('en-US').format(val);
  };

  const calculateChange = () => {
    if (previousValue === 0) return { change: '∞', isPositive: true };
    const change = ((value - previousValue) / previousValue) * 100;
    return {
      change: `${Math.abs(change).toFixed(1)}%`,
      isPositive: change >= 0
    };
  };

  const { change, isPositive } = calculateChange();
  
  let trendColor;
  if (invertTrendColor) {
    trendColor = isPositive ? 'text-red-600' : 'text-green-600';
  } else {
    trendColor = isPositive ? 'text-green-600' : 'text-red-600';
  }

  const TrendIcon = isPositive ? ArrowUp : ArrowDown;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className={`p-2.5 rounded-full ${iconBgColor}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{formatValue(value)}</div>
        <div className="flex items-center text-xs text-slate-500 mt-1">
          <div className={`flex items-center ${trendColor}`}>
            <TrendIcon className="w-3 h-3 mr-1" />
            <span>{change}</span>
          </div>
          <span className="ml-1.5">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}