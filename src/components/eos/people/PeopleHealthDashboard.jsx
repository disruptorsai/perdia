import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EOSPersonAssessment } from '@/lib/perdia-sdk';
import { EOSAccountabilitySeat } from '@/lib/perdia-sdk';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, AlertTriangle, TrendingUp, Target } from 'lucide-react';

export default function PeopleHealthDashboard({ client }) {
  const [healthMetrics, setHealthMetrics] = useState({
    overallScore: 0,
    rightPeoplePercentage: 0,
    rightSeatsPercentage: 0,
    totalPeople: 0,
    openPositions: 0,
    peopleInIssues: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client) {
      loadHealthMetrics();
    }
  }, [client]);

  const loadHealthMetrics = async () => {
    try {
      const [assessments, seats] = await Promise.all([
        EOSPersonAssessment.filter({ client_id: client.id }),
        EOSAccountabilitySeat.filter({ client_id: client.id })
      ]);

      const totalSeats = seats.length;
      const filledSeats = seats.filter(seat => seat.status === 'filled').length;
      const openPositions = totalSeats - filledSeats;
      const issueSeats = seats.filter(seat => seat.status === 'issues').length;

      let rightPeople = 0;
      let rightSeats = 0;
      const totalAssessments = assessments.length;

      assessments.forEach(assessment => {
        if (assessment.right_person) rightPeople++;
        if (assessment.right_seat) rightSeats++;
      });

      const rightPeoplePercentage = totalAssessments > 0 ? Math.round((rightPeople / totalAssessments) * 100) : 0;
      const rightSeatsPercentage = totalAssessments > 0 ? Math.round((rightSeats / totalAssessments) * 100) : 0;
      const overallScore = Math.round((rightPeoplePercentage + rightSeatsPercentage) / 2);

      setHealthMetrics({
        overallScore,
        rightPeoplePercentage,
        rightSeatsPercentage,
        totalPeople: totalAssessments,
        openPositions,
        peopleInIssues: issueSeats
      });
    } catch (error) {
      console.error('Error loading health metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'from-green-50 to-green-100';
    if (score >= 60) return 'from-yellow-50 to-yellow-100';
    return 'from-red-50 to-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <Card className={`bg-gradient-to-br ${getScoreBg(healthMetrics.overallScore)} border-0 shadow-xl`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-green-600" />
              People Health Score
            </span>
            <Badge variant="outline" className={`text-lg px-3 py-1 ${getScoreColor(healthMetrics.overallScore)}`}>
              {healthMetrics.overallScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={healthMetrics.overallScore} className="h-3 mb-4" />
          <p className="text-sm text-slate-600">
            Overall health based on Right People and Right Seats alignment
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{healthMetrics.totalPeople}</div>
            <div className="text-xs text-blue-600 mt-1">Team members assessed</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Right People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{healthMetrics.rightPeoplePercentage}%</div>
            <div className="text-xs text-green-600 mt-1">Share core values</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Right Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{healthMetrics.rightSeatsPercentage}%</div>
            <div className="text-xs text-purple-600 mt-1">Have GWC for role</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{healthMetrics.openPositions + healthMetrics.peopleInIssues}</div>
            <div className="text-xs text-red-600 mt-1">Open positions + issues</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-slate-900 mb-2">Run People Analyzer</h4>
              <p className="text-sm text-slate-600">Assess team members for Right Person, Right Seat fit</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-slate-900 mb-2">Update Accountability Chart</h4>
              <p className="text-sm text-slate-600">Add or modify organizational seats and structure</p>
            </div>
            <div className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
              <h4 className="font-semibold text-slate-900 mb-2">Schedule Reviews</h4>
              <p className="text-sm text-slate-600">Plan upcoming performance and development reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EOS People Philosophy */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg text-slate-800">EOS People Philosophy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Right People</h4>
              <p className="text-sm text-slate-600">Team members who share your Core Values - they fit culturally and demonstrate your company's values consistently.</p>
            </div>
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Right Seats</h4>
              <p className="text-sm text-slate-600">People who have GWC for their role - they Get it (understand), Want it (desire the role), and have the Capacity (skill/time).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}