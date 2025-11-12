/**
 * PERDIA V2: TOPIC QUESTIONS MANAGER
 * ==================================
 *
 * Manage monthly top-50 higher education questions
 * (Question-first strategy vs keyword-only approach)
 *
 * Features:
 * - View/search questions
 * - Bulk import from CSV
 * - Manual question entry
 * - Usage statistics
 * - Category filtering
 * - Mark as used/archived
 *
 * Created: 2025-11-12
 */

import React, { useState, useEffect } from 'react';
import { TopicQuestion } from '@/lib/perdia-sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  HelpCircle,
  Search,
  Plus,
  Upload,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Archive,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from 'date-fns';

const CATEGORIES = [
  'Online Degrees',
  'Financial Aid',
  'Career Development',
  'Admissions',
  'MBA Programs',
  'Nursing',
  'Accreditation',
  'General Education'
];

export default function TopicQuestionsManager() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const data = await TopicQuestion.find(
        {},
        { orderBy: { column: 'priority_score', ascending: false }, limit: 500 }
      );
      setQuestions(data);
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async (id) => {
    try {
      const question = questions.find(q => q.id === id);
      await TopicQuestion.update(id, {
        times_used: (question.times_used || 0) + 1,
        last_used_at: new Date().toISOString()
      });

      toast.success('Question marked as used');
      loadQuestions();
    } catch (error) {
      console.error("Error marking question:", error);
      toast.error("Failed to mark question");
    }
  };

  const handleArchive = async (id) => {
    try {
      await TopicQuestion.update(id, {
        status: 'archived'
      });

      toast.success('Question archived');
      loadQuestions();
    } catch (error) {
      console.error("Error archiving question:", error);
      toast.error("Failed to archive question");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await TopicQuestion.delete(id);
      toast.success('Question deleted');
      loadQuestions();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (q.keywords && q.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && q.status === 'active') ||
                         (filterStatus === 'archived' && q.status === 'archived') ||
                         (filterStatus === 'used' && q.times_used > 0);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: questions.length,
    active: questions.filter(q => q.status === 'active').length,
    used: questions.filter(q => q.times_used > 0).length,
    archived: questions.filter(q => q.status === 'archived').length
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-indigo-600" />
            Topic Questions Manager
          </h1>
          <p className="text-slate-600 mt-1">Manage monthly top-50 higher education questions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowBulkImportModal(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Import
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Used in Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.used}</div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Archived</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Questions ({filteredQuestions.length})</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Questions</h3>
              <p className="text-slate-500 mb-4">Add your first topic question to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-slate-900 mb-2">
                          {question.question_text}
                        </h3>

                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline">{question.category}</Badge>
                          {question.status === 'active' && (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          )}
                          {question.status === 'archived' && (
                            <Badge className="bg-gray-100 text-gray-800">Archived</Badge>
                          )}
                          {question.times_used > 0 && (
                            <Badge className="bg-purple-100 text-purple-800">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Used {question.times_used}x
                            </Badge>
                          )}
                          {question.priority_score !== undefined && (
                            <Badge variant="outline">
                              Priority: {question.priority_score}
                            </Badge>
                          )}
                        </div>

                        {question.keywords && question.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {question.keywords.slice(0, 5).map((keyword, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {question.keywords.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{question.keywords.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(question.created_date), 'MMM d, yyyy')}
                          </span>
                          {question.last_used_at && (
                            <span>
                              Last used: {format(new Date(question.last_used_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {question.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAsUsed(question.id)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark Used
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleArchive(question.id)}
                            >
                              <Archive className="w-4 h-4 mr-1" />
                              Archive
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(question.id)}
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Question Modal */}
      {showAddModal && (
        <AddQuestionModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={() => {
            loadQuestions();
            setShowAddModal(false);
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <BulkImportModal
          isOpen={showBulkImportModal}
          onClose={() => setShowBulkImportModal(false)}
          onImport={() => {
            loadQuestions();
            setShowBulkImportModal(false);
          }}
        />
      )}
    </div>
  );
}

/**
 * Add Question Modal
 */
function AddQuestionModal({ isOpen, onClose, onSave }) {
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [keywords, setKeywords] = useState('');
  const [priorityScore, setPriorityScore] = useState(50);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!questionText.trim()) {
      toast.error('Question text is required');
      return;
    }

    setSaving(true);
    try {
      await TopicQuestion.create({
        question_text: questionText,
        category,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
        priority_score: priorityScore,
        status: 'active',
        times_used: 0
      });

      toast.success('Question added');
      onSave();
    } catch (error) {
      console.error("Error adding question:", error);
      toast.error("Failed to add question");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Add Topic Question</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Question Text *
            </label>
            <Textarea
              placeholder="What is the best online MBA program for working professionals?"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Category *
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Keywords (comma-separated)
            </label>
            <Input
              placeholder="mba, online, working professionals, business school"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priority Score (0-100)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={priorityScore}
              onChange={(e) => setPriorityScore(parseInt(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Question
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Bulk Import Modal
 */
function BulkImportModal({ isOpen, onClose, onImport }) {
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!csvText.trim()) {
      toast.error('CSV data is required');
      return;
    }

    setImporting(true);
    try {
      // Parse CSV (simple implementation)
      const lines = csvText.trim().split('\n');
      const questions = lines.slice(1).map(line => { // Skip header
        const [question_text, category, keywords_str, priority_score] = line.split(',').map(s => s.trim());
        return {
          question_text,
          category: category || 'General Education',
          keywords: keywords_str ? keywords_str.split(';').map(k => k.trim()) : [],
          priority_score: parseInt(priority_score) || 50,
          status: 'active',
          times_used: 0
        };
      });

      // Bulk insert
      await Promise.all(questions.map(q => TopicQuestion.create(q)));

      toast.success(`Imported ${questions.length} questions`);
      onImport();
    } catch (error) {
      console.error("Error importing questions:", error);
      toast.error("Failed to import questions");
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <Card className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Import Questions (CSV)</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-4">
            <p className="font-semibold mb-2">CSV Format:</p>
            <code className="block bg-white p-2 rounded">
              question_text,category,keywords,priority_score<br />
              What is the best online MBA program?,MBA Programs,mba;online;business,75<br />
              How much does nursing school cost?,Nursing,nursing;tuition;bsn,60
            </code>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paste CSV Data
            </label>
            <Textarea
              placeholder="Paste your CSV data here..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing} className="bg-indigo-600 hover:bg-indigo-700">
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import Questions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
