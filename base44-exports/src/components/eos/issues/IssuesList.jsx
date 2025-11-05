import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EOSIssue } from '@/api/entities';
import { Plus, Search, AlertTriangle, CheckCircle, Clock, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import IssueForm from './IssueForm';

export default function IssuesList({ client }) {
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (client) {
      loadIssues();
    }
  }, [client]);

  useEffect(() => {
    filterIssues();
  }, [issues, searchTerm, filterStatus, filterPriority, filterCategory]);

  const loadIssues = async () => {
    try {
      const issuesData = await EOSIssue.filter({ company_id: client.id }, '-identified_date');
      setIssues(issuesData);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIssues = () => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(issue => issue.status === filterStatus);
    }

    if (filterPriority !== 'all') {
      filtered = filtered.filter(issue => issue.priority.toString() === filterPriority);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(issue => issue.category === filterCategory);
    }

    setFilteredIssues(filtered);
  };

  const handleSaveIssue = async (issueData) => {
    try {
      if (editingIssue) {
        await EOSIssue.update(editingIssue.id, issueData);
      } else {
        await EOSIssue.create({ 
          ...issueData, 
          company_id: client.id,
          identified_date: new Date().toISOString()
        });
      }
      setShowForm(false);
      setEditingIssue(null);
      loadIssues();
    } catch (error) {
      console.error('Error saving issue:', error);
    }
  };

  const handleEditIssue = (issue) => {
    setEditingIssue(issue);
    setShowForm(true);
  };

  const handleDeleteIssue = async (issueId) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await EOSIssue.delete(issueId);
        loadIssues();
      } catch (error) {
        console.error('Error deleting issue:', error);
      }
    }
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      1: 'Critical',
      2: 'High', 
      3: 'Medium',
      4: 'Low',
      5: 'Very Low'
    };
    return labels[priority];
  };

  const getPriorityColor = (priority) => {
    const colors = {
      1: 'bg-red-100 text-red-800 border-red-200',
      2: 'bg-orange-100 text-orange-800 border-orange-200',
      3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      4: 'bg-blue-100 text-blue-800 border-blue-200',
      5: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Solved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Solving':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Discussing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Solved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Solving':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Discussing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Issues List</h3>
          <p className="text-slate-600 mt-1">Identify, track, and solve issues permanently</p>
        </div>
        <Button
          onClick={() => {
            setEditingIssue(null);
            setShowForm(true);
          }}
          className="bg-red-600 hover:bg-red-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Issue
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Identified">Identified</SelectItem>
                  <SelectItem value="Discussing">Discussing</SelectItem>
                  <SelectItem value="Solving">Solving</SelectItem>
                  <SelectItem value="Solved">Solved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="1">Critical</SelectItem>
                  <SelectItem value="2">High</SelectItem>
                  <SelectItem value="3">Medium</SelectItem>
                  <SelectItem value="4">Low</SelectItem>
                  <SelectItem value="5">Very Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Vision">Vision</SelectItem>
                  <SelectItem value="People">People</SelectItem>
                  <SelectItem value="Data">Data</SelectItem>
                  <SelectItem value="Issues">Issues</SelectItem>
                  <SelectItem value="Process">Process</SelectItem>
                  <SelectItem value="Traction">Traction</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {issues.length === 0 ? "No Issues Yet" : "No Matching Issues"}
            </h3>
            <p className="text-slate-500 mb-6">
              {issues.length === 0 
                ? "Great teams identify issues early. Add your first issue to get started with the IDS process."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {issues.length === 0 && (
              <Button
                onClick={() => setShowForm(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Identify First Issue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIssues.map(issue => (
            <Card key={issue.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{issue.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className={getPriorityColor(issue.priority)}>
                        Priority {issue.priority} - {getPriorityLabel(issue.priority)}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(issue.status)}>
                        {getStatusIcon(issue.status)}
                        <span className="ml-1">{issue.status}</span>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditIssue(issue)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {issue.category && (
                  <Badge variant="outline" className="w-fit bg-slate-100 text-slate-700">
                    {issue.category}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {issue.description && (
                    <p className="text-sm text-slate-600 line-clamp-3">
                      {issue.description}
                    </p>
                  )}
                  
                  <div className="text-sm text-slate-600">
                    <div className="font-medium">Owner:</div>
                    <div>{issue.owner_name || issue.owner_email}</div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <div className="text-xs text-slate-500">
                      {new Date(issue.identified_date).toLocaleDateString()}
                    </div>
                    {issue.target_resolution_date && (
                      <div className="text-xs text-slate-500">
                        Due: {new Date(issue.target_resolution_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {issue.target_resolution_date && new Date(issue.target_resolution_date) < new Date() && issue.status !== 'Solved' && (
                    <div className="bg-red-50 border border-red-200 rounded p-2">
                      <div className="text-xs text-red-600 font-medium">Overdue</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <IssueForm
          issue={editingIssue}
          client={client}
          onSave={handleSaveIssue}
          onCancel={() => {
            setShowForm(false);
            setEditingIssue(null);
          }}
        />
      )}
    </div>
  );
}