import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { format, subDays } from "date-fns";
import { TrendingUp, FileText, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('30d');

  const { data: articles = [] } = useQuery({
    queryKey: ['articles'],
    queryFn: () => base44.entities.Article.list('-created_date', 500),
  });

  const { data: keywords = [] } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => base44.entities.Keyword.list(),
  });

  const { data: clusters = [] } = useQuery({
    queryKey: ['clusters'],
    queryFn: () => base44.entities.Cluster.list(),
  });

  // Calculate analytics
  const getDaysAgo = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  };

  const filterByTimeRange = (items) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoff = getDaysAgo(days);
    return items.filter(item => new Date(item.created_date) >= cutoff);
  };

  const filteredArticles = filterByTimeRange(articles);

  // Article creation timeline
  const getTimelineData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = getDaysAgo(i);
      const dateStr = format(date, 'MMM dd');
      const count = articles.filter(a => {
        const created = new Date(a.created_date);
        return format(created, 'MMM dd') === dateStr;
      }).length;
      
      data.push({ date: dateStr, articles: count });
    }
    
    return data;
  };

  // Status distribution
  const getStatusData = () => {
    const statusCounts = {
      draft: 0,
      in_review: 0,
      approved: 0,
      published: 0,
      needs_revision: 0
    };

    filteredArticles.forEach(a => {
      if (statusCounts[a.status] !== undefined) {
        statusCounts[a.status]++;
      }
    });

    return Object.entries(statusCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
  };

  // Type distribution
  const getTypeData = () => {
    const typeCounts = {};
    filteredArticles.forEach(a => {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });

    return Object.entries(typeCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
  };

  // Quality scores over time
  const getQualityData = () => {
    const scoredArticles = articles.filter(a => a.editor_score && a.created_date);
    const grouped = {};

    scoredArticles.forEach(a => {
      const dateStr = format(new Date(a.created_date), 'MMM dd');
      if (!grouped[dateStr]) {
        grouped[dateStr] = { date: dateStr, scores: [] };
      }
      grouped[dateStr].scores.push(a.editor_score);
    });

    return Object.values(grouped).map(g => ({
      date: g.date,
      avgScore: (g.scores.reduce((a, b) => a + b, 0) / g.scores.length).toFixed(1)
    })).slice(-30);
  };

  // Cluster performance
  const getClusterData = () => {
    return clusters.slice(0, 10).map(c => ({
      name: c.name.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
      articles: c.article_count || 0,
      keywords: c.keyword_count || 0
    }));
  };

  const stats = {
    totalArticles: articles.length,
    weeklyGrowth: filterByTimeRange(articles.slice(0, 7)).length,
    avgScore: articles.filter(a => a.editor_score).length > 0
      ? (articles.filter(a => a.editor_score).reduce((sum, a) => sum + a.editor_score, 0) / 
         articles.filter(a => a.editor_score).length).toFixed(1)
      : 'N/A',
    publishedRate: ((articles.filter(a => a.status === 'published').length / articles.length) * 100).toFixed(0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytics</h1>
              <p className="text-gray-600 mt-1">Content performance and insights</p>
            </div>
            <Tabs value={timeRange} onValueChange={setTimeRange}>
              <TabsList>
                <TabsTrigger value="7d">7 Days</TabsTrigger>
                <TabsTrigger value="30d">30 Days</TabsTrigger>
                <TabsTrigger value="90d">90 Days</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Articles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                </div>
              </div>
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {stats.weeklyGrowth} this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Quality Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avgScore}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Out of 10</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Published Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.publishedRate}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Completion rate</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">In Review</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {articles.filter(a => a.status === 'in_review').length}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Article Creation Timeline */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Article Production</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getTimelineData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="articles" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getStatusData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Content Type Distribution */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Content Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getTypeData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quality Scores */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Quality Score Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getQualityData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avgScore" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Cluster Performance */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>Top Topic Clusters</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getClusterData()} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="articles" fill="#3b82f6" name="Articles" />
                <Bar dataKey="keywords" fill="#10b981" name="Keywords" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}