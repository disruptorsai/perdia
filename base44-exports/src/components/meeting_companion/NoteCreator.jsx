import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function NoteCreator({ clientId, projects, onSave, onCancel }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState('');

  const handleSave = () => {
    if (!title) {
      toast.error("A title is required to save the note.");
      return;
    }
    onSave({
      title,
      content,
      client_id: clientId,
      project_id: projectId || null,
      note_type: 'text',
    });
  };

  return (
    <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader>
        <CardTitle>Create New Note</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="note-title">Title *</Label>
          <Input 
            id="note-title"
            placeholder="e.g., Q3 Planning Meeting Summary" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="note-content">Notes</Label>
          <Textarea 
            id="note-content"
            placeholder="Capture key decisions, action items, and next steps..." 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
        </div>

        {projects.length > 0 && (
            <div className="space-y-2">
                <Label htmlFor="note-project" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Project (Optional)
                </Label>
                <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger id="note-project">
                        <SelectValue placeholder="Link to a project..." />
                    </SelectTrigger>
                    <SelectContent>
                        {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>
                                {project.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save Note</Button>
      </CardFooter>
    </Card>
  );
}