
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, DollarSign, Clock, Target, TrendingUp } from "lucide-react";
import { applyTimeRounding } from '@/components/lib/rounding';

export default function ClientSummaryTable({ entries }) {
  const clientSummary = useMemo(() => {
    const clients = {};
    
    entries.forEach(entry => {
      if (!entry.client) return;
      
      const clientId = entry.client.id;
      const clientName = entry.client.name;
      
      if (!clients[clientId]) {
        clients[clientId] = {
          id: clientId,
          name: clientName,
          client: entry.client,
          totalMinutes: 0,
          billableMinutes: 0,
          nonBillableMinutes: 0,
          totalEarnings: 0,
          entryCount: 0,
          projectCount: new Set(),
        };
      }
      
      const minutes = entry.duration_minutes || 0;
      clients[clientId].totalMinutes += minutes;
      clients[clientId].entryCount += 1;
      
      if (entry.project) {
        clients[clientId].projectCount.add(entry.project.id);
      }
      
      if (entry.billable) {
        const roundedMinutes = applyTimeRounding(minutes, entry.client);
        clients[clientId].billableMinutes += roundedMinutes;
        const hours = roundedMinutes / 60;
        clients[clientId].totalEarnings += hours * (entry.client.hourly_rate || 0);
      } else {
        clients[clientId].nonBillableMinutes += minutes;
      }
    });
    
    return Object.values(clients)
      .map(client => ({
        ...client,
        totalHours: Math.round((client.totalMinutes / 60) * 10) / 10,
        billableHours: Math.round((client.billableMinutes / 60) * 10) / 10,
        nonBillableHours: Math.round((client.nonBillableMinutes / 60) * 10) / 10,
        totalEarnings: Math.round(client.totalEarnings * 100) / 100,
        utilization: client.totalMinutes > 0 ? Math.round((client.billableMinutes / client.totalMinutes) * 100) : 0,
        projectCount: client.projectCount.size,
        avgHourlyRate: client.client.hourly_rate || 0
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [entries]);

  const totals = useMemo(() => {
    return clientSummary.reduce((acc, client) => ({
      totalHours: Math.round((acc.totalHours + client.totalHours) * 10) / 10,
      billableHours: Math.round((acc.billableHours + client.billableHours) * 10) / 10,
      nonBillableHours: Math.round((acc.nonBillableHours + client.nonBillableHours) * 10) / 10,
      totalEarnings: acc.totalEarnings + client.totalEarnings,
      entryCount: acc.entryCount + client.entryCount,
      clientCount: acc.clientCount + 1
    }), {
      totalHours: 0,
      billableHours: 0,
      nonBillableHours: 0,
      totalEarnings: 0,
      entryCount: 0,
      clientCount: 0
    });
  }, [clientSummary]);

  const formatCurrency = (amount, currency = 'USD') => {
    const symbol = currency === 'EUR' ? '€' : 
                  currency === 'GBP' ? '£' : 
                  currency === 'CAD' ? 'C$' : 
                  currency === 'AUD' ? 'A$' : '$';
    return `${symbol}${amount.toFixed(2)}`;
  };

  if (clientSummary.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Client Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold">No client data available</p>
            <p>Time entries for the selected period will appear here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Active Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totals.clientCount}</div>
            <div className="text-xs text-blue-600 mt-1">With time tracked</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{totals.totalHours}h</div>
            <div className="text-xs text-emerald-600 mt-1">Across all clients</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Billable Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{totals.billableHours}h</div>
            <div className="text-xs text-purple-600 mt-1">Total billable time</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">${totals.totalEarnings.toFixed(2)}</div>
            <div className="text-xs text-orange-600 mt-1">All billable work</div>
          </CardContent>
        </Card>
      </div>

      {/* Client Summary Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Client Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Client</TableHead>
                  <TableHead className="text-center font-semibold">Total Hours</TableHead>
                  <TableHead className="text-center font-semibold">Billable Hours</TableHead>
                  <TableHead className="text-center font-semibold">Non-Billable Hours</TableHead>
                  <TableHead className="text-center font-semibold">Utilization</TableHead>
                  <TableHead className="text-center font-semibold">Rate</TableHead>
                  <TableHead className="text-center font-semibold">Earnings</TableHead>
                  <TableHead className="text-center font-semibold">Entries</TableHead>
                  <TableHead className="text-center font-semibold">Projects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientSummary.map((client) => (
                  <TableRow key={client.id} className="hover:bg-slate-50/70">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: client.client.color }}
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 truncate">{client.name}</div>
                          <div className="text-xs text-slate-500">{client.client.currency}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono font-semibold text-slate-900">{client.totalHours}h</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono font-semibold text-emerald-600">{client.billableHours}h</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono font-semibold text-slate-500">{client.nonBillableHours}h</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline" 
                        className={`font-semibold ${
                          client.utilization >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          client.utilization >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {client.utilization}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono text-sm text-slate-700">
                        {formatCurrency(client.avgHourlyRate, client.client.currency)}/h
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="font-mono font-semibold text-purple-600">
                        {formatCurrency(client.totalEarnings, client.client.currency)}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {client.entryCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-semibold">
                        {client.projectCount}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* Totals Row */}
                <TableRow className="bg-slate-100/80 border-t-2 border-slate-200 font-semibold">
                  <TableCell className="font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      TOTALS ({totals.clientCount} clients)
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-slate-900">
                    {totals.totalHours}h
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-emerald-600">
                    {totals.billableHours}h
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold text-slate-500">
                    {totals.nonBillableHours}h
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-bold">
                      {totals.totalHours > 0 ? Math.round((totals.billableHours / totals.totalHours) * 100) : 0}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-slate-400 text-sm">-</TableCell>
                  <TableCell className="text-center font-mono font-bold text-purple-600">
                    ${totals.totalEarnings.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-bold">
                      {totals.entryCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-slate-400 text-sm">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
