
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Download, Calendar, HardDrive, Eye, Music, Edit, Save, Tag, FileText } from 'lucide-react';
import { format } from 'date-fns';

const TagInput = ({ tags, setTags }) => {
    const [inputValue, setInputValue] = useState("");

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = inputValue.trim();
            if (newTag && !tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setInputValue("");
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="rounded-full hover:bg-slate-300">
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>
            <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a tag and press Enter"
            />
        </div>
    );
};

export default function FilePreviewModal({ file, onClose, onFileAction }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableFile, setEditableFile] = useState({ ...file });

  const handleSave = () => {
    onFileAction('update', file, { 
        filename: editableFile.filename,
        description: editableFile.description,
        tags: editableFile.tags
    });
    setIsEditing(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreview = () => {
    const { file_type, file_url, filename, mime_type } = file;
    const googleDocsViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(file_url)}&embedded=true`;

    switch (file_type) {
      case 'image':
        return (
          <div className="flex justify-center items-center bg-slate-100 rounded-lg p-4 min-h-[400px]">
            <img 
              src={file_url} 
              alt={filename}
              className="max-w-full max-h-[600px] object-contain rounded shadow-lg"
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex justify-center items-center bg-black rounded-lg p-4">
            <video 
              controls 
              className="max-w-full max-h-[600px] rounded"
              src={file_url}
            >
              Your browser does not support video playback.
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex justify-center items-center bg-slate-100 rounded-lg p-8">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-slate-200 rounded-full flex items-center justify-center mx-auto">
                <Music className="w-12 h-12 text-slate-400" />
              </div>
              <audio controls className="w-full max-w-md">
                <source src={file_url} type={mime_type} />
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        );
      
      case 'document':
        return (
          <div className="bg-slate-100 rounded-lg p-4 min-h-[600px]">
            <iframe 
              src={googleDocsViewerUrl} 
              className="w-full h-[600px] border-0 rounded"
              title={filename}
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      
      default:
        return (
          <div className="flex justify-center items-center bg-slate-100 rounded-lg p-12 min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-slate-200 rounded-lg flex items-center justify-center mx-auto">
                <Eye className="w-12 h-12 text-slate-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Preview not available</h3>
                <p className="text-slate-600 mb-4">This file type cannot be previewed directly.</p>
                <Button 
                  onClick={() => window.open(file_url, '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download to View
                </Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex overflow-hidden">
        {/* Preview Content */}
        <div className="flex-1 p-6 max-h-full overflow-auto">
          {renderPreview()}
        </div>

        {/* Sidebar for Details */}
        <div className="w-1/3 min-w-[350px] max-w-[400px] bg-slate-50 border-l border-slate-200 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-lg text-slate-800">Details</h3>
            <div className="flex items-center gap-1">
              {isEditing ? (
                <Button onClick={handleSave} size="sm">
                  <Save className="w-4 h-4 mr-2"/>
                  Save
                </Button>
              ) : (
                <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
                  <Edit className="w-4 h-4 mr-2"/>
                  Edit
                </Button>
              )}
              <Button onClick={onClose} variant="ghost" size="icon" className="h-9 w-9 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 overflow-y-auto">
            {isEditing ? (
              <Input 
                value={editableFile.filename}
                onChange={(e) => setEditableFile({...editableFile, filename: e.target.value})}
                className="text-lg font-semibold"
              />
            ) : (
              <h2 className="text-xl font-semibold text-slate-900 break-words" title={file.filename}>
                {file.filename}
              </h2>
            )}

            <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600"><HardDrive className="w-4 h-4 text-slate-400"/> {formatFileSize(file.file_size)}</div>
                <div className="flex items-center gap-2 text-slate-600"><Calendar className="w-4 h-4 text-slate-400"/> Created {format(new Date(file.created_date), 'MMM d, yyyy')}</div>
                <div className="flex items-center gap-2 text-slate-600"><Badge variant="secondary" className="capitalize">{file.file_type}</Badge></div>
            </div>

            <div className="space-y-2">
                <h4 className="font-medium text-slate-800 flex items-center gap-2"><FileText className="w-4 h-4"/>Description</h4>
                {isEditing ? (
                    <Textarea 
                        value={editableFile.description || ''}
                        onChange={(e) => setEditableFile({...editableFile, description: e.target.value})}
                        placeholder="Add a description..."
                        className="h-24"
                    />
                ) : (
                    <p className="text-slate-700 text-sm bg-slate-100 p-3 rounded-md min-h-[50px] whitespace-pre-wrap">
                        {file.description || <span className="text-slate-400">No description.</span>}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <h4 className="font-medium text-slate-800 flex items-center gap-2"><Tag className="w-4 h-4"/>Tags</h4>
                {isEditing ? (
                    <TagInput 
                        tags={editableFile.tags || []} 
                        setTags={(newTags) => setEditableFile({...editableFile, tags: newTags})} 
                    />
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {(file.tags && file.tags.length > 0) ? file.tags.map((tag, index) => (
                          <Badge key={index} variant="outline">{tag}</Badge>
                        )) : <p className="text-slate-400 text-sm">No tags.</p>}
                    </div>
                )}
            </div>

            {file.metadata && Object.keys(file.metadata).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-slate-800 mb-2">Metadata</h4>
                <div className="bg-slate-100 rounded-md p-3">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(file.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div className="pt-4">
                <Button
                  onClick={() => onFileAction('download', file)}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
