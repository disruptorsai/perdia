import React, { useState, useEffect } from 'react';
import { Keyword } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Search, Key, Loader2, Trash2, Plus, TrendingUp, Sparkles, ArrowUpDown, Target, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvokeLLM } from '@/api/integrations';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function KeywordManager() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('currently_ranked');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('created_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [uploading, setUploading] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [suggestionInput, setSuggestionInput] = useState('');
  const [generatingSuggestions, setGeneratingSuggestions] = useState(false);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const data = await Keyword.list('-created_date');
      setKeywords(data);
    } catch (error) {
      console.error("Error loading keywords:", error);
      toast.error("Failed to load keywords");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event, listType) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const keywordIndex = headers.findIndex(h => h.includes('keyword'));
      const volumeIndex = headers.findIndex(h => h.includes('volume') || h.includes('searches'));
      const difficultyIndex = headers.findIndex(h => h.includes('difficulty') || h.includes('kd'));
      const categoryIndex = headers.findIndex(h => h.includes('category') || h.includes('cluster'));
      const rankingIndex = headers.findIndex(h => h.includes('ranking') || h.includes('position'));
      
      const keywordsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values[keywordIndex] && values[keywordIndex].trim()) {
          keywordsToImport.push({
            keyword: values[keywordIndex].trim(),
            list_type: listType,
            search_volume: volumeIndex >= 0 ? parseInt(values[volumeIndex]) || 0 : 0,
            difficulty: difficultyIndex >= 0 ? parseInt(values[difficultyIndex]) || 0 : 0,
            category: categoryIndex >= 0 ? values[categoryIndex]?.trim() : '',
            current_ranking: rankingIndex >= 0 ? parseInt(values[rankingIndex]) || null : null,
            priority: 3,
            status: 'queued'
          });
        }
      }

      if (keywordsToImport.length > 0) {
        await Keyword.bulkCreate(keywordsToImport);
        toast.success(`Successfully imported ${keywordsToImport.length} keywords to ${listType === 'currently_ranked' ? 'Currently Ranked' : 'New Target'} list`);
        loadKeywords();
      } else {
        toast.error("No valid keywords found in CSV");
      }
    } catch (error) {
      console.error("Error importing keywords:", error);
      toast.error("Failed to import keywords. Check CSV format.");
    } finally {
      setUploading(false);
    }
  };

  const handleExport = (listType) => {
    const keywordsToExport = keywords.filter(kw => kw.list_type === listType);
    const csv = [
      ['Keyword', 'Search Volume', 'Difficulty', 'Priority', 'Status', 'Current Ranking', 'Category'].join(','),
      ...keywordsToExport.map(kw => [
        kw.keyword,
        kw.search_volume || 0,
        kw.difficulty || 0,
        kw.priority,
        kw.status,
        kw.current_ranking || '',
        kw.category || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keywords-${listType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this keyword?')) return;
    
    try {
      await Keyword.delete(id);
      toast.success('Keyword deleted');
      loadKeywords();
    } catch (error) {
      console.error("Error deleting keyword:", error);
      toast.error("Failed to delete keyword");
    }
  };

  const handleGenerateSuggestions = async () => {
    if (!suggestionInput.trim()) {
      toast.error("Please enter seed keywords or a topic");
      return;
    }

    setGeneratingSuggestions(true);
    try {
      const prompt = `You are an SEO keyword research expert for GetEducated.com, a website that helps adult learners compare online degree programs.

Given the following seed keywords or topic: "${suggestionInput}"

Generate 20-30 highly relevant, related, and adjacent keywords that would be valuable for SEO content targeting adult students researching online education.

Consider:
- Long-tail variations
- Question-based keywords
- Related degree types
- Career outcomes
- Comparison keywords
- Program features

Return ONLY a JSON array of objects with this exact structure:
[
  {
    "keyword": "exact keyword phrase",
    "search_volume": estimated monthly searches (number),
    "difficulty": SEO difficulty 0-100 (number),
    "category": "category name",
    "keyword_type": "short_tail" or "long_tail" or "question"
  }
]

Provide realistic search volume estimates and difficulty scores. Do not include any explanation, only the JSON array.`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  search_volume: { type: "number" },
                  difficulty: { type: "number" },
                  category: { type: "string" },
                  keyword_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      const suggestedKeywords = response.keywords || [];
      
      if (suggestedKeywords.length > 0) {
        const keywordsToCreate = suggestedKeywords.map(kw => ({
          keyword: kw.keyword,
          list_type: 'new_target',
          search_volume: kw.search_volume || 0,
          difficulty: kw.difficulty || 50,
          category: kw.category || 'AI Suggested',
          keyword_type: kw.keyword_type || 'long_tail',
          priority: 3,
          status: 'queued'
        }));

        await Keyword.bulkCreate(keywordsToCreate);
        toast.success(`Added ${keywordsToCreate.length} suggested keywords to New Target list!`);
        setShowSuggestionDialog(false);
        setSuggestionInput('');
        setActiveTab('new_target');
        loadKeywords();
      } else {
        toast.error("No keywords were generated. Try different seed keywords.");
      }
    } catch (error) {
      console.error("Error generating keyword suggestions:", error);
      toast.error("Failed to generate keyword suggestions");
    } finally {
      setGeneratingSuggestions(false);
    }
  };

  const handleAutoCluster = async (listType) => {
    const keywordsToCluster = keywords.filter(kw => kw.list_type === listType);
    
    if (keywordsToCluster.length === 0) {
      toast.error("No keywords to cluster in this list");
      return;
    }

    setLoading(true);
    try {
      const keywordList = keywordsToCluster.slice(0, 100).map(kw => kw.keyword).join(', ');
      
      const prompt = `You are an SEO expert. Analyze these keywords for an online education website and group them into logical clusters/categories.

Keywords: ${keywordList}

Return a JSON object where each keyword is mapped to a category name. Use clear, descriptive category names like "Online MBA Programs", "Nursing Degrees", "Teaching Certifications", etc.

Format:
{
  "keyword1": "Category Name",
  "keyword2": "Category Name",
  ...
}`;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          additionalProperties: { type: "string" }
        }
      });

      // Update keywords with categories
      for (const keyword of keywordsToCluster) {
        if (response[keyword.keyword]) {
          await Keyword.update(keyword.id, {
            category: response[keyword.keyword]
          });
        }
      }

      toast.success("Keywords automatically clustered!");
      loadKeywords();
    } catch (error) {
      console.error("Error clustering keywords:", error);
      toast.error("Failed to cluster keywords");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const getFilteredAndSortedKeywords = (listType) => {
    let filtered = keywords.filter(kw => {
      const matchesListType = kw.list_type === listType;
      const matchesSearch = kw.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (kw.category && kw.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || kw.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || kw.priority.toString() === filterPriority;
      const matchesCategory = filterCategory === 'all' || kw.category === filterCategory;
      return matchesListType && matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch(sortBy) {
        case 'keyword':
          aVal = a.keyword || '';
          bVal = b.keyword || '';
          break;
        case 'search_volume':
          aVal = a.search_volume || 0;
          bVal = b.search_volume || 0;
          break;
        case 'difficulty':
          aVal = a.difficulty || 0;
          bVal = b.difficulty || 0;
          break;
        case 'priority':
          aVal = a.priority || 0;
          bVal = b.priority || 0;
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        default:
          aVal = a.created_date || '';
          bVal = b.created_date || '';
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  };

  const currentlyRankedKeywords = getFilteredAndSortedKeywords('currently_ranked');
  const newTargetKeywords = getFilteredAndSortedKeywords('new_target');

  const categories = [...new Set(keywords.map(kw => kw.category).filter(Boolean))];

  const currentlyRankedStats = {
    total: keywords.filter(k => k.list_type === 'currently_ranked').length,
    queued: keywords.filter(k => k.list_type === 'currently_ranked' && k.status === 'queued').length,
    in_progress: keywords.filter(k => k.list_type === 'currently_ranked' && k.status === 'in_progress').length,
    completed: keywords.filter(k => k.list_type === 'currently_ranked' && k.status === 'completed').length
  };

  const newTargetStats = {
    total: keywords.filter(k => k.list_type === 'new_target').length,
    queued: keywords.filter(k => k.list_type === 'new_target' && k.status === 'queued').length,
    in_progress: keywords.filter(k => k.list_type === 'new_target' && k.status === 'in_progress').length,
    completed: keywords.filter(k => k.list_type === 'new_target' && k.status === 'completed').length
  };

  const KeywordTable = ({ keywords: displayKeywords, listType }) => (
    <>
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : displayKeywords.length === 0 ? (
        <div className="text-center py-12">
          <Key className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Keywords Yet</h3>
          <p className="text-slate-500 mb-4">
            {listType === 'currently_ranked' 
              ? 'Upload keywords you currently rank for or move keywords from the New Target list'
              : 'Upload new target keywords or use AI to generate suggestions'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('keyword')} className="font-semibold">
                    Keyword
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('category')} className="font-semibold">
                    Category
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('search_volume')} className="font-semibold">
                    Volume
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('difficulty')} className="font-semibold">
                    Difficulty
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" size="sm" onClick={() => handleSort('priority')} className="font-semibold">
                    Priority
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
                {listType === 'currently_ranked' && (
                  <TableHead className="text-center">Ranking</TableHead>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayKeywords.map((keyword) => (
                <TableRow key={keyword.id}>
                  <TableCell className="font-medium max-w-xs">{keyword.keyword}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {keyword.category ? (
                      <Badge variant="outline">{keyword.category}</Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">{keyword.search_volume?.toLocaleString() || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={keyword.difficulty > 70 ? 'destructive' : keyword.difficulty > 40 ? 'default' : 'secondary'}>
                      {keyword.difficulty || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{keyword.priority}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={keyword.status === 'completed' ? 'default' : 'outline'}>
                      {keyword.status}
                    </Badge>
                  </TableCell>
                  {listType === 'currently_ranked' && (
                    <TableCell className="text-center">{keyword.current_ranking || '-'}</TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(keyword.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            Keyword Manager
          </h1>
          <p className="text-slate-600 mt-1">Upload, organize, and rotate thousands of target keywords</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/60 backdrop-blur-sm h-auto p-2 rounded-xl border border-slate-200 shadow-lg">
          <TabsTrigger 
            value="currently_ranked" 
            className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg"
          >
            <ListChecks className="w-4 h-4" />
            Currently Ranked ({currentlyRankedStats.total})
          </TabsTrigger>
          <TabsTrigger 
            value="new_target" 
            className="h-full py-3 px-4 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-600 transition-all duration-300 flex items-center justify-center gap-2 rounded-lg"
          >
            <Target className="w-4 h-4" />
            New Target Keywords ({newTargetStats.total})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="currently_ranked" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{currentlyRankedStats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Queued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{currentlyRankedStats.queued}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{currentlyRankedStats.in_progress}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{currentlyRankedStats.completed}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Currently Ranked Keywords Tools</CardTitle>
              <CardDescription>
                Manage keywords you already rank for - optimize existing content to improve rankings
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={() => document.getElementById('file-upload-ranked').click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload CSV
              </Button>
              <input
                id="file-upload-ranked"
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'currently_ranked')}
                className="hidden"
              />
              <Button variant="outline" onClick={() => handleExport('currently_ranked')} disabled={currentlyRankedStats.total === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleAutoCluster('currently_ranked')}
                disabled={currentlyRankedStats.total === 0 || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                Auto-Cluster Keywords
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>Currently Ranked Keywords ({currentlyRankedKeywords.length})</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="1">Priority 1</SelectItem>
                      <SelectItem value="2">Priority 2</SelectItem>
                      <SelectItem value="3">Priority 3</SelectItem>
                      <SelectItem value="4">Priority 4</SelectItem>
                      <SelectItem value="5">Priority 5</SelectItem>
                    </SelectContent>
                  </Select>
                  {categories.length > 0 && (
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <KeywordTable keywords={currentlyRankedKeywords} listType="currently_ranked" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new_target" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Total Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{newTargetStats.total}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Queued</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{newTargetStats.queued}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{newTargetStats.in_progress}</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{newTargetStats.completed}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New Target Keywords Tools</CardTitle>
              <CardDescription>
                Manage new keywords to target - create fresh content to rank for these terms
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Button onClick={() => document.getElementById('file-upload-new').click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload CSV
              </Button>
              <input
                id="file-upload-new"
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload(e, 'new_target')}
                className="hidden"
              />
              <Button variant="outline" onClick={() => handleExport('new_target')} disabled={newTargetStats.total === 0}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Dialog open={showSuggestionDialog} onValueChange={setShowSuggestionDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
                    AI Keyword Suggestions
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Generate Keyword Suggestions</DialogTitle>
                    <DialogDescription>
                      Enter seed keywords or topics, and AI will suggest 20-30 related keywords for your SEO strategy
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Seed Keywords or Topic</label>
                      <Textarea
                        placeholder="e.g., online MBA programs, nursing degrees, teaching certification"
                        value={suggestionInput}
                        onChange={(e) => setSuggestionInput(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <Button 
                      onClick={handleGenerateSuggestions} 
                      disabled={generatingSuggestions}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                    >
                      {generatingSuggestions ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Suggestions...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Keywords
                        </>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                onClick={() => handleAutoCluster('new_target')}
                disabled={newTargetStats.total === 0 || loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                Auto-Cluster Keywords
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>New Target Keywords ({newTargetKeywords.length})</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <div className="relative flex-1 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Search keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="queued">Queued</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="1">Priority 1</SelectItem>
                      <SelectItem value="2">Priority 2</SelectItem>
                      <SelectItem value="3">Priority 3</SelectItem>
                      <SelectItem value="4">Priority 4</SelectItem>
                      <SelectItem value="5">Priority 5</SelectItem>
                    </SelectContent>
                  </Select>
                  {categories.length > 0 && (
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <KeywordTable keywords={newTargetKeywords} listType="new_target" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}