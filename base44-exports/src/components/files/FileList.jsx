import React from 'react';
import { 
  Eye, Download,
  FileText, Image, Video, Music, Archive, Code, File as FileIcon,
  FolderOpen
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FILE_TYPE_ICONS = {
  document: FileText, image: Image, video: Video, audio: Music, 
  archive: Archive, code: Code, other: FileIcon
};

export default function FileList({ items, onFileAction, onFolderClick, formatFileSize }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <FileIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">This folder is empty</h3>
        <p className="text-slate-500">Upload files or create a new folder.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-4 p-3 text-xs font-medium text-slate-500 uppercase tracking-wider border-b">
        <div className="col-span-5">Name</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-2">Modified</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>
      <div className="space-y-1">
        {items.map((item) => {
          if (item.type === 'folder') {
            return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 p-3 rounded-lg transition-colors group hover:bg-slate-50 cursor-pointer"
                onClick={() => onFolderClick(item.path)}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  <FolderOpen className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="font-medium text-slate-900 truncate" title={item.name}>{item.name}</p>
                </div>
                <div className="col-span-2 flex items-center"><Badge variant="secondary">Folder</Badge></div>
                <div className="col-span-2 flex items-center text-sm text-slate-600">-</div>
                <div className="col-span-2 flex items-center text-sm text-slate-600">-</div>
                <div className="col-span-1 flex items-center justify-end"></div>
              </div>
            );
          }

          const IconComponent = FILE_TYPE_ICONS[item.file_type] || FileIcon;
          return (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-4 p-3 rounded-lg transition-colors group hover:bg-slate-50"
            >
              <div className="col-span-5 flex items-center gap-3 min-w-0">
                <IconComponent className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <p className="font-medium text-slate-900 truncate" title={item.filename}>{item.filename}</p>
              </div>
              <div className="col-span-2 flex items-center"><Badge variant="secondary" className="capitalize">{item.file_type}</Badge></div>
              <div className="col-span-2 flex items-center text-sm text-slate-600">{formatFileSize(item.file_size)}</div>
              <div className="col-span-2 flex items-center text-sm text-slate-600">{format(new Date(item.created_date), 'MMM d, yyyy')}</div>
              <div className="col-span-1 flex items-center justify-end">
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => onFileAction('preview', item)} className="h-7 w-7 p-0"><Eye className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => onFileAction('download', item)} className="h-7 w-7 p-0"><Download className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}