import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageEnlargeDialog({ isOpen, onClose, imageUrl, imageAlt, title }) {
  if (!imageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>{title || 'Featured Image'}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="p-6 overflow-auto">
          <img
            src={imageUrl}
            alt={imageAlt || 'Featured image'}
            className="w-full h-auto rounded-lg"
          />
          {imageAlt && (
            <p className="text-sm text-slate-500 mt-4">
              <strong>Alt Text:</strong> {imageAlt}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
