import React, { useCallback, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CloudUpload, Loader2 } from 'lucide-react';

export default function FileUploadZone({ onUpload, uploading }) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragOver(true);
    }
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      onUpload(files);
    }
  }, [onUpload]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onUpload(files);
    }
  };

  return (
    <Card 
      className={`bg-white/80 backdrop-blur-sm border-2 border-dashed transition-all duration-200 ${
        dragOver 
          ? 'border-emerald-400 bg-emerald-50' 
          : 'border-slate-300 hover:border-emerald-300 hover:bg-emerald-25'
      } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CardContent className="p-8 text-center">
        {uploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-600 mx-auto animate-spin" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Uploading Files...</h3>
              <p className="text-slate-600">Please wait while your files are being uploaded.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <CloudUpload className={`w-12 h-12 mx-auto transition-colors ${dragOver ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                {dragOver ? 'Drop files here' : 'Upload Files'}
              </h3>
              <p className="text-slate-600 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={handleFileSelect}
              />
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </label>
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Supports all file types • Max 5GB per file • Up to 50GB total
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}