'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileUploadPreviewProps {
  file: File | null;
  onRemove: () => void;
}

export function FileUploadPreview({ file, onRemove }: FileUploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(() => {
    if (!file) return null;
    return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
  });

  if (!file) return null;

  return (
    <div className="relative mb-4 rounded-lg bg-muted p-2">
      <div className="flex items-center gap-2">
        {preview ? (
          <div className="relative h-20 w-20">
            <Image
              src={preview}
              alt="Upload preview"
              fill
              className="rounded object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded bg-background">
            <span className="text-sm text-muted-foreground">{file.name}</span>
          </div>
        )}
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}