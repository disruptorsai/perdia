
import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Edit, Calendar as CalendarIcon, Bot, User, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { InvokeLLM } from '@/api/integrations';

const postStatuses = ["Draft", "Needs Review", "Approved", "Scheduled", "Published"];

export default function PostEditorModal({ post, onSave, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [keywords, setKeywords] = useState('');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [editorNotes, setEditorNotes] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  
  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setStatus(post.status || 'Draft');
      setKeywords(post.keywords || '');
      setScheduledDate(post.scheduled_date ? new Date(post.scheduled_date) : null);
      setEditorNotes(post.editor_notes || '');
      
      const rawContent = post.content || '';
      const isLikelyMarkdown = rawContent.trim().startsWith('#') || rawContent.trim().startsWith('* ') || rawContent.trim().startsWith('- ') || rawContent.trim().startsWith('1. ');

      if (isLikelyMarkdown && !rawContent.trim().startsWith('<')) {
        setIsConverting(true);
        InvokeLLM({
          prompt: `Convert the following Markdown text to clean, semantic HTML. Only output the HTML content, with no extra text, code fences, or explanations. Ensure all content is within appropriate HTML tags (e.g., <p>, <h1>, <ul>, <li>). Do not include <html>, <head>, or <body> tags. Output only the content of the body.\n\n---\n\n${rawContent}`
        }).then(html => {
          setContent(html);
        }).catch(err => {
          console.error("Failed to convert content", err);
          setContent(rawContent);
        }).finally(() => {
          setIsConverting(false);
        });
      } else {
        setContent(rawContent);
      }
    }
  }, [post]);

  useEffect(() => {
    const text = content.replace(/<[^>]*>?/gm, '');
    const words = text.match(/\b\w+\b/g);
    setWordCount(words ? words.length : 0);
  }, [content]);

  if (!post) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const updatedData = {
      title,
      content,
      status,
      keywords,
      scheduled_date: scheduledDate ? scheduledDate.toISOString() : null,
      editor_notes: editorNotes,
    };
    
    try {
      await onSave(updatedData);
    } catch (error) {
      console.error("Error saving post:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isAIGenerated = post.ai_generated;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl bg-white shadow-2xl flex flex-col max-h-[95vh]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 font-sans">
              <Edit className="w-5 h-5 pcc-text-blue" />
              Edit Article
            </CardTitle>
            <div className="flex items-center gap-2">
              {isAIGenerated ? (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Bot className="w-3 h-3 mr-1" />
                  AI Generated
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                  <User className="w-3 h-3 mr-1" />
                  Manual
                </Badge>
              )}
              <Badge className={`${getStatusColor(status)}`}>{status}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <div className="flex-grow overflow-y-auto">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="postTitle" className="text-sm font-semibold text-slate-700">
                    Article Title
                  </Label>
                  <Input
                    id="postTitle"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">Content</Label>
                  <div className="bg-white rounded-lg border relative">
                    <div className="absolute top-[10px] right-3 text-xs text-slate-500 font-medium z-10 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                      {wordCount} words
                    </div>
                    {isConverting ? (
                      <div className="h-[565px] flex flex-col items-center justify-center text-center p-4">
                        <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
                        <p className="font-medium text-slate-600">Preparing Rich Text Editor...</p>
                        <p className="text-sm text-slate-500">Converting generated content for editing.</p>
                      </div>
                    ) : (
                      <>
                        <style>
                        {`
                        .modal-editor .ql-container {
                            height: 500px;
                            overflow-y: auto;
                            font-size: 16px;
                        }
                        `}
                        </style>
                        <ReactQuill 
                            className="modal-editor"
                            theme="snow" 
                            value={content} 
                            onChange={setContent} 
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                    ['link', 'blockquote', 'image'],
                                    [{ 'align': [] }],
                                    ['clean']
                                ]
                            }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="postStatus" className="text-sm font-semibold text-slate-700">
                      Publishing Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {postStatuses.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate" className="text-sm font-semibold text-slate-700">
                      Schedule Date (Optional)
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="h-11 w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={scheduledDate}
                          onSelect={setScheduledDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords" className="text-sm font-semibold text-slate-700">
                      SEO Keywords
                    </Label>
                    <Textarea
                      id="keywords"
                      placeholder="Enter comma-separated keywords..."
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="editorNotes" className="text-sm font-semibold text-slate-700">
                      Editorial Notes
                    </Label>
                    <Textarea
                      id="editorNotes"
                      placeholder="Add notes for the editorial team..."
                      value={editorNotes}
                      onChange={(e) => setEditorNotes(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>

                {isAIGenerated && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Bot className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-800">AI Generated Content</p>
                          <p className="text-xs text-blue-700 mt-1">
                            This content was automatically generated by the Blog Content Writer agent and saved to your library for editorial review.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-100 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-11">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 h-11 pcc-bg-blue text-white hover:opacity-90"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );

  function getStatusColor(status) {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'Needs Review': return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Approved': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Scheduled': return 'pcc-bg-coral bg-opacity-20 pcc-text-coral border border-current';
      case 'Published': return 'pcc-bg-green bg-opacity-20 pcc-text-green border border-current';
      default: return 'bg-slate-200 text-slate-800';
    }
  }
}
