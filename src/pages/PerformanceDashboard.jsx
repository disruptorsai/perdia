/**
 * PERDIA EDUCATION - PERFORMANCE DASHBOARD
 * Track rankings, traffic, and conversion metrics
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Eye, MousePointerClick, Target } from 'lucide-react';
import { PerformanceMetric } from '@/lib/perdia-sdk';

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalImpressions: 0,
    avgCTR: 0,
    avgPosition: 0
  });

  useEffect(() => {
    loadPerformanceData();
  }, []);

  async function loadPerformanceData() {
    try {
      setLoading(true);
      const data = await PerformanceMetric.list('-metric_date', 100);
      setMetrics(data);

      // Calculate aggregate stats
      const totalClicks = data.reduce((sum, m) => sum + (m.clicks || 0), 0);
      const totalImpressions = data.reduce((sum, m) => sum + (m.impressions || 0), 0);
      const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : 0;

      const metricsWithPosition = data.filter(m => m.google_ranking);
      const avgPosition = metricsWithPosition.length > 0
        ? (metricsWithPosition.reduce((sum, m) => sum + m.google_ranking, 0) / metricsWithPosition.length).toFixed(1)
        : 0;

      setStats({ totalClicks, totalImpressions, avgCTR, avgPosition });
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Performance Dashboard</h1>
        <p className="text-slate-600 mt-2">Track keyword rankings, traffic, and SEO performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CTR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCTR}%</div>
            <p className="text-xs text-muted-foreground">Click-through rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Position</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPosition}</div>
            <p className="text-xs text-muted-foreground">Google ranking</p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-slate-600 mt-4">Loading performance data...</p>
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No performance data yet</p>
              <p className="text-sm text-slate-500 mt-2">
                Connect your Google Search Console to start tracking metrics
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Date</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Keyword</th>
                    <th className="text-left p-3 text-sm font-semibold text-slate-700">Page</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">Clicks</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">Impressions</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">CTR</th>
                    <th className="text-right p-3 text-sm font-semibold text-slate-700">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.slice(0, 50).map((metric, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-600">
                        {new Date(metric.metric_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm text-slate-900">{metric.keyword || '—'}</td>
                      <td className="p-3 text-sm text-slate-600 truncate max-w-xs">
                        {metric.page_url || '—'}
                      </td>
                      <td className="p-3 text-sm text-slate-900 text-right">{metric.clicks || 0}</td>
                      <td className="p-3 text-sm text-slate-900 text-right">{metric.impressions || 0}</td>
                      <td className="p-3 text-sm text-slate-900 text-right">
                        {metric.ctr ? (metric.ctr * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className="p-3 text-sm text-slate-900 text-right">
                        {metric.google_ranking ? metric.google_ranking.toFixed(1) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
