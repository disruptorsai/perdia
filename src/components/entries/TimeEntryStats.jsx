
import React, { useMemo } from "react";
import { useClient } from "@/components/contexts/ClientContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, DollarSign, Calendar, Target } from "lucide-react";
import { applyTimeRounding } from '@/components/lib/rounding';

const StatCard = ({ title, value, icon: Icon, bgColor, subtitle }) => (
  <Card className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-lg">
    <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-8 -translate-y-8 ${bgColor} rounded-full opacity-10`} />
    <CardHeader className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <CardTitle className="text-2xl font-bold mt-2">
            {value}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bgColor} bg-opacity-20`}>
          <Icon className={`w-5 h-5 ${bgColor.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </CardHeader>
  </Card>
);

export default function TimeEntryStats({ entries }) {
  const { selectedClientId, clients } = useClient();

  const stats = useMemo(() => {
    const currentClient = clients.find(c => c.id === selectedClientId);
    if (!currentClient) {
      // Return default stats if no client is selected or found, ensuring all expected fields exist
      return { totalHours: 0, billableHours: 0, earnings: 0, entriesCount: entries.length };
    }

    let totalMinutes = 0; // Sum of duration_minutes for all entries (unrounded)
    let billableMinutes = 0; // Sum of rounded duration_minutes for billable entries

    entries.forEach(entry => {
      const rawMinutes = entry.duration_minutes || 0;
      totalMinutes += rawMinutes;

      if (entry.billable) {
        const roundedMinutes = applyTimeRounding(rawMinutes, currentClient);
        billableMinutes += roundedMinutes;
      }
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const billableHours = Math.round((billableMinutes / 60) * 10) / 10;

    const hourlyRate = currentClient.hourly_rate || 0;
    const earnings = billableHours * hourlyRate;

    return {
      totalHours: totalHours,
      billableHours: billableHours,
      earnings: Math.round(earnings * 100) / 100, // Round to 2 decimal places
      entriesCount: entries.length
    };
  }, [entries, selectedClientId, clients]);

  const getCurrencySymbol = () => {
    if (!selectedClientId) return '$'; // Use selectedClientId here instead of currentClient to avoid dependency issues if currentClient is null
    const currentClient = clients.find(c => c.id === selectedClientId); // Re-find here if needed, or pass currentClient from stats memo. For a simple utility function like this, finding again is fine.
    if (!currentClient) return '$';

    switch (currentClient.currency) {
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'CAD': return 'C$';
      case 'AUD': return 'A$';
      default: return '$';
    }
  };

  // The hourly_rate shown in subtitle should also be based on the client,
  // ensure currentClient is available for this. Since it's re-derived in stats,
  // we can safely use selectedClientId and clients to derive it here for display.
  const currentClientForDisplay = useMemo(() => clients.find(c => c.id === selectedClientId), [clients, selectedClientId]);


  return (
    <div className="w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Hours"
          value={`${stats.totalHours}h`}
          icon={Clock}
          bgColor="bg-blue-500"
          subtitle="Actual time tracked for selected entries"
        />
        <StatCard
          title="Billable Hours"
          value={`${stats.billableHours}h`}
          icon={Target}
          bgColor="bg-emerald-500"
          subtitle="Includes rounding for billable entries"
        />
        <StatCard
          title="Earnings"
          value={`${getCurrencySymbol()}${stats.earnings}`}
          icon={DollarSign}
          bgColor="bg-purple-500"
          subtitle={`@${getCurrencySymbol()}${currentClientForDisplay?.hourly_rate || 0}/hr`}
        />
        <StatCard
          title="Entries"
          value={stats.entriesCount}
          icon={Calendar}
          bgColor="bg-orange-500"
          subtitle="Total count"
        />
      </div>
    </div>
  );
}
